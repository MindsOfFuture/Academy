import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { type AssignmentSummary, type AssignmentRow, type SubmissionSummary, type SubmissionWithStudent, type PendingSubmission, type RoleName } from "./types";

function mapAssignment(row: AssignmentRow): AssignmentSummary {
    return {
        id: row.id,
        lessonId: row.lesson_id,
        title: row.title,
        description: row.description ?? null,
        dueDate: row.due_date ?? null,
        maxScore: row.max_score ?? null,
        createdAt: row.created_at ?? null,
    };
}

async function getCurrentUserAndRole(supabase: ReturnType<typeof createBrowserSupabase>): Promise<{ userId: string | null; role: RoleName; }> {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;
    if (!userId) return { userId: null, role: "unknown" };

    const { data: roleData } = await supabase
        .from("user_role")
        .select("role(name)")
        .eq("user_profile_id", userId)
        .maybeSingle();

    const rawRole = Array.isArray(roleData?.role) ? roleData?.role[0] : roleData?.role;
    const role: RoleName = rawRole?.name === "admin" || rawRole?.name === "teacher" || rawRole?.name === "student"
        ? (rawRole.name as RoleName)
        : "student";

    return { userId, role };
}

async function getCourseOwnerByAssignmentId(
    supabase: ReturnType<typeof createBrowserSupabase>,
    assignmentId: string,
): Promise<string | null> {
    const { data } = await supabase
        .from("assignment")
        .select("lesson:lesson_id(course:course_id(owner_id))")
        .eq("id", assignmentId)
        .maybeSingle();

    const lesson = Array.isArray(data?.lesson) ? data?.lesson?.[0] : data?.lesson;
    const course = Array.isArray(lesson?.course) ? lesson?.course?.[0] : lesson?.course;
    return (course?.owner_id as string | undefined) ?? null;
}

async function getCourseOwnerBySubmissionId(
    supabase: ReturnType<typeof createBrowserSupabase>,
    submissionId: string,
): Promise<string | null> {
    const { data } = await supabase
        .from("assignment_submission")
        .select("assignment:assignment_id(lesson:lesson_id(course:course_id(owner_id)))")
        .eq("id", submissionId)
        .maybeSingle();

    const assignment = Array.isArray(data?.assignment) ? data?.assignment?.[0] : data?.assignment;
    const lesson = Array.isArray(assignment?.lesson) ? assignment?.lesson?.[0] : assignment?.lesson;
    const course = Array.isArray(lesson?.course) ? lesson?.course?.[0] : lesson?.course;
    return (course?.owner_id as string | undefined) ?? null;
}

async function ensureAssignmentOwnerOrAdmin(
    supabase: ReturnType<typeof createBrowserSupabase>,
    assignmentId: string,
    userId: string | null,
    role: RoleName,
): Promise<void> {
    if (role !== "teacher") return;
    if (!userId) throw new Error("Usuário não autenticado.");
    const ownerId = await getCourseOwnerByAssignmentId(supabase, assignmentId);
    if (!ownerId || ownerId !== userId) throw new Error("Acesso negado.");
}

async function ensureSubmissionOwnerOrAdmin(
    supabase: ReturnType<typeof createBrowserSupabase>,
    submissionId: string,
    userId: string | null,
    role: RoleName,
): Promise<void> {
    if (role !== "teacher") return;
    if (!userId) throw new Error("Usuário não autenticado.");
    const ownerId = await getCourseOwnerBySubmissionId(supabase, submissionId);
    if (!ownerId || ownerId !== userId) throw new Error("Acesso negado.");
}

// Lista atividades de uma lição específica
export async function listLessonAssignments(lessonId: string): Promise<AssignmentSummary[]> {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
        .from("assignment")
        .select("id, lesson_id, title, description, due_date, max_score, created_at")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data.map((row) => mapAssignment(row as AssignmentRow));
}

