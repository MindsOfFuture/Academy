import { beforeEach, describe, expect, it, vi } from "vitest";

// O mock NÃO expõe `from` na raiz: a única via até a tabela é
// `schema("gestao").from(...)`. Esquecer o schema explícito quebra o teste com
// TypeError em vez de cair silenciosamente no schema `public`.
const from = vi.fn();
const schema = vi.fn((nome: string) => {
  if (nome !== "gestao") throw new Error(`schema inesperado: ${nome}`);
  return { from };
});
const mockClient = {
  auth: { getUser: vi.fn() },
  schema,
};

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

import {
  listAgendas,
  listAlunos,
  listAulas,
  listEscolas,
  listListasEnviadas,
  listPresencas,
  listReservas,
} from "@/lib/api/gestao/entities";

type Resp = { data: unknown; error: { message: string } | null };

function chain(resp: Resp) {
  const terminal: Record<string, unknown> = {
    ...resp,
    then: (resolve: (r: Resp) => void) => resolve(resp),
  };
  for (const m of ["select", "eq", "not", "order", "in", "limit", "maybeSingle", "single"]) {
    terminal[m] = () => terminal;
  }
  return terminal;
}

describe("lib/api/gestao/entities — registro operacional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: "u-coord" } } });
  });

  it("aponta explicitamente o schema gestao em toda leitura", async () => {
    from.mockReturnValue(chain({ data: [], error: null }));

    const leituras: [() => Promise<unknown>, string][] = [
      [listEscolas, "escola"],
      [() => listAlunos(), "aluno"],
      [listReservas, "reserva"],
      [listAgendas, "agenda"],
      [() => listAulas(), "aula"],
      [() => listPresencas(), "presenca"],
      [listListasEnviadas, "lista_enviada"],
    ];

    for (const [leitura, tabela] of leituras) {
      schema.mockClear();
      from.mockClear();
      await leitura();
      expect(schema).toHaveBeenCalledTimes(1);
      expect(schema).toHaveBeenCalledWith("gestao");
      expect(from).toHaveBeenCalledWith(tabela);
    }
  });

  it("mapeia aluno (snake_case → camelCase) e filtra por escola", async () => {
    from.mockReturnValue(
      chain({
        data: [{
          id: "a1",
          nome: "Alice",
          idade: 12,
          escola_id: "e1",
          categoria_escola: "estadual",
          ano_escolar: "7o ano",
          modalidade: "robotica",
          execucao: "ensino fundamental",
          cidade: "Juiz de Fora",
        }],
        error: null,
      }),
    );

    const result = await listAlunos("e1");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "a1",
      nome: "Alice",
      idade: 12,
      escolaId: "e1",
      categoriaEscola: "estadual",
      anoEscolar: "7o ano",
      modalidade: "robotica",
      execucao: "ensino fundamental",
      cidade: "Juiz de Fora",
    });
    expect(from).toHaveBeenCalledWith("aluno");
  });

  it("mapeia escola e reserva com os campos de exibição", async () => {
    const respostas: Resp[] = [
      { data: [{ id: "e1", nome: "Escola X", categoria: "estadual", cidade: "JF" }], error: null },
      { data: [{ id: "r1", escola_id: "e1", onibus: true, dias: "seg", horarios: "08h", modalidade: "robotica", numero_alunos: 30, serie: "7o", status: "confirmada" }], error: null },
    ];
    let i = 0;
    from.mockImplementation(() => chain(respostas[i++]));

    const escolas = await listEscolas();
    expect(escolas[0]).toEqual({ id: "e1", nome: "Escola X", categoria: "estadual", cidade: "JF" });

    const reservas = await listReservas();
    expect(reservas[0]).toEqual({
      id: "r1", escolaId: "e1", onibus: true, dias: "seg", horarios: "08h",
      modalidade: "robotica", numeroAlunos: 30, serie: "7o", status: "confirmada",
    });
  });

  it("mapeia presença com status de assinatura e filtro por aula", async () => {
    from.mockReturnValue(
      chain({
        data: [{ id: "p1", aula_id: "aul1", aluno_id: "a1", presente: true, assinatura_status: "assinado", bolsista_id: "b1", professor_id: null }],
        error: null,
      }),
    );
    const result = await listPresencas("aul1");
    expect(result[0]).toEqual({
      id: "p1", aulaId: "aul1", alunoId: "a1", presente: true,
      assinaturaStatus: "assinado", bolsistaId: "b1", professorId: null,
    });
  });

  it("mapeia lista enviada preservando o array de nomes", async () => {
    from.mockReturnValue(
      chain({ data: [{ id: "l1", escola_id: "e1", reserva_id: "r1", nomes: ["Alice", "Bia"] }], error: null }),
    );
    const result = await listListasEnviadas();
    expect(result[0]).toEqual({ id: "l1", escolaId: "e1", reservaId: "r1", nomes: ["Alice", "Bia"] });
  });

  it("anula sem sessão", async () => {
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(listAlunos()).rejects.toThrow("não autenticado");
    expect(schema).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });
});
