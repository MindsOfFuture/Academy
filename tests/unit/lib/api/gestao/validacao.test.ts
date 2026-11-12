import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  lerNumero,
  mensagemDeErro,
  slugDe,
  validarArtigo,
  validarBolsa,
  validarAndamento,
  validarCapa,
  validarEncontro,
  validarEspaco,
  validarMeta,
  validarMudancaAlocacao,
  validarNumerosDoSite,
  validarProducao,
  validarReuniao,
  validarTipoEspaco,
  validarTurma,
} from "@/lib/api/gestao/validacao";
import { montarPendencias } from "@/lib/api/gestao/pendencias";
import { mapMembro } from "@/lib/api/gestao/equipe";
import type { MembroEquipe } from "@/lib/api/gestao/types";

function form(campos: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

const BOLSA_OK = {
  bolsistaId: "b-1",
  modalidade: "graduacao",
  cargaSemanalHoras: "20,5",
  inicio: "2026-03-01",
  fim: "2026-12-31",
};

describe("validação e montagem da gestão (spec 003)", () => {
  it("aceita bolsa válida lendo a carga em formato brasileiro, sem valor em dinheiro, e recusa carga e vigência inválidas", () => {
    // Um valor enviado por fora do formulário é ignorado: a bolsa não guarda dinheiro.
    const ok = validarBolsa(form({ ...BOLSA_OK, valorMensal: "700,00" }));
    expect(ok).toEqual({
      ok: true,
      valor: { ...BOLSA_OK, cargaSemanalHoras: 20.5 },
    });
    expect(validarBolsa(form({ ...BOLSA_OK, cargaSemanalHoras: "41" }))).toMatchObject({ ok: false });
    expect(validarBolsa(form({ ...BOLSA_OK, fim: "2026-02-01" }))).toEqual({
      ok: false,
      mensagem: "O fim da vigência não pode ser antes do início.",
    });
    expect(lerNumero("abc")).toBeNull();
    expect(lerNumero("1.200,50")).toBe(1200.5);
  });

  it("traduz o erro do banco para uma frase que a coordenação entende", () => {
    expect(mensagemDeErro(new Error("gestao: o projeto precisa de ao menos uma pessoa ativa na coordenação"))).toBe(
      "O projeto precisa de ao menos uma pessoa ativa na coordenação.",
    );
    expect(
      mensagemDeErro(new Error('violates RESTRICT setting of foreign key constraint "agenda_bolsista_bolsista_id_papel_membro_fkey"')),
    ).toMatch(/Desligar/);
    expect(mensagemDeErro(new Error("new row violates row-level security policy"))).toBe(
      "Você não tem permissão para fazer isso.",
    );
  });

  it("monta a tela Hoje: aula passada sem registro é urgente, bolsista sem bolsa só aparece à coordenação", () => {
    const semBolsa: MembroEquipe = mapMembro({
      user_profile_id: "b-2",
      nome: "Bia",
      email: "bia@x",
      coordenacao: false,
      bolsista: true,
      desligado_em: null,
      membro_desde: "2026-01-01T00:00:00Z",
      bolsa_id: null,
      modalidade: null,
      carga_semanal_horas: null,
      bolsa_inicio: null,
      bolsa_fim: null,
      tem_alocacao: false,
    });
    const agendas = [
      { id: "a1", data: "2026-09-20", horario: "08h", modalidade: "lego", escola: { nome: "Escola A" }, aula: [] },
      { id: "a2", data: "2026-09-21", horario: "08h", modalidade: "lego", escola: [{ nome: "Escola B" }], aula: [{ id: "x" }] },
      { id: "a3", data: "2026-09-23", horario: "10h", modalidade: "lego", escola: null, aula: [] },
      // Concluído (spec 014): já confirmado, não é "sem registro".
      { id: "a4", data: "2026-09-19", horario: "08h", modalidade: "lego", concluido_em: "2026-09-19T15:00:00Z", escola: null, aula: [] },
    ];

    const coord = montarPendencias({ papel: "coordenacao", hoje: "2026-09-23", agendas, equipe: [semBolsa] });
    expect(coord.map((p) => [p.tipo, p.titulo])).toEqual([
      ["aula_sem_registro", "Aula de 20/09 sem registro"],
      ["bolsista_sem_bolsa", "Bia está sem bolsa vigente"],
      ["proxima_aula", "Hoje · Fora de escola"],
    ]);
    expect(coord[0].urgente).toBe(true);

    const bolsista = montarPendencias({ papel: "bolsista", hoje: "2026-09-23", agendas, equipe: [semBolsa] });
    expect(bolsista.some((p) => p.tipo === "bolsista_sem_bolsa")).toBe(false);

    // Spec 012: quem é coordenação e bolsista também aparece sem bolsa; só coordenação, não.
    const coordBolsista = { ...semBolsa, userProfileId: "c-1", nome: "Cris", coordenacao: true };
    const soCoord = { ...semBolsa, userProfileId: "c-2", nome: "Dani", coordenacao: true, bolsista: false };
    const titulos = montarPendencias({ papel: "coordenacao", hoje: "2026-09-23", agendas: [], equipe: [coordBolsista, soCoord] })
      .filter((p) => p.tipo === "bolsista_sem_bolsa")
      .map((p) => p.titulo);
    expect(titulos).toEqual(["Cris está sem bolsa vigente"]);
  });

  it("explica que ninguém fica sem papel", () => {
    expect(
      mensagemDeErro(new Error('new row for relation "papel_membro" violates check constraint "papel_membro_algum_papel"')),
    ).toBe("A pessoa precisa ficar com ao menos um papel. Para tirar o acesso, use “Desligar”.");
  });
});

describe("números da página inicial (spec 019)", () => {
  it("aceita inteiros, inclusive com ponto de milhar", () => {
    expect(validarNumerosDoSite(form({ escolas: "36", alunos: "1.520", aulas: "1.200" }))).toEqual({
      ok: true,
      valor: { escolas: 36, alunos: 1520, aulas: 1200 },
    });
    expect(validarNumerosDoSite(form({ escolas: "0", alunos: "1000000", aulas: "0" }))).toEqual({
      ok: true,
      valor: { escolas: 0, alunos: 1000000, aulas: 0 },
    });
  });

  it("recusa vazio, negativo, decimal, letra e acima de 1.000.000", () => {
    for (const [escolas, alunos] of [["", "10"], ["-1", "10"], ["3,5", "10"], ["dez", "10"], ["10", "1000001"], ["10", ""]]) {
      expect(validarNumerosDoSite(form({ escolas, alunos, aulas: "5" })).ok).toBe(false);
    }
    for (const aulas of ["", "-1", "3,5", "1000001"]) {
      expect(validarNumerosDoSite(form({ escolas: "1", alunos: "1", aulas }))).toEqual({
        ok: false,
        mensagem: "Informe o número de aulas (de 0 a 1.000.000, sem vírgula).",
      });
    }
  });

  it("traduz a recusa do banco para quem não é da coordenação", () => {
    expect(mensagemDeErro(new Error("gestao: só a coordenação muda os números do site"))).toBe(
      "Só a coordenação muda os números do site.",
    );
  });
});

describe("validarTurma — número de alunos opcional", () => {
  const TURMA = { escolaId: "e1", nome: "Lego tarde", modalidade: "Lego", inicio: "2026-09-01" };

  it("sem número fica nulo; com número vira inteiro", () => {
    expect(validarTurma(form(TURMA))).toMatchObject({ ok: true, valor: { nAlunos: null } });
    expect(validarTurma(form({ ...TURMA, nAlunos: "25" }))).toMatchObject({ ok: true, valor: { nAlunos: 25 } });
  });

  it("recusa negativo, fracionário e acima de 1000", () => {
    for (const nAlunos of ["-1", "2.5", "1001", "abc"]) {
      expect(validarTurma(form({ ...TURMA, nAlunos })).ok).toBe(false);
    }
  });
});

describe("artigos do site", () => {
  it("slugDe tira acento, pontuação e hífen das pontas", () => {
    expect(slugDe("  Robótica na Escola: o que é?! ")).toBe("robotica-na-escola-o-que-e");
    expect(slugDe("!!!")).toBe("");
    expect(slugDe("a".repeat(100))).toHaveLength(80);
  });

  it("validarArtigo tira o endereço do título e ignora o slug enviado", () => {
    const r = validarArtigo(form({ titulo: "Lego na Sala", slug: "outro", resumo: "  ", conteudo: "", status: "draft" }));
    expect(r).toEqual({
      ok: true,
      valor: { titulo: "Lego na Sala", slug: "lego-na-sala", resumo: null, conteudo: null, status: "draft" },
    });
  });

  it("validarArtigo grava os campos da publicação no fim do conteúdo", () => {
    const r = validarArtigo(
      form({
        titulo: "Ok",
        conteudo: "Corpo.",
        status: "published",
        autores: "Ana, Bia",
        doi: "https://doi.org/10.1/x",
        link: "https://site.org/a",
      }),
    );
    expect(r.ok && r.valor.conteudo).toBe("Corpo.\n\n**Autores:** Ana, Bia\n\n**DOI:** https://doi.org/10.1/x\n\n**Link:** https://site.org/a");
  });

  it("validarArtigo recusa campos da publicação inválidos e publicar só com metadados", () => {
    const base = { titulo: "Ok", conteudo: "Corpo.", status: "draft" };
    expect(validarArtigo(form({ ...base, autores: "A **B**" }))).toEqual({
      ok: false,
      mensagem: "Os campos da publicação não aceitam * nem <.",
    });
    expect(validarArtigo(form({ ...base, palavrasChave: "<b>x" })).ok).toBe(false);
    expect(validarArtigo(form({ ...base, doi: "10.1/x" }))).toEqual({
      ok: false,
      mensagem: "O DOI precisa começar com http:// ou https://.",
    });
    expect(validarArtigo(form({ ...base, link: "javascript:alert(1)" }))).toEqual({
      ok: false,
      mensagem: "O link precisa começar com http:// ou https://.",
    });
    expect(validarArtigo(form({ titulo: "Ok", status: "published", autores: "Ana" }))).toEqual({
      ok: false,
      mensagem: "Escreva o conteúdo antes de publicar.",
    });
  });

  it("validarArtigo recusa sem título, status inválido e publicado sem conteúdo", () => {
    expect(validarArtigo(form({ titulo: "", status: "draft" })).ok).toBe(false);
    expect(validarArtigo(form({ titulo: "x".repeat(201), status: "draft" })).ok).toBe(false);
    expect(validarArtigo(form({ titulo: "???", status: "draft" }))).toEqual({
      ok: false,
      mensagem: "O título precisa ter letras ou números.",
    });
    expect(validarArtigo(form({ titulo: "Ok", status: "arquivado" })).ok).toBe(false);
    expect(validarArtigo(form({ titulo: "Ok", status: "published", conteudo: " " }))).toEqual({
      ok: false,
      mensagem: "Escreva o conteúdo antes de publicar.",
    });
  });

  it("validarCapa: ausente vira null; recusa tipo e tamanho errados", () => {
    expect(validarCapa(null)).toEqual({ ok: true, valor: null });
    expect(validarCapa(new File([], "vazio.jpg", { type: "image/jpeg" }))).toEqual({ ok: true, valor: null });
    const ok = new File(["x"], "capa.png", { type: "image/png" });
    expect(validarCapa(ok)).toEqual({ ok: true, valor: ok });
    expect(validarCapa(new File(["x"], "capa.gif", { type: "image/gif" })).ok).toBe(false);
    const grande = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "capa.jpg", { type: "image/jpeg" });
    expect(validarCapa(grande)).toEqual({ ok: false, mensagem: "A capa pode ter até 5 MB." });
  });

  it("mensagemDeErro traduz slug repetido antes do duplicate key genérico", () => {
    expect(
      mensagemDeErro(new Error('duplicate key value violates unique constraint "article_slug_key"')),
    ).toBe("Já existe um artigo com esse endereço.");
  });
});

