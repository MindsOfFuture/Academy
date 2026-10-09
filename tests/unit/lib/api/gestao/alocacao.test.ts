import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { acharSobreposicoes, agruparCarga, diferencas, limitesDoMes } from "@/lib/api/gestao/alocacao";
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
  const escolas = new Map([["e1", "Escola 1"], ["e2", "Escola 2"]]);
  const turmas = new Map([["t1", "Lego"], ["t2", "IA"]]);

  it("bolsista em duas escolas no mês: total e divisão por escola e turma", () => {
    const linhas = [
      { bolsista_id: "bia", data: "2026-10-05", escola_id: "e1", turma_id: "t1", horas: "4.00" },
      { bolsista_id: "bia", data: "2026-10-12", escola_id: "e1", turma_id: "t1", horas: "4.00" },
      { bolsista_id: "bia", data: "2026-10-19", escola_id: "e2", turma_id: "t2", horas: "2.50" },
      { bolsista_id: "bia", data: "2026-10-20", escola_id: "e2", turma_id: null, horas: "0" },
      { bolsista_id: "caio", data: "2026-10-19", escola_id: "e2", turma_id: "t2", horas: 4 },
    ];
    const bolsistas = [
      { id: "bia", nome: "Bia", ativo: true },
      { id: "caio", nome: "Caio", ativo: true },
    ];
    const carga = agruparCarga(linhas, bolsistas, escolas, turmas);

    expect(carga.map((c) => [c.nome, c.total])).toEqual([["Bia", 10.5], ["Caio", 4]]);
    expect(carga[0].porEscola).toEqual([
      { escolaId: "e1", nome: "Escola 1", horas: 8 },
      { escolaId: "e2", nome: "Escola 2", horas: 2.5 },
    ]);
    // Linha que não conta (0 h) não aparece como turma.
    expect(carga[0].porTurma.map((t) => t.nome)).toEqual(["Lego", "IA"]);
  });

  it("todo bolsista ativo aparece, mesmo com 0 h; só coordenação nunca; desligado só com horas", () => {
    const linhas = [
      { bolsista_id: "coord", data: "2026-10-05", escola_id: "e1", turma_id: "t1", horas: 4 },
      { bolsista_id: "saiu-com-horas", data: "2026-10-05", escola_id: "e1", turma_id: "t1", horas: 2 },
    ];
    const bolsistas = [
      { id: "zeca", nome: "Zeca", ativo: true },
      { id: "saiu-com-horas", nome: "Lia", ativo: false },
      { id: "saiu-sem-horas", nome: "Rui", ativo: false },
    ];
    expect(agruparCarga(linhas, bolsistas, escolas, turmas).map((c) => [c.nome, c.total])).toEqual([
      ["Lia", 2],
      ["Zeca", 0],
    ]);
  });
});

describe("acharSobreposicoes", () => {
  const nomes = new Map([["bia", "Bia"], ["caio", "Caio"], ["duda", "Duda"]]);
  const encontro = (id: string, inicio: string, fim: string, alocacoes: object[], status = "em_andamento") => ({
    id,
    inicio: `${inicio}:00`,
    fim: `${fim}:00`,
    horario: `${inicio} às ${fim}`,
    modalidade: "Lego",
    turma: { nome: "Turma", status },
    agenda_bolsista: alocacoes,
  });
  const a = (bolsista_id: string, extra: object = {}) => ({ bolsista_id, situacao: "prevista", inicio: null, fim: null, ...extra });

  it("acha quem já está no horário; encostar, parcial fora, substituído e turma que não abriu não contam", () => {
    const conflitos = acharSobreposicoes(
      { inicio: "12:00", fim: "16:00" },
      [
        encontro("manha", "08:00", "12:00", [a("caio")]), // termina quando o novo começa
        encontro("tarde", "13:00", "17:00", [
          a("bia"),
          a("duda", { inicio: "16:00:00", fim: "17:00:00" }), // parcial: chega quando o novo acaba
          a("caio", { situacao: "substituida" }),
        ]),
        encontro("fechada", "12:00", "16:00", [a("caio")], "nao_abriu"),
      ] as never,
      nomes,
    );
    expect(conflitos.map((c) => [c.bolsistaNome, c.encontroId])).toEqual([["Bia", "tarde"]]);
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
