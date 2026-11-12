"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import {
  apagarProducao,
  apagarReuniao,
  criarProducao,
  criarReuniao,
  editarProducao,
  editarReuniao,
} from "@/lib/api/gestao/pesquisa";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import { falha, mensagemDeErro, validarProducao, validarReuniao } from "@/lib/api/gestao/validacao";

/**
 * Ações da pesquisa. Ordem: permissão → validação → banco. Quem edita (autor ou
 * coordenação) a RLS decide; apagar é só da coordenação, aqui e na RLS.
 */

const LISTA = "/gestao/pesquisa";
const PRODUCOES = `${LISTA}?parte=producoes`;

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

export async function salvarReuniaoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;
  const reuniao = validarReuniao(form);
  if (!reuniao.ok) return falha(reuniao.mensagem);

  const id = idDoForm(form);
  try {
    if (id) {
      if (!(await editarReuniao(id, reuniao.valor))) return falha("Só quem registrou ou a coordenação edita.");
    } else {
      await criarReuniao(reuniao.valor);
    }
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidatePath(LISTA);
  redirect(LISTA);
}

export async function apagarReuniaoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;
  if (membro.papel !== "coordenacao") return falha("Apenas a coordenação apaga.");

  try {
    if (!(await apagarReuniao(idDoForm(form)))) return falha("Esta reunião não existe mais.");
  } catch (error) {
    return falha(mensagemDeErro(error, "Não foi possível apagar. Tente de novo."));
  }
  revalidatePath(LISTA);
  redirect(LISTA);
}

export async function salvarProducaoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;
  const producao = validarProducao(form);
  if (!producao.ok) return falha(producao.mensagem);

  const id = idDoForm(form);
  try {
    if (id) {
      if (!(await editarProducao(id, producao.valor))) return falha("Só quem registrou ou a coordenação edita.");
    } else {
      await criarProducao(producao.valor);
    }
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidatePath(LISTA);
  redirect(PRODUCOES);
}

export async function apagarProducaoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const membro = await exigirMembro();
  if ("ok" in membro) return membro;
  if (membro.papel !== "coordenacao") return falha("Apenas a coordenação apaga.");

  try {
    if (!(await apagarProducao(idDoForm(form)))) return falha("Esta produção não existe mais.");
  } catch (error) {
    return falha(mensagemDeErro(error, "Não foi possível apagar. Tente de novo."));
  }
  revalidatePath(LISTA);
  redirect(PRODUCOES);
}
