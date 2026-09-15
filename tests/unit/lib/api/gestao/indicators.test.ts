import { beforeEach, describe, expect, it, vi } from "vitest";

// Cliente mockado no molde de tests/unit/lib/api/telemetry-server.test.ts:
// `server-only` vira no-op e `createClient` devolve uma corrente controlável.
//
// O mock NÃO expõe `from` na raiz: a única via até a tabela é
// `schema("gestao").from(...)`. Assim, esquecer o schema explícito quebra o
// teste com TypeError em vez de cair silenciosamente no schema `public`.
const from = vi.fn();
const schema = vi.fn((nome: string) => {
  if (nome !== "gestao") throw new Error(`schema inesperado: ${nome}`);
  return { from };
});
const mockClient = {
  auth: { getUser: vi.fn() },
  schema,
  rpc: vi.fn(),
};

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

import {
  getIndicadores,
  getTotalAlunos,
  getReservasOnibus,
  getTermos,
  getPresenca,
  getAulasRealizadas,
  getCargaBolsistas,
} from "@/lib/api/gestao/indicators";

// Constrói uma corrente de query mockada. Cada etapa devolve `this` para manter
// o encadeamento, exceto a última (o await), que resolve a resposta registrada.
type Resp = { data: unknown; error: { message: string } | null; count?: number | null };

function chain(resp: Resp) {
  // O terminal é ele mesmo encadeável: todos os métodos de filtro retornam o
  // próprio objeto, e `then` resolve a resposta registrada (a terminação real
  // do PostgREST é o `await` sobre o builder).
  const terminal: Record<string, unknown> = {
    ...resp,
    then: (resolve: (r: Resp) => void) => resolve(resp),
  };
  for (const m of ["select", "eq", "not", "order", "in", "limit", "maybeSingle", "single"]) {
    terminal[m] = vi.fn(() => terminal);
  }
  return terminal as Record<string, ReturnType<typeof vi.fn>> & Resp;
}

/** Vínculo de papel como o PostgREST devolve o embed. */
const vinculo = (papel: string) => ({ papel });

