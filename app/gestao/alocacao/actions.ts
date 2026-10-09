"use server";

import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import {
  alocar,
  atualizarAlocacao,
  cadastrarEscola,
  cadastrarTurma,
  cancelarEncontro,
  concluirEncontro,
  conflitosDeHorario,
  criarEncontro,
  definirSituacaoTurma,
  editarEscola,
  editarTurma,
  registrarAfastamento,
  removerAlocacao,
  substituirAlocacao,
} from "@/lib/api/gestao/alocacao";
import type { ConflitoHorario, EstadoAcao } from "@/lib/api/gestao/types";
import {
  falha,
  mensagemDeErro,
  sucesso,
  validarAfastamento,
  validarEncontro,
  validarEscola,
  validarMudancaAlocacao,
  validarSituacaoTurma,
  validarTurma,
} from "@/lib/api/gestao/validacao";

/**
 * Ações da alocação (spec 014). Só a coordenação aloca nesta spec; toda ação
 * confere o papel antes de tocar no banco, e a RLS confere de novo.
 */

const CAMINHO = "/gestao/alocacao";

async function exigirCoordenacao(): Promise<EstadoAcao | null> {
  try {
    const papel = await ensureGestaoMember();
    return papel === "coordenacao" ? null : falha("Apenas a coordenação faz a alocação.");
  } catch (error) {
    return falha(error instanceof Error ? error.message : "Acesso negado.");
  }
}

function campo(form: FormData, nome: string): string {
  const valor = form.get(nome);
  return typeof valor === "string" ? valor.trim() : "";
}

/** Roda a escrita, revalida a alocação inteira e traduz o erro do banco. */
async function executar(escrita: () => Promise<unknown>, mensagem: string): Promise<EstadoAcao> {
  try {
    await escrita();
    revalidatePath(CAMINHO, "layout");
    return sucesso(mensagem);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
}

export async function cadastrarEscolaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const escola = validarEscola(form);
  if (!escola.ok) return falha(escola.mensagem);
  return executar(() => cadastrarEscola(escola.valor), "Escola cadastrada.");
}

export async function cadastrarTurmaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const turma = validarTurma(form);
  if (!turma.ok) return falha(turma.mensagem);
  return executar(() => cadastrarTurma(turma.valor), "Turma cadastrada.");
}

export async function editarEscolaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "escolaId");
  const escola = validarEscola(form);
  if (!id) return falha("Escola não informada.");
  if (!escola.ok) return falha(escola.mensagem);
  return executar(() => editarEscola(id, escola.valor), "Escola atualizada.");
}

/** O formulário manda a escola da turma só para passar na validação; ela não muda. */
export async function editarTurmaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "turmaId");
  const turma = validarTurma(form);
  if (!id) return falha("Turma não informada.");
  if (!turma.ok) return falha(turma.mensagem);
  return executar(() => editarTurma(id, turma.valor), "Turma atualizada.");
}

export async function situacaoTurmaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "turmaId");
  const situacao = validarSituacaoTurma(form);
  if (!id) return falha("Turma não informada.");
  if (!situacao.ok) return falha(situacao.mensagem);
  return executar(() => definirSituacaoTurma(id, situacao.valor.status, situacao.valor.motivo), "Situação atualizada.");
}

export async function criarEncontroAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const encontro = validarEncontro(form);
  if (!encontro.ok) return falha(encontro.mensagem);
  const pessoas = encontro.valor.equipe.length;
  return executar(
    () => criarEncontro(encontro.valor),
    `Encontro lançado${pessoas ? ` com ${pessoas} ${pessoas === 1 ? "pessoa" : "pessoas"}` : ", ainda sem equipe"}.`,
  );
}

/**
 * Antes de lançar: quem da equipe escolhida já está em outro encontro no mesmo
 * horário. É aviso, não trava — a coordenação decide se revisa ou lança mesmo
 * assim. Formulário incompleto devolve lista vazia; a validação de verdade é a
 * do lançamento.
 */
export async function conflitosEncontroAction(form: FormData): Promise<ConflitoHorario[]> {
  if (await exigirCoordenacao()) return [];
  const encontro = validarEncontro(form);
  if (!encontro.ok) return [];
  const { data, inicio, fim, equipe } = encontro.valor;
  try {
    return await conflitosDeHorario(data, inicio, fim, equipe);
  } catch {
    return [];
  }
}

export async function cancelarEncontroAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "encontroId");
  const motivo = campo(form, "motivo");
  if (!id) return falha("Encontro não informado.");
  if (motivo.length < 3) return falha("Cancelar um encontro exige o motivo.");
  return executar(() => cancelarEncontro(id, motivo), "Encontro cancelado. Ele continua no histórico.");
}

export async function concluirEncontroAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "encontroId");
  const concluir = campo(form, "acao") !== "reabrir";
  if (!id) return falha("Encontro não informado.");
  return executar(
    () => concluirEncontro(id, concluir),
    concluir ? "Encontro concluído. Quem estava prevista ficou como cumprida." : "Encontro reaberto.",
  );
}

export async function alocarAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "encontroId");
  const bolsista = campo(form, "bolsistaId");
  if (!id || !bolsista) return falha("Escolha quem entra no encontro.");
  return executar(() => alocar(id, [bolsista]), "Pessoa alocada.");
}

export async function atualizarAlocacaoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "alocacaoId");
  const mudanca = validarMudancaAlocacao(form);
  if (!id) return falha("Alocação não informada.");
  if (!mudanca.ok) return falha(mudanca.mensagem);
  return executar(() => atualizarAlocacao(id, mudanca.valor), "Alocação atualizada.");
}

export async function removerAlocacaoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "alocacaoId");
  if (!id) return falha("Alocação não informada.");
  return executar(() => removerAlocacao(id), "Pessoa removida do encontro.");
}

export async function substituirAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = campo(form, "alocacaoId");
  const substituto = campo(form, "substitutoId");
  const motivo = campo(form, "motivo");
  if (!id || !substituto) return falha("Escolha quem substitui.");
  return executar(() => substituirAlocacao(id, substituto, motivo || null), "Substituição registrada.");
}

export async function afastamentoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const afastamento = validarAfastamento(form);
  if (!afastamento.ok) return falha(afastamento.mensagem);
  return executar(
    () => registrarAfastamento(afastamento.valor),
    "Afastamento registrado. Substitua os encontros listados abaixo.",
  );
}
