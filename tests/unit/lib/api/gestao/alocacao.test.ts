import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import {
  acharEspacoOcupado,
  acharSobreposicoes,
  agruparCarga,
  alocar,
  atualizarAlocacao,
  criarEncontro,
  criarEncontros,
  definirTipoEspaco,
  diferencas,
  limitesDoMes,
  mapEncontro,
  registrarPresentes,
} from "@/lib/api/gestao/alocacao";
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

  it("atrasos: conta e soma por pessoa, sem mexer nas horas; sem atraso, zero", () => {
    const linhas = [{ bolsista_id: "bia", data: "2026-10-05", escola_id: "e1", turma_id: "t1", horas: 4 }];
    const bolsistas = [
      { id: "bia", nome: "Bia", ativo: true },
      { id: "caio", nome: "Caio", ativo: true },
    ];
    const atrasos = [
      { bolsista_id: "bia", atraso_minutos: 10 },
      { bolsista_id: "bia", atraso_minutos: 25 },
    ];
    expect(agruparCarga(linhas, bolsistas, escolas, turmas, atrasos).map((c) => [c.nome, c.total, c.atrasos, c.minutosDeAtraso])).toEqual([
      ["Bia", 4, 2, 35],
      ["Caio", 0, 0, 0],
    ]);
    expect(agruparCarga(linhas, bolsistas, escolas, turmas)[0]).toMatchObject({ atrasos: 0, minutosDeAtraso: 0 });
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

  it("número da aula é opcional, inteiro de 1 a 999", () => {
    const base = { data: "2026-10-05", inicio: "13:00", fim: "17:00", modalidade: "Lego" };
    expect(validarEncontro(form(base))).toMatchObject({ ok: true, valor: { numeroAula: null } });
    expect(validarEncontro(form({ ...base, numeroAula: " 7 " }))).toMatchObject({ ok: true, valor: { numeroAula: 7 } });
    for (const numeroAula of ["0", "1000", "2.5", "-1", "sete"]) {
      expect(validarEncontro(form({ ...base, numeroAula }))).toEqual({
        ok: false,
        mensagem: "O número da aula precisa ser um inteiro de 1 a 999.",
      });
    }
  });

  it("parcial precisa de chegada e saída; retirar exige motivo", () => {
    expect(validarMudancaAlocacao(form({ situacao: "prevista", inicio: "14:00" }))).toMatchObject({ ok: false });
    expect(validarMudancaAlocacao(form({ situacao: "retirada" }))).toMatchObject({ ok: false });
    expect(validarMudancaAlocacao(form({ situacao: "prevista", inicio: "14:00", fim: "17:00", cobertoPor: "b2" }))).toEqual({
      ok: true,
      valor: { situacao: "prevista", inicio: "14:00", fim: "17:00", cobertoPor: "b2", motivo: null, atrasoMinutos: null, funcao: "apoio" },
    });
  });

  it("limites do mês acertam fevereiro", () => {
    expect(limitesDoMes("2028-02")).toEqual({ de: "2028-02-01", ate: "2028-02-29" });
  });
});

describe("gravação do número da aula e dos presentes", () => {
  const inseridos: Record<string, unknown>[] = [];
  const rpc = vi.fn(async () => ({ data: null, error: null as { message: string } | null }));

  beforeEach(() => {
    inseridos.length = 0;
    rpc.mockClear();
    vi.mocked(createClient).mockResolvedValue({
      schema: () => ({
        from: () => ({
          insert: (linhas: Record<string, unknown>[]) => {
            inseridos.push(...linhas);
            return { select: async () => ({ data: linhas.map((l, i) => ({ id: `e${i}`, data: l.data })), error: null }) };
          },
        }),
        rpc,
      }),
    } as never);
  });

  const novo = {
    data: "2026-10-05", inicio: "08:00", fim: "12:00", modalidade: "Lego", descricao: "",
    escolaId: "esc", turmaId: null, tipo: "aula" as const, espacoId: null, equipe: [], responsaveis: [],
  };

  it("na repetição semanal, cada semana é a aula seguinte", async () => {
    await criarEncontros({ ...novo, numeroAula: 3 }, ["2026-10-05", "2026-10-12", "2026-10-19"]);
    expect(inseridos.map((l) => l.numero_aula)).toEqual([3, 4, 5]);
  });

  it("sem número da aula, todas ficam sem", async () => {
    await criarEncontros({ ...novo, numeroAula: null }, ["2026-10-05", "2026-10-12"]);
    expect(inseridos.map((l) => l.numero_aula)).toEqual([null, null]);
  });

  it("presentes vão para a função do banco, e a recusa volta como erro", async () => {
    await registrarPresentes("e1", 18);
    expect(rpc).toHaveBeenCalledWith("registrar_presentes", { p_agenda: "e1", p_presentes: 18 });
    rpc.mockResolvedValueOnce({ data: null, error: { message: "gestao: encontro cancelado não recebe número de presentes" } });
    await expect(registrarPresentes("e1", 1)).rejects.toThrow(/cancelado/);
  });
});