describe("atraso na alocação", () => {
  it("opcional, inteiro de 1 a 600, e só para quem esteve no encontro", () => {
    expect(validarMudancaAlocacao(form({ situacao: "cumprida" }))).toMatchObject({ ok: true, valor: { atrasoMinutos: null } });
    expect(validarMudancaAlocacao(form({ situacao: "cumprida", atrasoMinutos: "15" }))).toMatchObject({
      ok: true,
      valor: { atrasoMinutos: 15 },
    });
    for (const atrasoMinutos of ["0", "601", "2.5", "-3", "dez"]) {
      expect(validarMudancaAlocacao(form({ situacao: "prevista", atrasoMinutos }))).toEqual({
        ok: false,
        mensagem: "O atraso vai de 1 a 600 minutos.",
      });
    }
    // Quem faltou não chegou atrasado: o valor é descartado.
    expect(validarMudancaAlocacao(form({ situacao: "faltou_avisou", atrasoMinutos: "15" }))).toMatchObject({
      ok: true,
      valor: { atrasoMinutos: null },
    });
  });
});

describe("agenda por espaço", () => {
  const ESPACO = "11111111-1111-4111-8111-111111111111";
  function encontro(campos: Record<string, string>, equipe: string[] = [], responsaveis: string[] = []): FormData {
    const f = form({ data: "2026-10-05", inicio: "08:00", fim: "12:00", modalidade: "Lego", ...campos });
    for (const p of equipe) f.append("equipe", p);
    for (const p of responsaveis) f.append("responsaveis", p);
    return f;
  }

  it("validarEncontro: tipo padrão aula, espaço opcional e responsáveis só de quem está na equipe", () => {
    expect(validarEncontro(encontro({}))).toMatchObject({ ok: true, valor: { tipo: "aula", espacoId: null, responsaveis: [] } });
    expect(
      validarEncontro(encontro({ tipo: "impressao", espacoId: ESPACO }, ["bia", "caio"], ["bia", "zeca", "bia"])),
    ).toMatchObject({ ok: true, valor: { tipo: "impressao", espacoId: ESPACO, equipe: ["bia", "caio"], responsaveis: ["bia"] } });
    expect(validarEncontro(encontro({ tipo: "festa" }))).toEqual({ ok: false, mensagem: "Escolha o tipo da atividade." });
    expect(validarEncontro(encontro({ espacoId: "sala-1" }))).toMatchObject({ ok: false });
  });

  it("validarMudancaAlocacao: função padrão apoio; fora da lista é recusada", () => {
    expect(validarMudancaAlocacao(form({ situacao: "prevista" }))).toMatchObject({ ok: true, valor: { funcao: "apoio" } });
    expect(validarMudancaAlocacao(form({ situacao: "prevista", funcao: "responsavel" }))).toMatchObject({
      ok: true,
      valor: { funcao: "responsavel" },
    });
    expect(validarMudancaAlocacao(form({ situacao: "prevista", funcao: "chefe" }))).toEqual({ ok: false, mensagem: "Escolha a função." });
  });

  it("validarEspaco: nome de 2 a 80; ativo vem da caixa marcada", () => {
    expect(validarEspaco(form({ nome: "  Sala 1 ", ativo: "on" }))).toEqual({ ok: true, valor: { nome: "Sala 1", ativo: true } });
    expect(validarEspaco(form({ nome: "Sala 1" }))).toEqual({ ok: true, valor: { nome: "Sala 1", ativo: false } });
    for (const nome of ["A", "x".repeat(81)]) {
      expect(validarEspaco(form({ nome }))).toEqual({ ok: false, mensagem: "O nome do espaço vai de 2 a 80 caracteres." });
    }
  });

  it("validarTipoEspaco: tipo da lista e espaço vazio ou UUID", () => {
    expect(validarTipoEspaco(form({ tipo: "gravacao", espacoId: ESPACO }))).toEqual({ ok: true, valor: { tipo: "gravacao", espacoId: ESPACO } });
    expect(validarTipoEspaco(form({ tipo: "aula", espacoId: "" }))).toEqual({ ok: true, valor: { tipo: "aula", espacoId: null } });
    expect(validarTipoEspaco(form({ tipo: "", espacoId: "" }))).toEqual({ ok: false, mensagem: "Escolha o tipo da atividade." });
    expect(validarTipoEspaco(form({ tipo: "aula", espacoId: "x" }))).toMatchObject({ ok: false });
  });

  it("mensagemDeErro traduz espaço repetido antes do duplicate key genérico", () => {
    expect(mensagemDeErro(new Error('duplicate key value violates unique constraint "espaco_nome_unico"'))).toBe(
      "Já existe um espaço com esse nome.",
    );
  });
});

