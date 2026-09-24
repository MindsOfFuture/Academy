"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import {
  alternarApoio,
  criarMelhoria,
  editarMelhoria,
  responderMelhoria,
  retirarMelhoria,
} from "@/lib/api/gestao/melhorias";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import {
  falha,
  mensagemDeErro,
  sucesso,
  validarMelhoria,
  validarRespostaMelhoria,
} from "@/lib/api/gestao/validacao";

/**
 * Ações do pedido de melhoria (spec 011). Toda ação confere o papel antes de
 * tocar no banco; as regras de fato (autor, transições, motivo) são do banco.
 */

const LISTA = "/gestao/melhorias";

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

export async function criarMelhoriaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;

  const pedido = validarMelhoria(form);
  if (!pedido.ok) return falha(pedido.mensagem);

  let id: string;
  try {
    id = await criarMelhoria(pedido.valor);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidatePath(LISTA);
  revalidatePath("/gestao");
  redirect(`${LISTA}/${id}?enviado=1`);
}

export async function editarMelhoriaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;
  const id = idDoForm(form);
  const pedido = validarMelhoria(form);
  if (!pedido.ok) return falha(pedido.mensagem);

  try {
    const editou = await editarMelhoria(id, pedido.valor);
    if (!editou) return falha("Este pedido já foi analisado e não pode mais ser editado.");
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidatePath(LISTA);
  revalidatePath(`${LISTA}/${id}`);
  return sucesso("Pedido atualizado.");
}

export async function retirarMelhoriaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;
  const id = idDoForm(form);

  try {
    const retirou = await retirarMelhoria(id);
    if (!retirou) return falha("Este pedido já foi analisado e não pode mais ser retirado.");
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidatePath(LISTA);
  redirect(LISTA);
}

export async function responderMelhoriaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;
  if (membro.papel !== "coordenacao") return falha("Apenas a coordenação responde pedidos de melhoria.");

  const id = idDoForm(form);
  const resposta = validarRespostaMelhoria(form);
  if (!resposta.ok) return falha(resposta.mensagem);

  try {
    await responderMelhoria(id, resposta.valor);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidatePath(LISTA);
  revalidatePath(`${LISTA}/${id}`);
  revalidatePath("/gestao");
  return sucesso("Resposta registrada. Quem pediu foi avisado no sino.");
}

export async function apoiarMelhoriaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;
  const id = idDoForm(form);
  const apoiar = form.get("apoiar") === "1";

  try {
    await alternarApoio(id, apoiar);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidatePath(LISTA);
  revalidatePath(`${LISTA}/${id}`);
  return sucesso(apoiar ? "Apoio registrado." : "Apoio retirado.");
}