// Lista todas as atividades de um curso
export async function listCourseAssignments(courseId: string): Promise<AssignmentSummary[]> {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
        .from("assignment")
        .select(`
            id, 
            lesson_id, 
            title, 
            description, 
            due_date, 
            max_score, 
            created_at,
            lesson!inner(course_id)
        `)
        .eq("lesson.course_id", courseId)
        .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data.map((row) => mapAssignment(row as unknown as AssignmentRow));
}

// Cria uma nova atividade
export async function createAssignment(params: {
    lessonId: string;
    title: string;
    description?: string;
    dueDate?: string;
    maxScore?: number;
}): Promise<AssignmentSummary | null> {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    if (!userId) throw new Error("Usuário não autenticado.");

    if (role === "teacher") {
        const { data: lessonRow } = await supabase
            .from("lesson")
            .select("course:course_id(owner_id)")
            .eq("id", params.lessonId)
            .maybeSingle();
        const course = Array.isArray(lessonRow?.course) ? lessonRow?.course?.[0] : lessonRow?.course;
        if (!course?.owner_id || course.owner_id !== userId) {
            throw new Error("Acesso negado.");
        }
    }

    const { data, error } = await supabase
        .from("assignment")
        .insert({
            lesson_id: params.lessonId,
            title: params.title,
            description: params.description || null,
            due_date: params.dueDate || null,
            max_score: params.maxScore || null,
            created_by: userId,
        })
        .select("id, lesson_id, title, description, due_date, max_score, created_at")
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapAssignment(data as AssignmentRow);
}

// Atualiza uma atividade existente
export async function updateAssignment(
    assignmentId: string,
    params: {
        title?: string;
        description?: string | null;
        dueDate?: string | null;
        maxScore?: number | null;
    }
): Promise<AssignmentSummary | null> {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    await ensureAssignmentOwnerOrAdmin(supabase, assignmentId, userId, role);

    const updateData: Record<string, unknown> = {};
    if (params.title !== undefined) updateData.title = params.title;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.dueDate !== undefined) updateData.due_date = params.dueDate;
    if (params.maxScore !== undefined) updateData.max_score = params.maxScore;

    const { data, error } = await supabase
        .from("assignment")
        .update(updateData)
        .eq("id", assignmentId)
        .select("id, lesson_id, title, description, due_date, max_score, created_at")
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapAssignment(data as AssignmentRow);
}

// Remove uma atividade
export async function deleteAssignment(assignmentId: string): Promise<boolean> {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    await ensureAssignmentOwnerOrAdmin(supabase, assignmentId, userId, role);

    // Primeiro remove todas as submissões relacionadas
    await supabase.from("assignment_submission").delete().eq("assignment_id", assignmentId);

    // Depois remove a atividade
    const { error } = await supabase.from("assignment").delete().eq("id", assignmentId);
    return !error;
}

// Obtém uma atividade específica
export async function getAssignment(assignmentId: string): Promise<AssignmentSummary | null> {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
        .from("assignment")
        .select("id, lesson_id, title, description, due_date, max_score, created_at")
        .eq("id", assignmentId)
        .maybeSingle();

    if (error || !data) return null;
    return mapAssignment(data as AssignmentRow);
}

// Busca a submissão do aluno para uma atividade
export async function getUserSubmission(assignmentId: string): Promise<SubmissionSummary | null> {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return null;

    const { data, error } = await supabase
        .from("assignment_submission")
        .select("*")
        .eq("assignment_id", assignmentId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error || !data) return null;

    return {
        id: data.id,
        assignmentId: data.assignment_id,
        enrollmentId: data.enrollment_id ?? null,
        userId: data.user_id ?? null,
        submittedAt: data.submitted_at ?? null,
        answerUrl: data.answer_url ?? null,
        contentUrl: data.content_url ?? null,
        comments: data.comments ?? null,
        score: data.score ?? null,
        feedback: data.feedback ?? null,
        gradedAt: data.graded_at ?? null,
    };
}

