"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import { avisarMeta } from "@/lib/api/gestao/avisos";
import { concluirMeta, obterMeta, registrarAndamento, salvarMeta } from "@/lib/api/gestao/metas";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import { falha, mensagemDeErro, sucesso, validarAndamento, validarMeta } from "@/lib/api/gestao/validacao";

/**
 * Ações das metas. Toda ação confere o papel antes de tocar no banco; quem
 * registra andamento (responsável ou coordenação) a RLS decide.
 */

const LISTA = "/gestao/metas";

async function exigirMembro(): Promise<{ papel: "coordenacao" | "bolsista" } | EstadoAcao> {
  try {
    return { papel: await ensureGestaoMember() };
  } catch (error) {
    return falha(error instanceof Error ? error.message : "Acesso negado.");
  }
}

function idDoForm(form: FormData): string {
  const id = form.get("id");
  return typeof id === "string" ? id : "";
}

function revalidar(id: string): void {
  revalidatePath(LISTA);
  revalidatePath(`${LISTA}/${id}`);
  revalidatePath("/gestao");
}

export async function salvarMetaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;
  if (membro.papel !== "coordenacao") return falha("Apenas a coordenação cria e edita metas.");

  const id = idDoForm(form);
  const meta = validarMeta(form);
  if (!meta.ok) return falha(meta.mensagem);

  let salvo: string;
  let antes = null;
  try {
    antes = id ? await obterMeta(id) : null;
    salvo = await salvarMeta(id || null, meta.valor);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidar(salvo);

  // Quem entrou fica sabendo que é responsável; quem já estava, só se a meta mudou.
  const { titulo, descricao, prazo, responsaveis } = meta.valor;
  const jaEstavam = new Set(antes?.responsaveis.map((r) => r.id) ?? []);
  const mudou = antes && (antes.titulo !== titulo || antes.descricao !== descricao || antes.prazo !== prazo);
  const aviso = { id: salvo, titulo, prazo };
  await Promise.all([
    avisarMeta("atribuida", aviso, responsaveis.filter((r) => !jaEstavam.has(r))),
    mudou ? avisarMeta("alterada", aviso, responsaveis.filter((r) => jaEstavam.has(r))) : null,
  ]);
  if (id) return sucesso("Meta atualizada.");
  redirect(`${LISTA}/${salvo}`);
}

export async function concluirMetaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;
  if (membro.papel !== "coordenacao") return falha("Apenas a coordenação conclui metas.");

  const id = idDoForm(form);
  const reabrir = form.get("acao") === "reabrir";
  let meta;
  try {
    await concluirMeta(id, !reabrir);
    meta = await obterMeta(id);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidar(id);
  if (meta) await avisarMeta(reabrir ? "reaberta" : "concluida", meta, meta.responsaveis.map((r) => r.id));
  return sucesso(reabrir ? "Meta reaberta." : "Meta concluída.");
}

export async function andamentoMetaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;

  const id = idDoForm(form);
  const andamento = validarAndamento(form);
  if (!andamento.ok) return falha(andamento.mensagem);

  try {
    await registrarAndamento(id, andamento.valor.texto);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidar(id);
  return sucesso("Andamento registrado.");
}