describe("acharEspacoOcupado", () => {
  const espaco = { id: "s1", nome: "Sala 1" };
  const encontro = (id: string, inicio: string, fim: string, status = "em_andamento") => ({
    id,
    inicio: `${inicio}:00`,
    fim: `${fim}:00`,
    horario: `${inicio} às ${fim}`,
    modalidade: "Lego",
    turma: { nome: "Turma", status },
  });

  it("sobrepor avisa; encostar não; turma que não abriu é ignorada", () => {
    const conflitos = acharEspacoOcupado(
      { inicio: "12:00", fim: "16:00" },
      [
        encontro("manha", "08:00", "12:00"), // termina quando o novo começa
        encontro("tarde", "15:00", "17:00"),
        encontro("fechada", "12:00", "16:00", "nao_abriu"),
      ] as never,
      espaco,
    );
    expect(conflitos).toEqual([
      { bolsistaId: "s1", bolsistaNome: "Sala 1", encontroId: "tarde", horario: "15:00 às 17:00", modalidade: "Lego", turmaNome: "Turma" },
    ]);
  });
});

describe("gravação de tipo, espaço e função", () => {
  const chamadas: { tabela: string; op: string; valor: unknown; id?: string }[] = [];

  beforeEach(() => {
    chamadas.length = 0;
    vi.mocked(createClient).mockResolvedValue({
      schema: () => ({
        from: (tabela: string) => ({
          insert: (valor: unknown) => {
            chamadas.push({ tabela, op: "insert", valor });
            const linhas = [valor].flat() as { data?: string }[];
            const resposta = { data: linhas.map((l, i) => ({ id: `e${i}`, data: l.data })), error: null };
            return {
              // criarEncontros aguarda o select; criarEncontro, o single.
              select: () => ({ then: (ok: (r: unknown) => unknown) => ok(resposta), single: async () => ({ data: { id: "e0" }, error: null }) }),
              then: (ok: (r: unknown) => unknown) => ok({ error: null }),
            };
          },
          update: (valor: unknown) => ({
            eq: async (_c: string, id: string) => {
              chamadas.push({ tabela, op: "update", valor, id });
              return { error: null };
            },
          }),
        }),
      }),
    } as never);
  });

  const novo = {
    data: "2026-10-05", inicio: "08:00", fim: "12:00", modalidade: "Impressão 3D", descricao: "",
    escolaId: null, turmaId: null, numeroAula: null, tipo: "impressao" as const, espacoId: "s1",
    equipe: ["bia", "caio"], responsaveis: ["bia"],
  };

  it("criarEncontro grava tipo e espaço; a equipe vai com a função", async () => {
    await criarEncontro(novo);
    expect(chamadas).toEqual([
      {
        tabela: "agenda",
        op: "insert",
        valor: {
          data: "2026-10-05", inicio: "08:00", fim: "12:00", modalidade: "Impressão 3D", aulas: "Impressão 3D",
          escola_id: null, turma_id: null, numero_aula: null, tipo: "impressao", espaco_id: "s1",
        },
      },
      {
        tabela: "agenda_bolsista",
        op: "insert",
        valor: [
          { agenda_id: "e0", bolsista_id: "bia", funcao: "responsavel" },
          { agenda_id: "e0", bolsista_id: "caio", funcao: "apoio" },
        ],
      },
    ]);
  });

  it("criarEncontros repete tipo, espaço e função em cada semana", async () => {
    await criarEncontros(novo, ["2026-10-05", "2026-10-12"]);
    expect(chamadas.map((c) => c.valor)).toEqual([
      [
        { data: "2026-10-05", inicio: "08:00", fim: "12:00", modalidade: "Impressão 3D", aulas: "Impressão 3D", escola_id: null, turma_id: null, numero_aula: null, tipo: "impressao", espaco_id: "s1" },
        { data: "2026-10-12", inicio: "08:00", fim: "12:00", modalidade: "Impressão 3D", aulas: "Impressão 3D", escola_id: null, turma_id: null, numero_aula: null, tipo: "impressao", espaco_id: "s1" },
      ],
      [
        { agenda_id: "e0", bolsista_id: "bia", funcao: "responsavel" },
        { agenda_id: "e0", bolsista_id: "caio", funcao: "apoio" },
        { agenda_id: "e1", bolsista_id: "bia", funcao: "responsavel" },
        { agenda_id: "e1", bolsista_id: "caio", funcao: "apoio" },
      ],
    ]);
  });

  it("alocar: sem responsáveis, todos entram como apoio", async () => {
    await alocar("e9", ["bia", "caio"], ["caio"]);
    await alocar("e9", ["duda"]);
    expect(chamadas.map((c) => c.valor)).toEqual([
      [
        { agenda_id: "e9", bolsista_id: "bia", funcao: "apoio" },
        { agenda_id: "e9", bolsista_id: "caio", funcao: "responsavel" },
      ],
      [{ agenda_id: "e9", bolsista_id: "duda", funcao: "apoio" }],
    ]);
  });

  it("atualizarAlocacao grava a função", async () => {
    await atualizarAlocacao("a1", {
      situacao: "cumprida", inicio: null, fim: null, cobertoPor: null, motivo: null, atrasoMinutos: null, funcao: "responsavel",
    });
    expect(chamadas).toEqual([
      {
        tabela: "agenda_bolsista",
        op: "update",
        id: "a1",
        valor: { situacao: "cumprida", inicio: null, fim: null, coberto_por: null, motivo: null, atraso_minutos: null, funcao: "responsavel" },
      },
    ]);
  });

  it("definirTipoEspaco muda tipo e espaço do encontro; espaço nulo tira", async () => {
    await definirTipoEspaco("e1", "gravacao", "s2");
    await definirTipoEspaco("e1", "aula", null);
    expect(chamadas).toEqual([
      { tabela: "agenda", op: "update", id: "e1", valor: { tipo: "gravacao", espaco_id: "s2" } },
      { tabela: "agenda", op: "update", id: "e1", valor: { tipo: "aula", espaco_id: null } },
    ]);
  });
});