describe("lib/api/gestao/indicators — fronteira de query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: "u-coord" } } });
  });

  it("anula sem sessão autenticada (nenhuma query roda)", async () => {
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(getTotalAlunos()).rejects.toThrow("não autenticado");
    await expect(getIndicadores()).rejects.toThrow("não autenticado");
    expect(schema).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("aponta explicitamente o schema gestao em toda query", async () => {
    from.mockReturnValue(chain({ data: [], error: null, count: 0 }));

    for (const consulta of [
      getTotalAlunos,
      getReservasOnibus,
      getTermos,
      getPresenca,
      getAulasRealizadas,
      getCargaBolsistas,
    ]) {
      schema.mockClear();
      from.mockClear();
      await consulta();
      expect(from).toHaveBeenCalledTimes(1);
      // Uma seleção de schema por tabela consultada, sempre `gestao`.
      expect(schema).toHaveBeenCalledTimes(1);
      expect(schema).toHaveBeenCalledWith("gestao");
    }

    schema.mockClear();
    from.mockClear();
    await getIndicadores();
    expect(from).toHaveBeenCalledTimes(6);
    expect(schema).toHaveBeenCalledTimes(6);
    expect(schema.mock.calls.every(([nome]) => nome === "gestao")).toBe(true);
  });

  it("deriva total de alunos com count exato", async () => {
    from.mockReturnValue(chain({ data: null, error: null, count: 7 }));
    const result = await getTotalAlunos();
    expect(result.total).toBe(7);
    expect(from).toHaveBeenCalledWith("aluno");
  });

  it("deriva reservas de ônibus filtrando onibus=true", async () => {
    from.mockReturnValue(chain({ data: null, error: null, count: 3 }));
    const result = await getReservasOnibus();
    expect(result.total).toBe(3);
    expect(from).toHaveBeenCalledWith("reserva");
  });

  it("deriva termos pendentes vs arquivados por status", async () => {
    from.mockReturnValue(
      chain({
        data: [
          { status: "pendente" },
          { status: "arquivado" },
          { status: "pendente" },
        ],
        error: null,
      }),
    );
    const result = await getTermos();
    expect(result).toEqual({ pendentes: 2, arquivados: 1 });
  });

  it("deriva presença presentes vs ausentes", async () => {
    from.mockReturnValue(
      chain({ data: [{ presente: true }, { presente: false }, { presente: true }], error: null }),
    );
    const result = await getPresenca();
    expect(result).toEqual({ presentes: 2, ausentes: 1 });
  });

  it("deriva aulas realizadas excluindo realizadas_em nulo", async () => {
    from.mockReturnValue(chain({ data: null, error: null, count: 4 }));
    const result = await getAulasRealizadas();
    expect(result.total).toBe(4);
    expect(from).toHaveBeenCalledWith("aula");
  });

  it("deriva carga dos bolsistas em camelCase", async () => {
    from.mockReturnValue(
      chain({
        data: [{ bolsista_id: "b1", carga: "4h", papel_membro: vinculo("bolsista") }],
        error: null,
      }),
    );
    const result = await getCargaBolsistas();
    expect(result.totalAlocacoes).toBe(1);
    expect(result.items[0]).toEqual({ bolsistaId: "b1", carga: "4h" });
  });

  it("junta papel_membro e filtra papel=bolsista na própria query", async () => {
    const corrente = chain({ data: [], error: null });
    from.mockReturnValue(corrente);

    await getCargaBolsistas();

    expect(from).toHaveBeenCalledWith("agenda_bolsista");
    // Embed `!inner`: sem ele o PostgREST devolveria alocação de qualquer papel.
    expect(corrente.select).toHaveBeenCalledWith(
      expect.stringContaining("papel_membro!inner(papel)"),
    );
    expect(corrente.eq).toHaveBeenCalledWith("papel_membro.papel", "bolsista");
  });

  it("não conta alocação de coordenação nem de papel ausente (contraexemplo)", async () => {
    // Mesmo que o banco devolva linhas de outro papel, o indicador 6 só conta
    // bolsista — a UI nunca vê alocação de coordenação como carga de bolsista.
    const linhas = [
      { bolsista_id: "b1", carga: "4h", papel_membro: vinculo("bolsista") },
      { bolsista_id: "c1", carga: "8h", papel_membro: vinculo("coordenacao") },
      { bolsista_id: "x1", carga: "2h", papel_membro: null },
      // O embed do PostgREST também pode vir como array (CLAUDE.md).
      { bolsista_id: "b2", carga: "6h", papel_membro: [vinculo("bolsista")] },
      { bolsista_id: "c2", carga: "1h", papel_membro: [vinculo("coordenacao")] },
    ];
    from.mockReturnValue(chain({ data: linhas, error: null }));

    const result = await getCargaBolsistas();
    expect(result.totalAlocacoes).toBe(2);
    expect(result.items).toEqual([
      { bolsistaId: "b1", carga: "4h" },
      { bolsistaId: "b2", carga: "6h" },
    ]);
  });

  it("agrega os seis indicadores numa única consulta", async () => {
    const respostas = [
      { data: null, error: null, count: 5 },            // alunos
      { data: null, error: null, count: 2 },            // ônibus
      { data: [{ status: "pendente" }], error: null },  // termos
      { data: [{ presente: true }], error: null },      // presença
      { data: null, error: null, count: 1 },            // aulas
      {
        data: [
          { bolsista_id: "b1", carga: "3h", papel_membro: vinculo("bolsista") },
          { bolsista_id: "c1", carga: "9h", papel_membro: vinculo("coordenacao") },
        ],
        error: null,
      },                                                // carga
    ];
    let i = 0;
    from.mockImplementation(() => chain(respostas[i++]));

    const result = await getIndicadores();
    expect(result.alunos).toEqual({ total: 5 });
    expect(result.reservasOnibus).toEqual({ total: 2 });
    expect(result.termos).toEqual({ pendentes: 1, arquivados: 0 });
    expect(result.presenca).toEqual({ presentes: 1, ausentes: 0 });
    expect(result.aulas).toEqual({ total: 1 });
    // Contraexemplo no agregado: a alocação de coordenação não entra na carga.
    expect(result.cargaBolsistas.totalAlocacoes).toBe(1);
    expect(result.cargaBolsistas.items).toEqual([{ bolsistaId: "b1", carga: "3h" }]);
  });

  it("propaga erro do banco sem mascará-lo", async () => {
    from.mockReturnValue(chain({ data: null, error: { message: "RLS negou" } }));
    await expect(getTotalAlunos()).rejects.toThrow("RLS negou");
  });
});
