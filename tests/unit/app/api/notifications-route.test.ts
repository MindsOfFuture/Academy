import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "@/tests/mocks/fake-db";

// Spec 017: a rota só avisa quem tem relação real com quem envia, e o texto
// sai do banco, não do corpo do pedido.

const ADMIN = "00000000-0000-0000-0000-0000000000a1";
const ADMIN_RATE = "00000000-0000-0000-0000-0000000000a2";
const TEACHER = "00000000-0000-0000-0000-0000000000e1";
const OTHER_TEACHER = "00000000-0000-0000-0000-0000000000e2";
const STUDENT = "00000000-0000-0000-0000-0000000000b1";
const STRANGER = "00000000-0000-0000-0000-0000000000b2";
const COURSE = "c0000000-0000-0000-0000-000000000001";
const LESSON = "d0000000-0000-0000-0000-000000000001";
const ASSIGNMENT = "f0000000-0000-0000-0000-000000000001";
const SUBMISSION = "f0000000-0000-0000-0000-0000000000a1";

const state = vi.hoisted(() => ({ caller: null as string | null, db: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
    createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: state.caller ? { id: state.caller } : null } }) },
    }),
    createServiceRoleClient: async () => state.db,
    createAdminClient: async () => state.db,
}));

const { createNotification } = vi.hoisted(() => ({ createNotification: vi.fn() }));
vi.mock("@/lib/api/notifications-server", () => ({
    createNotification,
    notifyAdmins: vi.fn(),
    getUserNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
}));

import { POST } from "@/app/api/notifications/route";

function seed() {
    return createFakeDb({
        role: [
            { id: 1, name: "admin" },
            { id: 2, name: "teacher" },
            { id: 3, name: "student" },
        ],
        user_role: [
            { user_profile_id: ADMIN, role_id: 1 },
            { user_profile_id: ADMIN_RATE, role_id: 1 },
            { user_profile_id: TEACHER, role_id: 2 },
            { user_profile_id: OTHER_TEACHER, role_id: 2 },
            { user_profile_id: STUDENT, role_id: 3 },
            { user_profile_id: STRANGER, role_id: 3 },
        ],
        user_profile: [{ id: STUDENT, full_name: "Ana <b>Aluna</b>" }],
        course: [{ id: COURSE, title: "Robótica", owner_id: TEACHER }],
        lesson: [{ id: LESSON, course_id: COURSE }],
        assignment: [{ id: ASSIGNMENT, title: "Montar o robô", created_by: TEACHER, lesson_id: LESSON }],
        enrollment: [{ id: "e1", user_id: STUDENT, course_id: COURSE }],
        assignment_submission: [
            {
                id: SUBMISSION,
                user_id: STUDENT,
                assignment_id: ASSIGNMENT,
                score: 9,
                feedback: "Muito bom",
                graded_at: "2026-10-16T12:00:00Z",
            },
        ],
    });
}

