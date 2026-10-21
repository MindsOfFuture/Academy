import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { mensagemDoLote, planejarLote } from "@/lib/api/gestao/alocacao";
import { datasSemanais, validarLote, validarRepeticao } from "@/lib/api/gestao/validacao";
import type { Alocacao, Encontro, PedidoLote, SituacaoAlocacao } from "@/lib/api/gestao/types";

/** Spec 020 — alocação em lote: datas da repetição, validação e o que cada encontro recebe. */

const BIA = "b0000000-0000-4000-8000-000000000001";
const CAIO = "c0000000-0000-4000-8000-000000000001";
const E1 = "e0000000-0000-4000-8000-000000000001";
const E2 = "e0000000-0000-4000-8000-000000000002";

function form(campos: Record<string, string | string[]>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) for (const item of [v].flat()) f.append(k, item);
  return f;
}

function alocacao(bolsistaId: string, situacao: SituacaoAlocacao = "prevista"): Alocacao {
  return {
    id: `a-${bolsistaId}`,
    bolsistaId,
    bolsistaNome: bolsistaId,
    situacao,
    inicio: null,
    fim: null,
    cobertoPor: null,
    cobertoPorNome: null,
    motivo: null,
    carga: "4",
    notaEncerramento: null,
  };
}

function encontro(id: string, data: string, extra: Partial<Encontro> = {}): Encontro {
  return {
    id,
    data,
    inicio: "13:00",
    fim: "17:00",
    horario: "13h às 17h",
    modalidade: "Lego",
    descricao: "Lego",
    escolaId: null,
    escolaNome: null,
    turmaId: null,
    turmaNome: null,
    turmaStatus: null,
    canceladoEm: null,
    motivoCancelamento: null,
    concluidoEm: null,
    relatorio: null,
    alocacoes: [],
    ...extra,
  };
}

function pedido(extra: Partial<PedidoLote>): PedidoLote {
  return { acao: "alocar", encontros: [], pessoas: [], pessoa: null, substituto: null, motivo: "", ...extra };
}

describe("repetir toda semana", () => {
  it("de 06/10 até 27/10 dá as quatro segundas, as duas pontas incluídas", () => {
    expect(datasSemanais("2026-10-06", "2026-10-27")).toEqual(["2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27"]);
    expect(datasSemanais("2026-10-06", "2026-10-26")).toEqual(["2026-10-06", "2026-10-13", "2026-10-20"]);
  });

  it("atravessa a virada de mês e de ano", () => {
    expect(datasSemanais("2026-12-28", "2027-01-11")).toEqual(["2026-12-28", "2027-01-04", "2027-01-11"]);
  });

  it("sem data final é só o encontro; fim antes do início e mais de 30 semanas são recusados", () => {
    expect(validarRepeticao(form({}), "2026-10-06")).toEqual({ ok: true, valor: ["2026-10-06"] });
    expect(validarRepeticao(form({ repetirAte: "2026-10-01" }), "2026-10-06").ok).toBe(false);
    expect(validarRepeticao(form({ repetirAte: "2027-04-27" }), "2026-10-06")).toMatchObject({ ok: true });
    expect(validarRepeticao(form({ repetirAte: "2027-05-04" }), "2026-10-06")).toEqual({
      ok: false,
      mensagem: "A repetição vai até 30 semanas. Escolha uma data mais próxima.",
    });
  });
});