// Busca todas as submissões do usuário para um curso
export async function getUserCourseSubmissions(courseId: string): Promise<Record<string, SubmissionSummary>> {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return {};

    const { data: assignments } = await supabase
        .from("assignment")
        .select(`id, lesson!inner(course_id)`)
        .eq("lesson.course_id", courseId);

    if (!assignments || assignments.length === 0) return {};

    const assignmentIds = assignments.map(a => a.id);

    const { data: submissions, error } = await supabase
        .from("assignment_submission")
        .select("*")
        .in("assignment_id", assignmentIds)
        .eq("user_id", user.id);

    if (error || !submissions) return {};

    const result: Record<string, SubmissionSummary> = {};
    for (const sub of submissions) {
        result[sub.assignment_id] = {
            id: sub.id,
            assignmentId: sub.assignment_id,
            enrollmentId: sub.enrollment_id ?? null,
            userId: sub.user_id ?? null,
            submittedAt: sub.submitted_at ?? null,
            answerUrl: sub.answer_url ?? null,
            contentUrl: sub.content_url ?? null,
            comments: sub.comments ?? null,
            score: sub.score ?? null,
            feedback: sub.feedback ?? null,
            gradedAt: sub.graded_at ?? null,
        };
    }
    return result;
}

// Submete uma atividade (criar nova submissão)
export async function submitAssignment(params: {
    assignmentId: string;
    contentUrl?: string;
    answerUrl?: string;
    comments?: string;
}): Promise<SubmissionSummary | null> {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Usuário não autenticado.");

    const { data: assignmentData } = await supabase
        .from("assignment")
        .select("lesson!inner(course_id)")
        .eq("id", params.assignmentId)
        .single();

    let enrollmentId: string | null = null;
    if (assignmentData?.lesson) {
        const lesson = Array.isArray(assignmentData.lesson)
            ? assignmentData.lesson[0]
            : assignmentData.lesson;
        const courseId = (lesson as { course_id: string }).course_id;
        const { data: enrollment } = await supabase
            .from("enrollment")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .maybeSingle();
        enrollmentId = enrollment?.id ?? null;
    }

    const { data, error } = await supabase
        .from("assignment_submission")
        .insert({
            assignment_id: params.assignmentId,
            user_id: user.id,
            enrollment_id: enrollmentId,
            content_url: params.contentUrl || null,
            answer_url: params.answerUrl || null,
            comments: params.comments || null,
            submitted_at: new Date().toISOString(),
        })
        .select("*")
        .single();

    if (error) throw error;
    if (!data) return null;

    // --- Notify the teacher about the new submission ---
    try {
        const { data: assignment } = await supabase
            .from("assignment")
            .select("created_by, title")
            .eq("id", params.assignmentId)
            .maybeSingle();

        if (assignment?.created_by) {
            const { data: profile } = await supabase
                .from("user_profile")
                .select("full_name")
                .eq("id", user.id)
                .maybeSingle();

            fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: assignment.created_by,
                    type: "assignment_submitted",
                    payload: {
                        title: `Nova entrega: ${assignment.title || "Atividade"}`,
                        message: `O aluno ${profile?.full_name || "Estudante"} entregou a atividade "${assignment.title || "Atividade"}".`,
                        href: `/protected?tab=corrections`,
                    },
                }),
            }).catch(() => { });
        }
    } catch {
        // Notification failure should not block submission
    }

    return {
        id: data.id,
        assignmentId: data.assignment_id,
        enrollmentId: data.enrollment_id ?? null,
        userId: data.user_id ?? null,
        submittedAt: data.submitted_at ?? null,
        answerUrl: data.answer_url ?? null,
        contentUrl: data.content_url ?? null,
        comments: data.comments ?? null,
        score: data.score ?? null,
        feedback: data.feedback ?? null,
        gradedAt: data.graded_at ?? null,
    };
}