describe("metas", () => {
  function formMeta(campos: Record<string, string>, responsaveis: string[]): FormData {
    const f = form(campos);
    for (const r of responsaveis) f.append("responsaveis", r);
    return f;
  }
  const BASE = { titulo: "Fechar o relatório", descricao: "", prazo: "2026-12-01" };

  it("título, prazo e ao menos um responsável, sem repetição", () => {
    expect(validarMeta(formMeta(BASE, ["a", "b"]))).toEqual({
      ok: true,
      valor: { titulo: "Fechar o relatório", descricao: null, prazo: "2026-12-01", responsaveis: ["a", "b"] },
    });
    expect(validarMeta(formMeta({ ...BASE, titulo: "ab" }, ["a"]))).toMatchObject({ ok: false });
    expect(validarMeta(formMeta({ ...BASE, prazo: "01/12/2026" }, ["a"]))).toMatchObject({ ok: false });
    expect(validarMeta(formMeta(BASE, []))).toEqual({ ok: false, mensagem: "Escolha ao menos um responsável." });
    expect(validarMeta(formMeta(BASE, ["a", "a"]))).toMatchObject({ ok: false });
    expect(validarMeta(formMeta({ ...BASE, descricao: "x".repeat(2001) }, ["a"]))).toMatchObject({ ok: false });
  });

  it("andamento tem de 2 a 2000 caracteres", () => {
    expect(validarAndamento(form({ texto: " Fiz a primeira parte " }))).toEqual({ ok: true, valor: { texto: "Fiz a primeira parte" } });
    expect(validarAndamento(form({ texto: "x" }))).toMatchObject({ ok: false });
    expect(validarAndamento(form({ texto: "x".repeat(2001) }))).toMatchObject({ ok: false });
  });
});

