"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import { atualizarArtigo, criarArtigo, enviarCapa } from "@/lib/api/gestao/artigos";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import { falha, mensagemDeErro, sucesso, validarArtigo, validarCapa } from "@/lib/api/gestao/validacao";

/** Artigos do site: só a coordenação. A RLS confere de novo em cada escrita. */

async function exigirCoordenacao(): Promise<EstadoAcao | null> {
  try {
    const papel = await ensureGestaoMember();
    return papel === "coordenacao" ? null : falha("Apenas a coordenação edita os artigos.");
  } catch (error) {
    return falha(error instanceof Error ? error.message : "Acesso negado.");
  }
}

export async function salvarArtigoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;

  const dados = validarArtigo(form);
  if (!dados.ok) return falha(dados.mensagem);
  const capa = validarCapa(form.get("capa"));
  if (!capa.ok) return falha(capa.mensagem);
  const idForm = form.get("id");
  const id = typeof idForm === "string" ? idForm : "";

  let criado = "";
  try {
    const capaId = capa.valor ? await enviarCapa(capa.valor) : null;
    if (id) {
      await atualizarArtigo(id, dados.valor, capaId);
    } else {
      criado = await criarArtigo(dados.valor, capaId);
    }
    revalidatePath("/gestao/pesquisa/artigos");
    revalidatePath("/");
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
  if (id) return sucesso("Artigo salvo.");
  // Fora do try: o redirect do Next funciona lançando.
  redirect(`/gestao/pesquisa/artigos?artigo=${criado}`);
}
