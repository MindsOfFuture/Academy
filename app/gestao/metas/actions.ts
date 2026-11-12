"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import { concluirMeta, registrarAndamento, salvarMeta } from "@/lib/api/gestao/metas";
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
  try {
    salvo = await salvarMeta(id || null, meta.valor);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidar(salvo);
  if (id) return sucesso("Meta atualizada.");
  redirect(`${LISTA}/${salvo}`);
}

export async function concluirMetaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;
  if (membro.papel !== "coordenacao") return falha("Apenas a coordenação conclui metas.");

  const id = idDoForm(form);
  const reabrir = form.get("acao") === "reabrir";
  try {
    await concluirMeta(id, !reabrir);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidar(id);
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
