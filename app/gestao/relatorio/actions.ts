"use server";

import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import { apagarAtividade, cadastrarAtividade, editarAtividade, escreverLinkComprovacao } from "@/lib/api/gestao/relatorio";
import { mesEditavel } from "../alocacao/rotulos";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import { falha, mensagemDeErro, sucesso, validarAtividade } from "@/lib/api/gestao/validacao";

/**
 * Atividades do próprio relatório (bolsista ou coordenação). Editar e apagar só
 * em mês que não terminou; a RLS confere tudo de novo.
 */

async function exigirMembro(): Promise<EstadoAcao | null> {
  try {
    await ensureGestaoMember();
    return null;
  } catch (error) {
    return falha(error instanceof Error ? error.message : "Acesso negado.");
  }
}

async function executar(escrita: () => Promise<unknown>, mensagem: string): Promise<EstadoAcao> {
  try {
    await escrita();
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidatePath("/gestao/relatorio");
  return sucesso(mensagem);
}

function id(form: FormData): string {
  const valor = form.get("id");
  return typeof valor === "string" ? valor : "";
}

export async function cadastrarAtividadeAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirMembro();
  if (negado) return negado;
  const atividade = validarAtividade(form);
  if (!atividade.ok) return falha(atividade.mensagem);
  return executar(() => cadastrarAtividade(atividade.valor), "Atividade cadastrada.");
}

export async function editarAtividadeAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirMembro();
  if (negado) return negado;
  const atividade = validarAtividade(form);
  if (!id(form)) return falha("Atividade não informada.");
  if (!atividade.ok) return falha(atividade.mensagem);
  if (!mesEditavel(atividade.valor.data.slice(0, 7))) {
    return falha("Escolha uma data deste mês ou de um mês que ainda não terminou.");
  }
  return executar(() => editarAtividade(id(form), atividade.valor), "Atividade atualizada.");
}

export async function apagarAtividadeAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirMembro();
  if (negado) return negado;
  if (!id(form)) return falha("Atividade não informada.");
  return executar(() => apagarAtividade(id(form)), "Atividade apagada.");
}

/** Só o link de comprovação de um encontro; quem pode o banco decide. Vazio apaga. */
export async function salvarLinkEncontroAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirMembro();
  if (negado) return negado;
  const encontroId = form.get("encontroId");
  const link = String(form.get("link") ?? "").trim();
  if (typeof encontroId !== "string" || !encontroId) return falha("Encontro não informado.");
  if (link && (link.length > 500 || !/^https?:\/\/\S+$/.test(link))) {
    return falha("O link precisa começar com http:// ou https://, sem espaços, com até 500 caracteres.");
  }
  return executar(() => escreverLinkComprovacao(encontroId, link || null), "Link salvo.");
}
