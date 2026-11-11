import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Toda ação da gestão recusa quem não pode, antes de chegar ao banco. Percorre
 * os exports de cada módulo: ação nova entra no teste sozinha. A RLS confere de
 * novo, mas uma checagem removida aqui deve ficar vermelha.
 */

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const { ensureGestaoMember } = vi.hoisted(() => ({ ensureGestaoMember: vi.fn() }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember }));
// Camada de dados inteira automockada: nenhuma escrita pode ser chamada.
vi.mock("@/lib/api/gestao/alocacao");
vi.mock("@/lib/api/gestao/artigos");
vi.mock("@/lib/api/gestao/avisos");
vi.mock("@/lib/api/gestao/equipe");
vi.mock("@/lib/api/gestao/melhorias");
vi.mock("@/lib/api/gestao/relatorio");
vi.mock("@/lib/api/gestao/site");

import * as alocacao from "@/app/gestao/alocacao/actions";
import * as artigos from "@/app/gestao/artigos/actions";
import * as equipe from "@/app/gestao/equipe/actions";
import * as melhorias from "@/app/gestao/melhorias/actions";
import * as relatorio from "@/app/gestao/relatorio/actions";
import * as raiz from "@/app/gestao/actions";
import * as dadosAlocacao from "@/lib/api/gestao/alocacao";
import * as dadosArtigos from "@/lib/api/gestao/artigos";
import * as dadosAvisos from "@/lib/api/gestao/avisos";
import * as dadosEquipe from "@/lib/api/gestao/equipe";
import * as dadosMelhorias from "@/lib/api/gestao/melhorias";
import * as dadosRelatorio from "@/lib/api/gestao/relatorio";
import * as dadosSite from "@/lib/api/gestao/site";

type Acao = (...args: unknown[]) => Promise<unknown>;

/** Campos que mudam de formato conforme a ação (início/fim são hora no encontro e data na turma). */
const AJUSTES: Record<string, Record<string, string>> = {
  cadastrarTurmaAction: { inicio: "2099-01-10", fim: "2099-06-30" },
  editarTurmaAction: { inicio: "2099-01-10", fim: "2099-06-30" },
  afastamentoAction: { inicio: "2099-01-10", fim: "2099-06-30" },
  cadastrarBolsaAction: { inicio: "2099-01-10", fim: "2099-06-30" },
  definirPapelAction: { acao: "dar" },
  responderMelhoriaAction: { status: "aceita" },
  salvarArtigoAction: { status: "published", conteudo: "Texto do artigo" },
};

/**
 * Formulário válido para cada ação: se a checagem de permissão sumir, a ação
 * chega ao banco (mock) e o teste fica vermelho — conferido removendo cada checagem.
 */
function formCompleto(ajustes: Record<string, string> = {}): FormData {
  const f = new FormData();
  const id = "11111111-1111-4111-8111-111111111111";
  for (const [k, v] of Object.entries({
    id, encontroId: id, escolaId: id, turmaId: id, alocacaoId: id, bolsistaId: id, userProfileId: id,
    substitutoId: id, cobertoPor: id, pessoa: id, substituto: id, duplicadaDe: id,
    nome: "Atividade de teste", cidade: "Juiz de Fora", area: "plataforma", categoria: "outro",
    data: "2099-01-10", repetirAte: "2099-01-31", inicio: "08:00", fim: "10:00",
    papel: "bolsista", modalidade: "graduacao", cargaSemanalHoras: "12", situacao: "cumprida", acao: "concluir",
    nota: "Nota de encerramento longa o bastante", titulo: "Pedido de melhoria",
    descricao: "Descrição longa o bastante para passar", problema: "Problema descrito com detalhe",
    proposta: "Proposta descrita com detalhe", quemSofre: "bolsistas", resposta: "Resposta longa o bastante",
    status: "em_andamento", apoiar: "1", escolas: "10", alunos: "100", nAlunos: "20", motivo: "afastamento",
    comprovacao: "https://exemplo.org", linkExecucao: "https://exemplo.org", relatorio: "Relatório do encontro",
  })) f.set(k, v);
  f.append("pessoas", id);
  f.append("encontros", id);
  for (const [k, v] of Object.entries(ajustes)) f.set(k, v);
  return f;
}

function chamar(nome: string, acao: Acao) {
  if (nome === "buscarPessoasAction") return acao("ana");
  if (acao.length === 0) return acao();
  if (acao.length === 1) return acao(formCompleto(AJUSTES[nome]));
  return acao(null, formCompleto(AJUSTES[nome]));
}

const recusou = (r: unknown) => r === false || (Array.isArray(r) && r.length === 0) || (r as { ok?: boolean })?.ok === false;

const escritas = () =>
  [dadosAlocacao, dadosArtigos, dadosAvisos, dadosEquipe, dadosMelhorias, dadosRelatorio, dadosSite].flatMap((m) =>
    Object.entries(m).filter(([, f]) => vi.isMockFunction(f) && f.mock.calls.length > 0).map(([n]) => n),
  );

const acoes = (modulo: Record<string, unknown>) =>
  Object.entries(modulo).filter((e): e is [string, Acao] => typeof e[1] === "function");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ações da gestão recusam quem não pode", () => {
  const todas = [alocacao, artigos, equipe, melhorias, relatorio, raiz].flatMap(acoes);

  it.each(todas)("%s: fora da gestão é recusado sem ir ao banco", async (nome, acao) => {
    ensureGestaoMember.mockRejectedValue(new Error("Acesso negado. Você não faz parte da gestão."));
    expect(recusou(await chamar(nome, acao)), nome).toBe(true);
    expect(ensureGestaoMember).toHaveBeenCalled();
    expect(escritas()).toEqual([]);
  });

  // Bolsista pode: nota de encerramento, melhorias (exceto responder) e o próprio relatório.
  const soCoordenacao = [
    ...acoes(alocacao).filter(([n]) => n !== "escreverNotaAction"),
    ...acoes(equipe),
    ...acoes(artigos),
    ...acoes(melhorias).filter(([n]) => n === "responderMelhoriaAction"),
    ...acoes(raiz).filter(([n]) => n === "numerosDoSiteAction"),
  ];

  it.each(soCoordenacao)("%s: bolsista é recusado sem ir ao banco", async (nome, acao) => {
    ensureGestaoMember.mockResolvedValue("bolsista");
    expect(recusou(await chamar(nome, acao)), nome).toBe(true);
    expect(escritas()).toEqual([]);
  });
});
