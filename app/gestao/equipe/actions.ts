"use server";

import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import {
  buscarUsuarios,
  cadastrarBolsa,
  concederPapel,
  definirDesligamento,
  definirPapel,
  removerMembro,
} from "@/lib/api/gestao/equipe";
import type { EstadoAcao, GestaoPapel, PapeisMembro, UsuarioEncontrado } from "@/lib/api/gestao/types";
import { falha, mensagemDeErro, sucesso, validarBolsa } from "@/lib/api/gestao/validacao";

/**
 * Ações da tela de equipe (spec 003). Toda ação confere o papel antes de tocar
 * no banco; a RLS confere de novo em cada escrita.
 */

const CAMINHO = "/gestao/equipe";

async function exigirCoordenacao(): Promise<EstadoAcao | null> {
  try {
    const papel = await ensureGestaoMember();
    return papel === "coordenacao" ? null : falha("Apenas a coordenação gerencia a equipe.");
  } catch (error) {
    return falha(error instanceof Error ? error.message : "Acesso negado.");
  }
}

function papelDoForm(form: FormData): GestaoPapel | null {
  const papel = form.get("papel");
  return papel === "coordenacao" || papel === "bolsista" ? papel : null;
}

/** O formulário de adicionar oferece bolsista, coordenação ou os dois (spec 012). */
function papeisDoForm(form: FormData): PapeisMembro | null {
  const papel = form.get("papel");
  if (papel === "ambos") return { coordenacao: true, bolsista: true };
  if (papel === "coordenacao") return { coordenacao: true, bolsista: false };
  if (papel === "bolsista") return { coordenacao: false, bolsista: true };
  return null;
}

function descreverPapeis(papeis: PapeisMembro): string {
  if (papeis.coordenacao && papeis.bolsista) return "coordenação e bolsista";
  return papeis.coordenacao ? "coordenação" : "bolsista";
}

function idDoForm(form: FormData): string {
  const id = form.get("userProfileId");
  return typeof id === "string" ? id : "";
}

/**
 * Busca da caixa "Adicionar pessoa" (spec 015). Chamada a cada letra digitada,
 * então não lança: sem permissão ou com erro, devolve lista vazia.
 */
export async function buscarPessoasAction(termo: string): Promise<UsuarioEncontrado[]> {
  if (await exigirCoordenacao()) return [];
  if (typeof termo !== "string" || termo.trim().length < 3) return [];
  try {
    return await buscarUsuarios(termo.trim().slice(0, 100));
  } catch {
    return [];
  }
}

export async function concederPapelAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;

  const id = idDoForm(form);
  const nome = typeof form.get("nome") === "string" ? (form.get("nome") as string) : "A pessoa";
  if (!id) return falha("Busque a pessoa pelo nome e escolha na lista.");
  const papeis = papeisDoForm(form);
  if (!papeis) return falha("Escolha o papel.");

  try {
    const final = await concederPapel(id, papeis);
    revalidatePath(CAMINHO);
    revalidatePath("/gestao");
    return sucesso(`${nome} agora faz parte da equipe como ${descreverPapeis(final)}.`);
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
}

export async function cadastrarBolsaAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;

  const bolsa = validarBolsa(form);
  if (!bolsa.ok) return falha(bolsa.mensagem);

  try {
    await cadastrarBolsa(bolsa.valor);
    revalidatePath(CAMINHO);
    revalidatePath("/gestao");
    return sucesso("Bolsa cadastrada.");
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
}

export async function definirPapelAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const papel = papelDoForm(form);
  const id = idDoForm(form);
  const acao = form.get("acao");
  if (!papel || !id || (acao !== "dar" && acao !== "tirar")) return falha("Escolha o papel.");

  try {
    await definirPapel(id, papel, acao === "dar");
    revalidatePath(CAMINHO);
    revalidatePath("/gestao");
    return sucesso("Papel atualizado.");
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
}

export async function desligamentoAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = idDoForm(form);
  const desligar = form.get("acao") === "desligar";
  if (!id) return falha("Pessoa não informada.");

  try {
    await definirDesligamento(id, desligar);
    revalidatePath(CAMINHO);
    return sucesso(desligar ? "Pessoa desligada. O acesso foi cortado e o histórico fica." : "Acesso devolvido.");
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
}

export async function removerMembroAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const id = idDoForm(form);
  if (!id) return falha("Pessoa não informada.");

  try {
    await removerMembro(id);
    revalidatePath(CAMINHO);
    return sucesso("Pessoa removida da equipe.");
  } catch (error) {
    return falha(mensagemDeErro(error));
  }
}