describe("validarReuniao", () => {
  const BASE = { data: "2026-11-10", participantes: "Bia e Leo", feito: "Leitura do artigo", desdobramentos: "" };

  it("aceita o mínimo e transforma desdobramentos vazio em null", () => {
    expect(validarReuniao(form({ ...BASE, participantes: " Bi " }))).toEqual({
      ok: true,
      valor: { data: "2026-11-10", participantes: "Bi", feito: "Leitura do artigo", desdobramentos: null },
    });
  });

  it("recusa data inválida e textos fora dos limites", () => {
    expect(validarReuniao(form({ ...BASE, data: "10/11/2026" }))).toMatchObject({ ok: false });
    expect(validarReuniao(form({ ...BASE, participantes: "B" }))).toMatchObject({ ok: false });
    expect(validarReuniao(form({ ...BASE, participantes: "x".repeat(1001) }))).toMatchObject({ ok: false });
    expect(validarReuniao(form({ ...BASE, feito: "x" }))).toMatchObject({ ok: false });
    expect(validarReuniao(form({ ...BASE, feito: "x".repeat(5001) }))).toMatchObject({ ok: false });
    expect(validarReuniao(form({ ...BASE, feito: "x".repeat(5000) }))).toMatchObject({ ok: true });
    expect(validarReuniao(form({ ...BASE, desdobramentos: "x".repeat(5001) }))).toMatchObject({ ok: false });
  });
});

