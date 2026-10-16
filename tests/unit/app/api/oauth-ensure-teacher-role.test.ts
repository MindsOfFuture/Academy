import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "@/tests/mocks/fake-db";

// Spec 017: a etapa final do cadastro de professor não promove ninguém.

const STUDENT = "00000000-0000-0000-0000-0000000000b1";
const TEACHER = "00000000-0000-0000-0000-0000000000e1";
const APPROVED = "00000000-0000-0000-0000-0000000000e2";

const state = vi.hoisted(() => ({ caller: null as string | null, db: null as ReturnType<typeof createFakeDb> | null }));

vi.mock("@/lib/supabase/server", () => ({
    createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: state.caller ? { id: state.caller } : null }, error: null }) },
    }),
    createServiceRoleClient: async () => state.db,
    createAdminClient: async () => state.db,
}));
vi.mock("@/lib/api/notifications-server", () => ({ createNotification: vi.fn(), notifyAdmins: vi.fn() }));

import { POST } from "@/app/api/auth/oauth-ensure-teacher-role/route";

describe("POST /api/auth/oauth-ensure-teacher-role", () => {
    beforeEach(() => {
        state.db = createFakeDb({
            role: [
                { id: 2, name: "teacher" },
                { id: 3, name: "student" },
            ],
            user_role: [
                { user_profile_id: STUDENT, role_id: 3 },
                { user_profile_id: TEACHER, role_id: 2 },
                { user_profile_id: APPROVED, role_id: 2 },
            ],
            user_profile: [
                { id: STUDENT, verification_status: null },
                { id: TEACHER, verification_status: null },
                { id: APPROVED, verification_status: "approved" },
            ],
        });
    });

    it("aluno não vira professor por esta rota", async () => {
        state.caller = STUDENT;
        const res = await POST();
        expect(res.status).toBe(403);
        expect(state.db!.updates).toEqual([]);
        expect(state.db!.writes).toEqual([]);
    });

    it("professor recém-cadastrado fica aguardando aprovação", async () => {
        state.caller = TEACHER;
        const res = await POST();
        expect(res.status).toBe(200);
        expect(state.db!.updates).toEqual([
            expect.objectContaining({ table: "user_profile", values: expect.objectContaining({ verification_status: "pending" }), filters: { id: TEACHER } }),
        ]);
    });

    it("professor aprovado continua aprovado", async () => {
        state.caller = APPROVED;
        const res = await POST();
        expect(res.status).toBe(200);
        expect(state.db!.updates).toEqual([]);
    });
});
