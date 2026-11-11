"use server";

import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import { registrarTreinamento, salvarTreinamento } from "@/lib/api/gestao/treinamentos";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import { falha, mensagemDeErro, sucesso } from "@/lib/api/gestao/validacao";
import { youtubeId } from "@/lib/youtube";

/** Vídeos de treinamento (spec 025). As funções do banco conferem o papel de novo. */

export async function salvarTreinamentoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  try {
    if ((await ensureGestaoMember()) !== "coordenacao") return falha("Apenas a coordenação publica treinamentos.");
  } catch (error) {
    return falha(error instanceof Error ? error.message : "Acesso negado.");
  }
  const numero = Number(form.get("numero"));
  const titulo = String(form.get("titulo") ?? "").trim();
  const id = youtubeId(String(form.get("link") ?? ""));
  if (!Number.isInteger(numero) || numero < 1 || numero > 999) return falha("Informe o número do vídeo (1 a 999).");
  if (titulo.length < 3 || titulo.length > 200) return falha("Informe um título com 3 a 200 letras.");
  if (!id) return falha("Cole o link do vídeo no YouTube (por exemplo, https://youtu.be/...).");
  try {
    await salvarTreinamento(numero, titulo, id);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  revalidatePath("/gestao/treinamentos");
  return sucesso(`Vídeo ${numero} publicado.`);
}

/** Chamado pelo player: ao abrir o vídeo e ao chegar ao fim. Falha em silêncio para não travar o vídeo. */
export async function registrarTreinamentoAction(videoId: string, concluiu: boolean): Promise<void> {
  try {
    await registrarTreinamento(videoId, concluiu);
  } catch {
    // shortcut: perda de um registro não impede assistir; se faltar dado no painel, registrar em log.
  }
}