// Atualiza uma submissão existente
export async function updateSubmission(
    submissionId: string,
    params: {
        contentUrl?: string;
        answerUrl?: string;
        comments?: string;
    }
): Promise<SubmissionSummary | null> {
    const supabase = createBrowserSupabase();

    const { data, error } = await supabase
        .from("assignment_submission")
        .update({
            content_url: params.contentUrl,
            answer_url: params.answerUrl,
            comments: params.comments,
            submitted_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select("*")
        .single();

    if (error) throw error;
    if (!data) return null;

    return {
        id: data.id,
        assignmentId: data.assignment_id,
        enrollmentId: data.enrollment_id ?? null,
        userId: data.user_id ?? null,
        submittedAt: data.submitted_at ?? null,
        answerUrl: data.answer_url ?? null,
        contentUrl: data.content_url ?? null,
        comments: data.comments ?? null,
        score: data.score ?? null,
        feedback: data.feedback ?? null,
        gradedAt: data.graded_at ?? null,
    };
}

// Remove uma submissão
export async function deleteSubmission(submissionId: string): Promise<boolean> {
    const supabase = createBrowserSupabase();
    const { error } = await supabase
        .from("assignment_submission")
        .delete()
        .eq("id", submissionId);
    return !error;
}

// Lista todas as submissões de uma atividade (para professores)
export async function listAssignmentSubmissions(assignmentId: string): Promise<SubmissionWithStudent[]> {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    await ensureAssignmentOwnerOrAdmin(supabase, assignmentId, userId, role);

    const { data, error } = await supabase
        .from("assignment_submission")
        .select(`
            *,
            enrollment:enrollment_id(
                user_profile:user_id(full_name, email)
            )
        `)
        .eq("assignment_id", assignmentId)
        .order("submitted_at", { ascending: false });

    if (error || !data) return [];

    return data.map((sub) => {
        const profile = sub.enrollment?.user_profile;
        return {
            id: sub.id,
            assignmentId: sub.assignment_id,
            enrollmentId: sub.enrollment_id ?? null,
            userId: sub.user_id ?? null,
            submittedAt: sub.submitted_at ?? null,
            answerUrl: sub.answer_url ?? null,
            contentUrl: sub.content_url ?? null,
            comments: sub.comments ?? null,
            score: sub.score ?? null,
            feedback: sub.feedback ?? null,
            gradedAt: sub.graded_at ?? null,
            studentName: profile?.full_name ?? "Aluno",
            studentEmail: profile?.email ?? null,
        };
    });
}

// Corrige uma submissão (para professores)
export async function gradeSubmission(
    submissionId: string,
    params: {
        score: number;
        feedback: string;
    }
): Promise<SubmissionSummary | null> {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    await ensureSubmissionOwnerOrAdmin(supabase, submissionId, userId, role);

    const { data, error } = await supabase
        .from("assignment_submission")
        .update({
            score: params.score,
            feedback: params.feedback,
            graded_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select("*")
        .single();

    if (error) throw error;
    if (!data) return null;

    // --- Notify student about the grading ---
    if (data.user_id && data.assignment_id) {
        try {
            const { data: assignment } = await supabase
                .from("assignment")
                .select("title")
                .eq("id", data.assignment_id)
                .maybeSingle();

            const assignmentTitle = assignment?.title || "Atividade";

            fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: data.user_id,
                    type: "assignment_graded",
                    payload: {
                        title: `Atividade corrigida: ${assignmentTitle}`,
                        message: `Sua atividade "${assignmentTitle}" foi corrigida. Nota: ${params.score}. Feedback: ${params.feedback}`,
                        href: `/protected/activitie?id=${data.assignment_id}`,
                        assignmentId: data.assignment_id,
                        submissionId: data.id,
                        score: params.score,
                    },
                }),
            }).catch(() => { }); // fire-and-forget
        } catch {
            // Notification failure must not block grading
        }
    }

    return {
        id: data.id,
        assignmentId: data.assignment_id,
        enrollmentId: data.enrollment_id ?? null,
        userId: data.user_id ?? null,
        submittedAt: data.submitted_at ?? null,
        answerUrl: data.answer_url ?? null,
        contentUrl: data.content_url ?? null,
        comments: data.comments ?? null,
        score: data.score ?? null,
        feedback: data.feedback ?? null,
        gradedAt: data.graded_at ?? null,
    };
}

