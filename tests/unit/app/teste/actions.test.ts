import { beforeEach, describe, expect, it, vi } from "vitest";

const { entrarNoTeste, rateLimit } = vi.hoisted(() => ({ entrarNoTeste: vi.fn(), rateLimit: vi.fn() }));
vi.mock("@/lib/api/teste-participante", () => ({ entrarNoTeste }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit, clientIp: () => "127.0.0.1" }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }) }));

import { entrar } from "@/app/teste/actions";

describe("action do teste", () => {
  beforeEach(() => { vi.clearAllMocks(); rateLimit.mockReturnValue(true); entrarNoTeste.mockResolvedValue(undefined); });
  const dados = (cpf = "529.982.247-25") => { const f = new FormData(); f.set("nome", " Ana Silva "); f.set("cpf", cpf); return f; };

  it("recusa CPF inválido", async () => {
    expect(await entrar({}, dados("000.000.000-00"))).toEqual({ erro: "Informe um CPF válido." });
    expect(entrarNoTeste).not.toHaveBeenCalled();
  });

  it("aplica o limite por IP", async () => {
    rateLimit.mockReturnValue(false);
    expect((await entrar({}, dados())).erro).toMatch(/Muitas tentativas/);
  });

  it("normaliza os dados e direciona à Jornada completa", async () => {
    await expect(entrar({}, dados())).rejects.toThrow("REDIRECT:/lg2/jornada/index.html");
    expect(entrarNoTeste).toHaveBeenCalledWith("Ana Silva", "52998224725");
  });
});
