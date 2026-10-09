import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { agruparCarga, diferencas, limitesDoMes } from "@/lib/api/gestao/alocacao";
import { validarEncontro, validarMudancaAlocacao } from "@/lib/api/gestao/validacao";

/**
 * Spec 014 — a soma da carga e o histórico legível. As horas de cada alocação
 * vêm prontas do banco (`v_carga`, provada em PGlite); aqui se prova a divisão
 * por escola e por turma, que é o que mostra a troca de escola no meio do mês.
 */

function form(campos: Record<string, string | string[]>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) for (const item of [v].flat()) f.append(k, item);
  return f;
}

describe("agruparCarga", () => {
  it("bolsista em duas escolas no mês: total e divisão por escola e turma", () => {
    const linhas = [
      { bolsista_id: "bia", data: "2026-10-05", escola_id: "e1", turma_id: "t1", horas: "4.00" },
      { bolsista_id: "bia", data: "2026-10-12", escola_id: "e1", turma_id: "t1", horas: "4.00" },
      { bolsista_id: "bia", data: "2026-10-19", escola_id: "e2", turma_id: "t2", horas: "2.50" },
      { bolsista_id: "bia", data: "2026-10-20", escola_id: "e2", turma_id: null, horas: "0" },
      { bolsista_id: "caio", data: "2026-10-19", escola_id: "e2", turma_id: "t2", horas: 4 },
    ];
    const carga = agruparCarga(
      linhas,
      new Map([["bia", "Bia"], ["caio", "Caio"]]),
      new Map([["e1", "Escola 1"], ["e2", "Escola 2"]]),
      new Map([["t1", "Lego"], ["t2", "IA"]]),
    );

    expect(carga.map((c) => [c.nome, c.total])).toEqual([["Bia", 10.5], ["Caio", 4]]);
    expect(carga[0].porEscola).toEqual([
      { escolaId: "e1", nome: "Escola 1", horas: 8 },
      { escolaId: "e2", nome: "Escola 2", horas: 2.5 },
    ]);
    // Linha que não conta (0 h) não aparece como turma.
    expect(carga[0].porTurma.map((t) => t.nome)).toEqual(["Lego", "IA"]);
  });
});

describe("diferencas", () => {
  it("devolve só o que mudou, com nome no lugar do id de pessoa", () => {
    const antes = { id: "x", situacao: "prevista", coberto_por: null, atualizado_em: "1", carga: "4h" };
    const depois = { id: "x", situacao: "substituida", coberto_por: "caio", atualizado_em: "2", carga: "4h" };
    expect(diferencas(antes, depois, new Map([["caio", "Caio"]]))).toEqual([
      { campo: "situacao", antes: "prevista", depois: "substituida" },
      { campo: "coberto_por", antes: null, depois: "Caio" },
    ]);
  });
});

describe("validações da alocação", () => {
  it("encontro exige início e fim, e fim depois do início", () => {
    const base = { data: "2026-10-05", inicio: "13:00", fim: "17:00", escolaId: "e1", modalidade: "Lego" };
    expect(validarEncontro(form({ ...base, fim: "" }))).toMatchObject({ ok: false });
    expect(validarEncontro(form({ ...base, fim: "12:00" }))).toMatchObject({ ok: false });
    expect(validarEncontro(form({ ...base, equipe: ["a", "b", "a"] }))).toMatchObject({
      ok: true,
      valor: { equipe: ["a", "b"], turmaId: null },
    });
    // Sem turma e sem escola: tarefa ou reunião fora de escola.
    expect(validarEncontro(form({ ...base, escolaId: "" }))).toMatchObject({ ok: true, valor: { escolaId: null } });
    // Com turma, a escola do formulário é ignorada: vale a da turma.
    expect(validarEncontro(form({ ...base, turmaId: "t1" }))).toMatchObject({ ok: true, valor: { escolaId: null, turmaId: "t1" } });
  });

  it("parcial precisa de chegada e saída; retirar exige motivo", () => {
    expect(validarMudancaAlocacao(form({ situacao: "prevista", inicio: "14:00" }))).toMatchObject({ ok: false });
    expect(validarMudancaAlocacao(form({ situacao: "retirada" }))).toMatchObject({ ok: false });
    expect(validarMudancaAlocacao(form({ situacao: "prevista", inicio: "14:00", fim: "17:00", cobertoPor: "b2" }))).toEqual({
      ok: true,
      valor: { situacao: "prevista", inicio: "14:00", fim: "17:00", cobertoPor: "b2", motivo: null },
    });
  });

  it("limites do mês acertam fevereiro", () => {
    expect(limitesDoMes("2028-02")).toEqual({ de: "2028-02-01", ate: "2028-02-29" });
  });
});
