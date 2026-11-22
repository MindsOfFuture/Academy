"use server";

import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import { criarEncontroDoBolsista } from "@/lib/api/gestao/alocacao";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import { falha, mensagemDeErro, sucesso, validarEncontroDoBolsista } from "@/lib/api/gestao/validacao";

/** Qualquer membro cria um encontro sem escola nem turma; o banco confere de novo. */
export async function criarEncontroDoBolsistaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  try {
    await ensureGestaoMember();
  } catch (error) {
    return falha(error instanceof Error ? error.message : "Acesso negado.");
  }
  const encontro = validarEncontroDoBolsista(form);
  if (!encontro.ok) return falha(encontro.mensagem);
  try {
    await criarEncontroDoBolsista(encontro.valor);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  // O encontro aparece no calendário, no relatório, na carga e na alocação.
  revalidatePath("/gestao", "layout");
  return sucesso("Encontro criado.");
}