// Lista todas as submissões pendentes de correção (para professores)
export async function listPendingSubmissions(): Promise<PendingSubmission[]> {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    if (!userId) return [];

    let query = supabase
        .from("assignment_submission")
        .select(`
            *,
            enrollment:enrollment_id(
                user_profile:user_id(full_name, email)
            ),
            assignment:assignment_id!inner(
                id,
                title,
                max_score,
                lesson:lesson_id!inner(
                    id,
                    title,
                    course:course_id!inner(id, title, owner_id)
                )
            )
        `)
        .is("graded_at", null);

    if (role === "teacher") {
        query = query.eq("assignment.lesson.course.owner_id", userId);
    }

    const { data, error } = await query.order("submitted_at", { ascending: true });

    if (error || !data) return [];

    return data.map((sub) => {
        const profile = sub.enrollment?.user_profile;
        const assignment = sub.assignment;
        const lesson = assignment?.lesson;
        const course = lesson?.course;

        return {
            id: sub.id,
            assignmentId: sub.assignment_id,
            enrollmentId: sub.enrollment_id ?? null,
            userId: sub.user_id ?? null,
            submittedAt: sub.submitted_at ?? null,
            answerUrl: sub.answer_url ?? null,
            contentUrl: sub.content_url ?? null,
            comments: sub.comments ?? null,
            score: sub.score ?? null,
            feedback: sub.feedback ?? null,
            gradedAt: sub.graded_at ?? null,
            studentName: profile?.full_name ?? "Aluno",
            studentEmail: profile?.email ?? null,
            assignmentTitle: assignment?.title ?? "Atividade",
            assignmentMaxScore: assignment?.max_score ?? null,
            courseName: course?.title ?? "Curso",
            courseId: course?.id ?? "",
            lessonTitle: lesson?.title ?? "Aula",
        };
    });
}

// Lista todas as submissões já corrigidas (para professores)
export async function listGradedSubmissions(): Promise<PendingSubmission[]> {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    if (!userId) return [];

    let query = supabase
        .from("assignment_submission")
        .select(`
            *,
            enrollment:enrollment_id(
                user_profile:user_id(full_name, email)
            ),
            assignment:assignment_id!inner(
                id,
                title,
                max_score,
                lesson:lesson_id!inner(
                    id,
                    title,
                    course:course_id!inner(id, title, owner_id)
                )
            )
        `)
        .not("graded_at", "is", null);

    if (role === "teacher") {
        query = query.eq("assignment.lesson.course.owner_id", userId);
    }

    const { data, error } = await query.order("graded_at", { ascending: false });

    if (error || !data) return [];

    return data.map((sub) => {
        const profile = sub.enrollment?.user_profile;
        const assignment = sub.assignment;
        const lesson = assignment?.lesson;
        const course = lesson?.course;

        return {
            id: sub.id,
            assignmentId: sub.assignment_id,
            enrollmentId: sub.enrollment_id ?? null,
            userId: sub.user_id ?? null,
            submittedAt: sub.submitted_at ?? null,
            answerUrl: sub.answer_url ?? null,
            contentUrl: sub.content_url ?? null,
            comments: sub.comments ?? null,
            score: sub.score ?? null,
            feedback: sub.feedback ?? null,
            gradedAt: sub.graded_at ?? null,
            studentName: profile?.full_name ?? "Aluno",
            studentEmail: profile?.email ?? null,
            assignmentTitle: assignment?.title ?? "Atividade",
            assignmentMaxScore: assignment?.max_score ?? null,
            courseName: course?.title ?? "Curso",
            courseId: course?.id ?? "",
            lessonTitle: lesson?.title ?? "Aula",
        };
    });
}

// Remove a correção de uma submissão (volta para pendente)
export async function deleteGrade(submissionId: string): Promise<boolean> {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    await ensureSubmissionOwnerOrAdmin(supabase, submissionId, userId, role);

    const { error } = await supabase
        .from("assignment_submission")
        .update({
            score: null,
            feedback: null,
            graded_at: null,
            graded_by: null,
        })
        .eq("id", submissionId);

    if (error) throw error;
    return true;
}
