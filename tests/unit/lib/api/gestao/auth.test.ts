import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockClient = {
  auth: { getUser: vi.fn() },
  rpc: vi.fn(),
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

import { ensureGestaoMember, getGestaoPapel } from "@/lib/api/gestao/auth";

describe("lib/api/gestao/auth — autorização de membro", () => {
  const flagOriginal = process.env.GESTAO_ENABLED;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GESTAO_ENABLED = "true";
    mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    mockClient.rpc.mockResolvedValue({ data: null, error: null });
  });

  it("devolve null para anônimo, sem chamar a RPC", async () => {
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(getGestaoPapel()).resolves.toBeNull();
    expect(mockClient.rpc).not.toHaveBeenCalled();
  });

  it("resolve o papel via RPC gestao_membro_papel", async () => {
    mockClient.rpc.mockResolvedValue({ data: "coordenacao", error: null });
    await expect(getGestaoPapel()).resolves.toBe("coordenacao");
    expect(mockClient.rpc).toHaveBeenCalledWith("gestao_membro_papel");
  });

  it("devolve null quando a RPC retorna papel desconhecido", async () => {
    mockClient.rpc.mockResolvedValue({ data: "visitante", error: null });
    await expect(getGestaoPapel()).resolves.toBeNull();
  });

  it("devolve null quando a RPC retorna dados ausentes", async () => {
    mockClient.rpc.mockResolvedValue({ data: null, error: null });
    await expect(getGestaoPapel()).resolves.toBeNull();
  });

  it("propaga erro da RPC sem mascará-lo", async () => {
    mockClient.rpc.mockResolvedValue({ data: null, error: { message: "indisponível" } });
    await expect(getGestaoPapel()).rejects.toThrow("indisponível");
  });

  afterEach(() => {
    if (flagOriginal === undefined) delete process.env.GESTAO_ENABLED;
    else process.env.GESTAO_ENABLED = flagOriginal;
  });

  describe("ensureGestaoMember", () => {
    it("nega até coordenação com o módulo desligado, sem consultar o banco", async () => {
      delete process.env.GESTAO_ENABLED;
      mockClient.rpc.mockResolvedValue({ data: "coordenacao", error: null });
      await expect(ensureGestaoMember()).rejects.toThrow(/módulo de gestão está desligado/);
      expect(mockClient.rpc).not.toHaveBeenCalled();
    });

    it("nega acesso a usuário autenticado sem papel (403)", async () => {
      mockClient.rpc.mockResolvedValue({ data: null, error: null });
      await expect(ensureGestaoMember()).rejects.toThrow(/Acesso negado/);
    });

    it("nega acesso a anônimo com mensagem de autenticação", async () => {
      mockClient.auth.getUser.mockResolvedValue({ data: { user: null } });
      await expect(ensureGestaoMember()).rejects.toThrow(/não autenticado/);
    });

    it.each(["coordenacao", "bolsista"])("permite membro %s", async (papel) => {
      mockClient.rpc.mockResolvedValue({ data: papel, error: null });
      await expect(ensureGestaoMember()).resolves.toBe(papel);
    });
  });
});