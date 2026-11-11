import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
const createUser = vi.fn();
const rpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signInWithPassword } }),
  createServiceRoleClient: async () => ({ auth: { admin: { createUser } }, rpc }),
}));

import { entrarNoTeste } from "@/lib/api/teste-participante";

describe("entrada no teste", () => {
  beforeEach(() => { vi.clearAllMocks(); process.env.SUPABASE_SERVICE_ROLE_KEY = "segredo-de-teste"; rpc.mockResolvedValue({ error: null }); });

  it("cria uma vez, reaproveita a conta e incrementa os acessos em cada entrada", async () => {
    signInWithPassword
      .mockResolvedValueOnce({ data: {}, error: new Error("não existe") })
      .mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null })
      .mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    createUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    await entrarNoTeste("Ana Silva", "52998224725");
    await entrarNoTeste("Ana Silva", "52998224725");

    expect(createUser).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenLastCalledWith("registrar_teste_participante", { p_user_id: "u1", p_nome: "Ana Silva", p_cpf: "52998224725" });
    const email = signInWithPassword.mock.calls[0][0].email;
    expect(email).not.toContain("52998224725");
  });
});
