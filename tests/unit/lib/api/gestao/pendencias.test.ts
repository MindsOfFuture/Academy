import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * "Hoje" das pendências é o dia de Brasília. Às 23h30 em Brasília já é o dia
 * seguinte em UTC: com o dia em UTC, a aula de hoje viraria "sem registro".
 */

const agendas = vi.hoisted(() => ({ linhas: [] as unknown[] }));
vi.mock("@/lib/supabase/server", () => {
  const query: Record<string, unknown> = {};
  for (const m of ["from", "select", "gte", "is"]) query[m] = () => query;
  query.order = async () => ({ data: agendas.linhas, error: null });
  return {
    createClient: async () => ({ schema: () => query }),
    usuarioDaRequisicao: async () => "eu",
  };
});
vi.mock("@/lib/api/gestao/equipe", () => ({ listarEquipe: async () => [] }));
vi.mock("@/lib/api/gestao/melhorias", () => ({ listarMelhorias: async () => [], pendenciasDeMelhoria: () => [] }));
vi.mock("@/lib/api/gestao/metas", () => ({ listarMetas: async () => [], pendenciasDeMeta: () => [] }));

import { listarPendencias } from "@/lib/api/gestao/pendencias";

afterEach(() => {
  vi.useRealTimers();
});

describe("listarPendencias", () => {
  it("às 23h30 em Brasília, a aula de hoje ainda é próxima, não pendência", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-23T23:30:00-03:00")); // 02:30 do dia 24 em UTC
    agendas.linhas = [
      { id: "a1", data: "2026-09-23", horario: "8h", modalidade: "Lego", concluido_em: null, escola: { nome: "E" }, aula: [] },
    ];

    const pendencias = await listarPendencias("bolsista");

    expect(pendencias.map((p) => p.tipo)).toEqual(["proxima_aula"]);
    expect(pendencias[0].titulo).toMatch(/^Hoje/);
  });
});