async function post(caller: string | null, body: unknown) {
    state.caller = caller;
    return POST(
        new Request("http://local/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }),
    );
}

const PHISHING = {
    title: "<h1>Sua conta foi bloqueada</h1>",
    message: "<a href=https://site-falso.example>Clique para reativar</a>",
    href: "@site-falso.example/login",
};

describe("POST /api/notifications — quem pode avisar quem", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.db = seed();
    });

    it("exige sessão", async () => {
        const res = await post(null, { userId: STUDENT, type: "new_enrollment", payload: { courseId: COURSE } });
        expect(res.status).toBe(401);
    });

    it.each([
        ["tipo que nenhuma tela usa (aprovação de professor)", STUDENT, { userId: TEACHER, type: "teacher_approved", payload: PHISHING }],
        ["matrícula de outra pessoa, sem ser dono do curso", STRANGER, { userId: STUDENT, type: "new_enrollment", payload: { ...PHISHING, courseId: COURSE } }],
        ["matrícula que não existe", STRANGER, { userId: STRANGER, type: "new_enrollment", payload: { ...PHISHING, courseId: "c-inexistente" } }],
        ["entrega avisando quem não é o autor da atividade", STUDENT, { userId: OTHER_TEACHER, type: "assignment_submitted", payload: { ...PHISHING, assignmentId: ASSIGNMENT } }],
        ["entrega sem ter entregado", STRANGER, { userId: TEACHER, type: "assignment_submitted", payload: { ...PHISHING, assignmentId: ASSIGNMENT } }],
        ["correção por professor de fora do curso", OTHER_TEACHER, { userId: STUDENT, type: "assignment_graded", payload: { ...PHISHING, submissionId: SUBMISSION } }],
        ["correção avisando outro aluno", TEACHER, { userId: STRANGER, type: "assignment_graded", payload: { ...PHISHING, submissionId: SUBMISSION } }],
        ["chat de quem não é da turma nem professor", STRANGER, { userId: STUDENT, type: "chat_message", payload: { ...PHISHING, assignmentId: ASSIGNMENT, studentId: STUDENT } }],
        ["chat do aluno para alguém que não é o professor", STUDENT, { userId: STRANGER, type: "chat_message", payload: { ...PHISHING, assignmentId: ASSIGNMENT, studentId: STUDENT } }],
        ["chat sobre aluno que não está matriculado", TEACHER, { userId: STRANGER, type: "chat_message", payload: { ...PHISHING, assignmentId: ASSIGNMENT, studentId: STRANGER } }],
    ])("recusa com 403: %s", async (_name, caller, body) => {
        const res = await post(caller, body);
        expect(res.status).toBe(403);
        expect(createNotification).not.toHaveBeenCalled();
    });

    it("aluno avisa a si mesmo da matrícula, com texto montado no servidor", async () => {
        const res = await post(STUDENT, { userId: STUDENT, type: "new_enrollment", payload: { ...PHISHING, courseId: COURSE } });
        expect(res.status).toBe(200);
        expect(createNotification).toHaveBeenCalledWith({
            userId: STUDENT,
            type: "new_enrollment",
            payload: {
                title: "Robótica",
                message: "Você foi matriculado no curso: Robótica.",
                href: `/course?id=${COURSE}`,
                courseId: COURSE,
            },
        });
    });

    it("dono do curso avisa o aluno que matriculou", async () => {
        const res = await post(TEACHER, { userId: STUDENT, type: "new_enrollment", payload: { courseId: COURSE } });
        expect(res.status).toBe(200);
    });

    it("aluno que entregou avisa o autor da atividade", async () => {
        const res = await post(STUDENT, { userId: TEACHER, type: "assignment_submitted", payload: { ...PHISHING, assignmentId: ASSIGNMENT } });
        expect(res.status).toBe(200);
        const { payload } = createNotification.mock.calls[0][0];
        expect(payload.title).toBe("Nova entrega: Montar o robô");
        expect(payload.href).toBe("/protected?tab=corrections");
    });

    it("professor do curso avisa a correção com a nota do banco, não a do pedido", async () => {
        const res = await post(TEACHER, {
            userId: STUDENT,
            type: "assignment_graded",
            payload: { submissionId: SUBMISSION, score: 10, message: "Nota: 10" },
        });
        expect(res.status).toBe(200);
        const { payload } = createNotification.mock.calls[0][0];
        expect(payload.message).toContain("Nota: 9");
        expect(payload.score).toBe(9);
    });

    it.each([
        ["aluno → autor da atividade", STUDENT, TEACHER],
        ["professor → aluno", TEACHER, STUDENT],
        ["admin → aluno", ADMIN, STUDENT],
    ])("chat permitido: %s", async (_name, caller, target) => {
        const res = await post(caller, { userId: target, type: "chat_message", payload: { assignmentId: ASSIGNMENT, studentId: STUDENT } });
        expect(res.status).toBe(200);
    });

    it("limita o número de avisos por pessoa", async () => {
        const body = { userId: STUDENT, type: "chat_message", payload: { assignmentId: ASSIGNMENT, studentId: STUDENT } };
        for (let i = 0; i < 60; i += 1) {
            expect((await post(ADMIN_RATE, body)).status).toBe(200);
        }
        expect((await post(ADMIN_RATE, body)).status).toBe(429);
    });
});
