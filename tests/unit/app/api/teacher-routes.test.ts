import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  update: vi.fn(),
  getAllUsers: vi.fn(),
  setStatus: vi.fn(),
  fetchRole: vi.fn(),
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock("@/lib/api/profiles-server", () => ({
  updateCurrentTeacherProfileWithReverification: m.update,
  getAllUsers: m.getAllUsers,
  setTeacherVerificationStatusByAdmin: m.setStatus,
  fetchRoleForUser: m.fetchRole,
}));
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: m.createAdminClient,
  createClient: m.createClient,
  createServiceRoleClient: m.createServiceRoleClient,
}));

import { PATCH } from "@/app/api/teacher/profile/route";
import { GET, POST } from "@/app/api/admin/teacher-verification/route";
import { POST as EXCLUIR } from "@/app/api/profile/delete-account/route";

const req = (body: unknown) =>
  new Request("http://localhost/x", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("PATCH /api/teacher/profile", () => {
  it.each([
    ["Usuário não autenticado.", 401],
    ["Apenas professores podem atualizar este perfil.", 403],
    ["Envie o comprovante de qualificação para reenviar sua solicitação.", 400],
    ["falha qualquer", 500],
  ])("%s -> %i", async (mensagem, status) => {
    m.update.mockRejectedValue(new Error(mensagem));
    const res = await PATCH(req({}));
    expect(res.status).toBe(status);
  });
});

describe("/api/admin/teacher-verification", () => {
  it("GET: não-admin recebe 403", async () => {
    m.createAdminClient.mockRejectedValue(new Error("Acesso negado. Permissões de administrador necessárias."));
    expect((await GET()).status).toBe(403);
  });

  it("GET: falha do banco é 500", async () => {
    m.createAdminClient.mockResolvedValue({});
    m.getAllUsers.mockRejectedValue(new Error("db"));
    expect((await GET()).status).toBe(500);
  });

  it.each([
    ["Usuário informado não é professor.", 400],
    ["Não é possível aprovar sem anexo de qualificação do professor.", 400],
    ["Acesso negado. Permissões de administrador necessárias.", 403],
    ["outra", 500],
  ])("POST: %s -> %i", async (mensagem, status) => {
    m.setStatus.mockRejectedValue(new Error(mensagem));
    const res = await POST(req({ userId: "u1", status: "approved" }));
    expect(res.status).toBe(status);
  });
});

describe("POST /api/profile/delete-account", () => {
  const ENTRADA = { confirmation: "EXCLUIR" };

  function preparar(deleteUserError: { message: string } | null) {
    const cadeia: Record<string, unknown> = {};
    cadeia.update = () => cadeia;
    cadeia.delete = () => cadeia;
    cadeia.eq = () => cadeia;
    cadeia.then = (resolve: (v: unknown) => void) => resolve({ error: null });
    m.createClient.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: "u1" } }, error: null }) } });
    m.fetchRole.mockResolvedValue("student");
    m.createServiceRoleClient.mockResolvedValue({
      from: () => cadeia,
      auth: { admin: { deleteUser: async () => ({ error: deleteUserError }) } },
    });
  }

  it("falha ao excluir a conta de acesso devolve 500", async () => {
    preparar({ message: "boom" });
    const res = await EXCLUIR(req(ENTRADA));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain("Falha ao excluir conta de acesso");
  });

  it("sem erro devolve 200", async () => {
    preparar(null);
    const res = await EXCLUIR(req(ENTRADA));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
