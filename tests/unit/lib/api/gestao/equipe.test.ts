import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * `concederPapel` tem a única regra de ramo da camada de equipe: quem já foi
 * membro e está desligado é reativado (update), quem nunca foi é inserido, e
 * quem já está ativo recebe recusa clara em vez de erro de chave duplicada.
 * O mock exige `schema("gestao")` para nunca cair no schema `public`.
 */

const maybeSingle = vi.fn();
const insert = vi.fn();
const updateEq = vi.fn();
const update = vi.fn(() => ({ eq: updateEq }));
const rpc = vi.fn();

const tabela = {
  select: () => ({ eq: () => ({ maybeSingle }) }),
  insert,
  update,
};

const schema = vi.fn((nome: string) => {
  if (nome !== "gestao") throw new Error(`schema inesperado: ${nome}`);
  return { from: () => tabela, rpc };
});

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ schema })) }));

import { buscarUsuarioPorEmail, concederPapel, listarEquipe } from "@/lib/api/gestao/equipe";

describe("lib/api/gestao/equipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    updateEq.mockResolvedValue({ error: null });
  });

  it("insere quem nunca foi membro, reativa o desligado e recusa quem já está ativo", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await concederPapel("u-novo", "bolsista");
    expect(insert).toHaveBeenCalledWith({ user_profile_id: "u-novo", papel: "bolsista" });

    maybeSingle.mockResolvedValueOnce({ data: { user_profile_id: "u-antigo", desligado_em: "2026-01-01" }, error: null });
    await concederPapel("u-antigo", "coordenacao");
    expect(update).toHaveBeenCalledWith({ papel: "coordenacao", desligado_em: null });
    expect(updateEq).toHaveBeenCalledWith("user_profile_id", "u-antigo");

    maybeSingle.mockResolvedValueOnce({ data: { user_profile_id: "u-ativo", desligado_em: null }, error: null });
    await expect(concederPapel("u-ativo", "bolsista")).rejects.toThrow("gestao: esta pessoa já faz parte da equipe");
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("lê a equipe e a busca por e-mail pelas funções do schema gestao", async () => {
    rpc.mockResolvedValueOnce({
      data: [
        {
          user_profile_id: "u-1",
          nome: null,
          email: "a@x",
          papel: "bolsista",
          desligado_em: null,
          membro_desde: "2026-01-01",
          bolsa_id: "b-1",
          modalidade: "graduacao",
          carga_semanal_horas: "20.0",
          valor_mensal: "700.00",
          bolsa_inicio: "2026-01-01",
          bolsa_fim: "2026-12-31",
          tem_alocacao: true,
        },
      ],
      error: null,
    });
    const [membro] = await listarEquipe();
    expect(rpc).toHaveBeenCalledWith("equipe");
    expect(membro.nome).toBe("Pessoa sem nome no cadastro");
    expect(membro.bolsaVigente).toMatchObject({ cargaSemanalHoras: 20, valorMensal: 700 });

    rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(buscarUsuarioPorEmail("ninguem@x")).resolves.toBeNull();
    expect(rpc).toHaveBeenLastCalledWith("buscar_usuario_por_email", { p_email: "ninguem@x" });

    rpc.mockResolvedValueOnce({ data: null, error: { message: "gestao: apenas a coordenação vê a equipe" } });
    await expect(listarEquipe()).rejects.toThrow("apenas a coordenação");
  });
});
