import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * `concederPapel` tem a regra de ramo da camada de equipe (spec 012): quem
 * nunca foi membro é inserido, quem está desligado volta só com os papéis
 * escolhidos, quem está ativo soma os escolhidos aos que já tem, e quem já tem
 * o papel pedido recebe recusa clara em vez de erro de chave duplicada.
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

import { buscarUsuarioPorEmail, concederPapel, definirPapel, listarEquipe } from "@/lib/api/gestao/equipe";

const SO_BOLSISTA = { coordenacao: false, bolsista: true };
const SO_COORDENACAO = { coordenacao: true, bolsista: false };
const AMBOS = { coordenacao: true, bolsista: true };

describe("lib/api/gestao/equipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    updateEq.mockResolvedValue({ error: null });
  });

  it("insere quem nunca foi membro e reativa o desligado só com os papéis escolhidos", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(concederPapel("u-novo", AMBOS)).resolves.toEqual(AMBOS);
    expect(insert).toHaveBeenCalledWith({ user_profile_id: "u-novo", coordenacao: true, bolsista: true });

    maybeSingle.mockResolvedValueOnce({ data: { ...AMBOS, desligado_em: "2026-01-01" }, error: null });
    await expect(concederPapel("u-antigo", SO_BOLSISTA)).resolves.toEqual(SO_BOLSISTA);
    expect(update).toHaveBeenCalledWith({ coordenacao: false, bolsista: true, desligado_em: null });
    expect(updateEq).toHaveBeenCalledWith("user_profile_id", "u-antigo");
  });

  it("soma o papel a quem já está ativo e recusa o papel que a pessoa já tem", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { ...SO_COORDENACAO, desligado_em: null }, error: null });
    await expect(concederPapel("u-coord", SO_BOLSISTA)).resolves.toEqual(AMBOS);
    expect(update).toHaveBeenCalledWith({ coordenacao: true, bolsista: true, desligado_em: null });

    maybeSingle.mockResolvedValueOnce({ data: { ...AMBOS, desligado_em: null }, error: null });
    await expect(concederPapel("u-ambos", SO_COORDENACAO)).rejects.toThrow("gestao: esta pessoa já tem esse papel na equipe");
    expect(update).toHaveBeenCalledTimes(1);
    expect(insert).not.toHaveBeenCalled();
  });

  it("dá ou tira um papel só, deixando o outro como está", async () => {
    await definirPapel("u-1", "bolsista", true);
    expect(update).toHaveBeenLastCalledWith({ bolsista: true });
    await definirPapel("u-1", "coordenacao", false);
    expect(update).toHaveBeenLastCalledWith({ coordenacao: false });
    expect(updateEq).toHaveBeenCalledWith("user_profile_id", "u-1");
  });

  it("lê a equipe e a busca por e-mail pelas funções do schema gestao", async () => {
    rpc.mockResolvedValueOnce({
      data: [
        {
          user_profile_id: "u-1",
          nome: null,
          email: "a@x",
          coordenacao: true,
          bolsista: true,
          desligado_em: null,
          membro_desde: "2026-01-01",
          bolsa_id: "b-1",
          modalidade: "graduacao",
          carga_semanal_horas: "20.0",
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
    expect(membro).toMatchObject({ coordenacao: true, bolsista: true });
    expect(membro.bolsaVigente).toEqual({
      id: "b-1",
      modalidade: "graduacao",
      cargaSemanalHoras: 20,
      inicio: "2026-01-01",
      fim: "2026-12-31",
    });

    rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(buscarUsuarioPorEmail("ninguem@x")).resolves.toBeNull();
    expect(rpc).toHaveBeenLastCalledWith("buscar_usuario_por_email", { p_email: "ninguem@x" });

    rpc.mockResolvedValueOnce({ data: null, error: { message: "gestao: apenas a coordenação vê a equipe" } });
    await expect(listarEquipe()).rejects.toThrow("apenas a coordenação");
  });
});