describe("validação do lote", () => {
  it("lê os encontros marcados sem repetir e ignora o que não é id", () => {
    const r = validarLote(form({ acao: "alocar", encontros: [E1, E1, "x", E2], pessoas: [BIA] }));
    expect(r).toEqual({ ok: true, valor: pedido({ encontros: [E1, E2], pessoas: [BIA] }) });
  });

  it("recusa sem encontro, sem pessoa, troca pela mesma pessoa, cancelamento sem motivo e mais de 60", () => {
    expect(validarLote(form({ acao: "alocar", pessoas: [BIA] }))).toMatchObject({ ok: false, mensagem: "Marque pelo menos um encontro." });
    expect(validarLote(form({ acao: "alocar", encontros: [E1] })).ok).toBe(false);
    expect(validarLote(form({ acao: "trocar", encontros: [E1], pessoa: BIA, substituto: BIA })).ok).toBe(false);
    expect(validarLote(form({ acao: "cancelar", encontros: [E1], motivo: "x" })).ok).toBe(false);
    expect(validarLote(form({ acao: "apagar", encontros: [E1] })).ok).toBe(false);
    const muitos = Array.from({ length: 61 }, (_, i) => `e0000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    expect(validarLote(form({ acao: "concluir", encontros: muitos }))).toMatchObject({ ok: false, mensagem: "Marque até 60 encontros por vez." });
  });
});

describe("o que cada encontro recebe", () => {
  it("acrescentar: só quem ainda não está; encontro cancelado fica de fora", () => {
    const plano = planejarLote(pedido({ acao: "alocar", pessoas: [BIA, CAIO] }), [
      encontro(E1, "2026-10-06"),
      encontro(E2, "2026-10-13", { alocacoes: [alocacao(BIA)] }),
      encontro("e3", "2026-10-20", { canceladoEm: "2026-10-01T00:00:00Z" }),
      encontro("e4", "2026-10-27", { alocacoes: [alocacao(BIA), alocacao(CAIO, "retirada")] }),
    ]);
    expect(plano.passos.map((p) => [p.encontro.id, p.pessoas])).toEqual([
      [E1, [BIA, CAIO]],
      [E2, [CAIO]],
    ]);
    expect(plano.pulados.map((p) => [p.encontro.id, p.motivo])).toEqual([
      ["e3", "já estava cancelado"],
      ["e4", "todos já estavam nele"],
    ]);
  });

  it("trocar: só onde a pessoa ainda pode ser substituída", () => {
    const plano = planejarLote(pedido({ acao: "trocar", pessoa: BIA, substituto: CAIO }), [
      encontro(E1, "2026-10-06", { alocacoes: [alocacao(BIA)] }),
      encontro(E2, "2026-10-13", { alocacoes: [alocacao(BIA, "faltou_avisou")] }),
      encontro("e3", "2026-10-20", { alocacoes: [alocacao(BIA, "cumprida")] }),
      encontro("e4", "2026-10-27"),
    ]);
    expect(plano.passos.map((p) => [p.encontro.id, p.alocacaoId])).toEqual([
      [E1, `a-${BIA}`],
      [E2, `a-${BIA}`],
    ]);
    expect(plano.pulados.map((p) => p.motivo)).toEqual([
      "a pessoa já cumpriu, saiu ou foi substituída",
      "a pessoa não estava nele",
    ]);
  });

  it("retirar, cancelar e concluir", () => {
    const encontros = [
      encontro(E1, "2026-10-06", { alocacoes: [alocacao(BIA)] }),
      encontro(E2, "2026-10-13", { concluidoEm: "2026-10-13T20:00:00Z" }),
    ];
    expect(planejarLote(pedido({ acao: "retirar", pessoa: BIA }), encontros).passos.map((p) => p.alocacaoId)).toEqual([
      `a-${BIA}`,
    ]);
    for (const acao of ["cancelar", "concluir"] as const) {
      const plano = planejarLote(pedido({ acao, motivo: "chuva" }), encontros);
      expect(plano.passos.map((p) => p.encontro.id)).toEqual([E1]);
      expect(plano.pulados.map((p) => p.motivo)).toEqual(["já estava concluído"]);
    }
  });

  it("a mensagem diz quantos foram feitos e quais ficaram de fora", () => {
    expect(mensagemDoLote(3, [{ data: "2026-10-13", motivo: "já estava cancelado" }])).toBe(
      "Feito em 3 encontros. Ficaram de fora: 13/10 (já estava cancelado).",
    );
    expect(mensagemDoLote(1, [])).toBe("Feito em 1 encontro.");
    expect(mensagemDoLote(0, [{ data: "2026-10-06", motivo: "o encontro ainda não começou." }])).toBe(
      "Nada foi feito. Ficaram de fora: 06/10 (o encontro ainda não começou).",
    );
  });
});
