"use server";

import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import { definirNumerosDoSite } from "@/lib/api/gestao/site";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import { falha, mensagemDeErro, sucesso, validarNumerosDoSite } from "@/lib/api/gestao/validacao";

/**
 * Se o menu do usuário mostra "Gestão": módulo ligado e quem está logado é
 * coordenação ou bolsista. Mesma checagem do guard, então o link nunca leva a um 404.
 */
export async function temAcessoGestaoAction(): Promise<boolean> {
  try {
    await ensureGestaoMember();
    return true;
  } catch {
    return false;
  }
}

/** Spec 019: a coordenação muda os números da página inicial. O banco confere de novo. */
export async function numerosDoSiteAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  try {
    if ((await ensureGestaoMember()) !== "coordenacao") return falha("Apenas a coordenação muda os números do site.");
  } catch (error) {
    return falha(error instanceof Error ? error.message : "Acesso negado.");
  }
  const numeros = validarNumerosDoSite(form);
  if (!numeros.ok) return falha(numeros.mensagem);
  try {
    await definirNumerosDoSite(numeros.valor.escolas, numeros.valor.alunos);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidatePath("/");
  revalidatePath("/gestao");
  return sucesso("Números atualizados. A página inicial já mostra os novos valores.");
}