describe("validarProducao", () => {
  const BASE = { tipo: "ebook", titulo: "Robótica na escola", autores: "Bia, Leo", data: "2026-11-10", onde: "", link: "" };

  it("aceita e transforma onde e link vazios em null", () => {
    expect(validarProducao(form(BASE))).toEqual({
      ok: true,
      valor: { tipo: "ebook", titulo: "Robótica na escola", autores: "Bia, Leo", data: "2026-11-10", onde: null, link: null },
    });
    expect(validarProducao(form({ ...BASE, link: "https://exemplo.org/a" }))).toMatchObject({
      ok: true,
      valor: { link: "https://exemplo.org/a" },
    });
  });

  it("recusa tipo fora da lista, inclusive nome herdado de objeto", () => {
    expect(validarProducao(form({ ...BASE, tipo: "livro" }))).toEqual({ ok: false, mensagem: "Escolha o tipo da produção." });
    expect(validarProducao(form({ ...BASE, tipo: "toString" }))).toMatchObject({ ok: false });
    expect(validarProducao(form({ ...BASE, tipo: "" }))).toMatchObject({ ok: false });
  });

  it("recusa textos fora dos limites e data inválida", () => {
    expect(validarProducao(form({ ...BASE, titulo: "R" }))).toMatchObject({ ok: false });
    expect(validarProducao(form({ ...BASE, titulo: "x".repeat(301) }))).toMatchObject({ ok: false });
    expect(validarProducao(form({ ...BASE, autores: "B" }))).toMatchObject({ ok: false });
    expect(validarProducao(form({ ...BASE, autores: "x".repeat(1001) }))).toMatchObject({ ok: false });
    expect(validarProducao(form({ ...BASE, data: "2026-11" }))).toMatchObject({ ok: false });
    expect(validarProducao(form({ ...BASE, onde: "x".repeat(301) }))).toMatchObject({ ok: false });
  });

  it("recusa link sem http(s), com espaço ou longo demais", () => {
    expect(validarProducao(form({ ...BASE, link: "ftp://exemplo.org" }))).toMatchObject({ ok: false });
    expect(validarProducao(form({ ...BASE, link: "https://exemplo.org/a b" }))).toMatchObject({ ok: false });
    expect(validarProducao(form({ ...BASE, link: "https://" + "x".repeat(493) }))).toMatchObject({ ok: false });
    expect(validarProducao(form({ ...BASE, link: "https://" + "x".repeat(492) }))).toMatchObject({ ok: true });
  });
});
