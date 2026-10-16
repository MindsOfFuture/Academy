import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { fetchRoleForUser } from "./profiles-server";
import type { NotificationPayload, NotificationType } from "./notifications-server";

/**
 * Quem pode avisar quem pela rota POST /api/notifications.
 *
 * A rota é chamada do navegador, então nada do corpo é confiável: cada tipo de
 * aviso confere no banco a relação real entre quem envia e quem recebe
 * (matrícula, autoria da atividade, dono do curso) e o texto, o título e o link
 * são montados aqui, a partir do banco. O que o cliente mandou em `title`,
 * `message` e `href` é descartado.
 */

type Db = Awaited<ReturnType<typeof createServiceRoleClient>>;

export type NotificationRequest = {
    userId?: unknown;
    type?: unknown;
    payload?: Record<string, unknown> | null;
};

export type AuthorizedNotification = {
    userId: string;
    type: NotificationType;
    payload: NotificationPayload;
};

function texto(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

type AssignmentContext = {
    id: string;
    title: string;
    createdBy: string | null;
    courseId: string | null;
    courseOwnerId: string | null;
};

async function assignmentContext(db: Db, assignmentId: string): Promise<AssignmentContext | null> {
    const { data: assignment } = await db
        .from("assignment")
        .select("id, title, created_by, lesson_id")
        .eq("id", assignmentId)
        .maybeSingle();
    if (!assignment) return null;

    const { data: lesson } = await db
        .from("lesson")
        .select("course_id")
        .eq("id", assignment.lesson_id)
        .maybeSingle();
    const courseId = (lesson?.course_id as string | undefined) ?? null;

    let courseOwnerId: string | null = null;
    if (courseId) {
        const { data: course } = await db.from("course").select("owner_id").eq("id", courseId).maybeSingle();
        courseOwnerId = (course?.owner_id as string | undefined) ?? null;
    }

    return {
        id: assignment.id as string,
        title: (assignment.title as string | null) || "Atividade",
        createdBy: (assignment.created_by as string | null) ?? null,
        courseId,
        courseOwnerId,
    };
}

async function isEnrolled(db: Db, userId: string, courseId: string | null): Promise<boolean> {
    if (!courseId) return false;
    const { data } = await db
        .from("enrollment")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .limit(1)
        .maybeSingle();
    return Boolean(data);
}

async function isAdmin(db: Db, userId: string): Promise<boolean> {
    return (await fetchRoleForUser(userId, db as never)) === "admin";
}

/** Admin, autor da atividade ou dono do curso dela. */
async function isAssignmentStaff(db: Db, callerId: string, ctx: AssignmentContext): Promise<boolean> {
    if (ctx.createdBy === callerId || ctx.courseOwnerId === callerId) return true;
    return isAdmin(db, callerId);
}

async function newEnrollment(db: Db, callerId: string, targetId: string, payload: Record<string, unknown>) {
    const courseId = texto(payload.courseId);
    if (!courseId) return null;

    const { data: course } = await db.from("course").select("id, title, owner_id").eq("id", courseId).maybeSingle();
    if (!course) return null;
    if (!(await isEnrolled(db, targetId, courseId))) return null;

    const allowed = callerId === targetId || course.owner_id === callerId || (await isAdmin(db, callerId));
    if (!allowed) return null;

    const title = (course.title as string | null) || "Novo Curso";
    return {
        title,
        message: `Você foi matriculado no curso: ${title}.`,
        href: `/course?id=${encodeURIComponent(courseId)}`,
        courseId,
    };
}

async function assignmentSubmitted(db: Db, callerId: string, targetId: string, payload: Record<string, unknown>) {
    const assignmentId = texto(payload.assignmentId);
    if (!assignmentId) return null;

    const ctx = await assignmentContext(db, assignmentId);
    if (!ctx || !ctx.createdBy || ctx.createdBy !== targetId) return null;

    // Só quem entregou de fato avisa o professor.
    const { data: submission } = await db
        .from("assignment_submission")
        .select("id")
        .eq("assignment_id", assignmentId)
        .eq("user_id", callerId)
        .limit(1)
        .maybeSingle();
    if (!submission) return null;

    const { data: profile } = await db.from("user_profile").select("full_name").eq("id", callerId).maybeSingle();
    const studentName = (profile?.full_name as string | null) || "Estudante";

    return {
        title: `Nova entrega: ${ctx.title}`,
        message: `O aluno ${studentName} entregou a atividade "${ctx.title}".`,
        href: "/protected?tab=corrections",
        assignmentId,
    };
}

async function assignmentGraded(db: Db, callerId: string, targetId: string, payload: Record<string, unknown>) {
    const submissionId = texto(payload.submissionId);
    if (!submissionId) return null;

    const { data: submission } = await db
        .from("assignment_submission")
        .select("id, user_id, assignment_id, score, feedback, graded_at")
        .eq("id", submissionId)
        .maybeSingle();
    if (!submission || submission.user_id !== targetId || !submission.graded_at) return null;

    const ctx = await assignmentContext(db, submission.assignment_id as string);
    if (!ctx || !(await isAssignmentStaff(db, callerId, ctx))) return null;

    return {
        title: `Atividade corrigida: ${ctx.title}`,
        message: `Sua atividade "${ctx.title}" foi corrigida. Nota: ${submission.score ?? "-"}. Feedback: ${submission.feedback ?? ""}`,
        href: `/protected/activitie?id=${encodeURIComponent(ctx.id)}`,
        assignmentId: ctx.id,
        submissionId,
        score: submission.score ?? null,
    };
}

async function chatMessage(db: Db, callerId: string, targetId: string, payload: Record<string, unknown>) {
    const assignmentId = texto(payload.assignmentId);
    const studentId = texto(payload.studentId);
    if (!assignmentId || !studentId) return null;

    const ctx = await assignmentContext(db, assignmentId);
    if (!ctx || !(await isEnrolled(db, studentId, ctx.courseId))) return null;

    const href = `/protected/activitie?id=${encodeURIComponent(assignmentId)}`;

    if (callerId === studentId) {
        // Aluno escreve: só o autor da atividade recebe.
        if (!ctx.createdBy || ctx.createdBy !== targetId || targetId === callerId) return null;
        return {
            title: "Nova mensagem no chat",
            message: `O aluno enviou uma mensagem na atividade "${ctx.title}".`,
            href,
            assignmentId,
            studentId,
        };
    }

    // Professor escreve: só o aluno daquela conversa recebe.
    if (targetId !== studentId || !(await isAssignmentStaff(db, callerId, ctx))) return null;
    return {
        title: "Nova mensagem do professor",
        message: `O professor enviou uma mensagem na atividade "${ctx.title}".`,
        href,
        assignmentId,
        studentId,
    };
}

const BUILDERS = {
    new_enrollment: newEnrollment,
    assignment_submitted: assignmentSubmitted,
    assignment_graded: assignmentGraded,
    chat_message: chatMessage,
} as const;

/**
 * Devolve o aviso pronto para gravar, ou `null` quando quem chama não tem
 * relação com o destinatário para aquele tipo de aviso (a rota responde 403).
 */
export async function authorizeNotification(
    db: Db,
    callerId: string,
    request: NotificationRequest,
): Promise<AuthorizedNotification | null> {
    const targetId = texto(request.userId);
    const type = texto(request.type);
    if (!targetId || !type || !(type in BUILDERS)) return null;

    const builder = BUILDERS[type as keyof typeof BUILDERS];
    const payload = await builder(db, callerId, targetId, request.payload ?? {});
    if (!payload) return null;

    return { userId: targetId, type: type as NotificationType, payload };
}