describe("mapEncontro", () => {
  const alocacao = (id: string, bolsista_id: string, funcao: "responsavel" | "apoio") => ({
    id, bolsista_id, situacao: "prevista" as const, inicio: null, fim: null, coberto_por: null, motivo: null,
    carga: "4h", nota_encerramento: null, link_comprovacao: null, atraso_minutos: null, funcao,
  });

  it("traz tipo e espaço e põe o responsável primeiro", () => {
    const encontro = mapEncontro(
      {
        id: "e1", data: "2026-10-05", inicio: "08:00:00", fim: "12:00:00", horario: "8h às 12h", modalidade: "Impressão",
        aulas: "Impressão", escola_id: null, turma_id: null, cancelado_em: null, motivo_cancelamento: null, concluido_em: null,
        relatorio: null, numero_aula: null, presentes: null, tipo: "impressao", espaco_id: "s1", espaco: [{ nome: "Sala 1" }],
        escola: null, turma: null,
        agenda_bolsista: [alocacao("a1", "ana", "apoio"), alocacao("a2", "caio", "responsavel"), alocacao("a3", "bia", "apoio")],
      },
      new Map([["ana", "Ana"], ["bia", "Bia"], ["caio", "Caio"]]),
    );
    const base = { situacao: "prevista", inicio: null, fim: null, cobertoPor: null, cobertoPorNome: null, motivo: null, carga: "4h", notaEncerramento: null, linkComprovacao: null, atrasoMinutos: null };
    expect(encontro).toEqual({
      id: "e1", data: "2026-10-05", inicio: "08:00", fim: "12:00", horario: "8h às 12h", modalidade: "Impressão",
      descricao: "Impressão", escolaId: null, escolaNome: null, turmaId: null, turmaNome: null, turmaStatus: null,
      canceladoEm: null, motivoCancelamento: null, concluidoEm: null, relatorio: null, numeroAula: null, presentes: null,
      tipo: "impressao", espacoId: "s1", espacoNome: "Sala 1",
      alocacoes: [
        { ...base, id: "a2", bolsistaId: "caio", bolsistaNome: "Caio", funcao: "responsavel" },
        { ...base, id: "a1", bolsistaId: "ana", bolsistaNome: "Ana", funcao: "apoio" },
        { ...base, id: "a3", bolsistaId: "bia", bolsistaNome: "Bia", funcao: "apoio" },
      ],
    });
  });
});
