"use server";

import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import {
  alterarPapel,
  buscarUsuarioPorEmail,
  cadastrarBolsa,
  concederPapel,
  definirDesligamento,
  removerMembro,
} from "@/lib/api/gestao/equipe";
import type { EstadoAcao, GestaoPapel } from "@/lib/api/gestao/types";
import { falha, mensagemDeErro, sucesso, validarBolsa, validarEmail } from "@/lib/api/gestao/validacao";

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

function idDoForm(form: FormData): string {
  const id = form.get("userProfileId");
  return typeof id === "string" ? id : "";
}

export async function concederPapelAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;

  const email = validarEmail(typeof form.get("email") === "string" ? (form.get("email") as string) : "");
  if (!email.ok) return falha(email.mensagem);
  const papel = papelDoForm(form);
  if (!papel) return falha("Escolha o papel.");

  try {
    const usuario = await buscarUsuarioPorEmail(email.valor);
    if (!usuario) {
      return falha("Nenhuma conta com este e-mail. A pessoa precisa criar a conta no site antes.");
    }
    await concederPapel(usuario.id, papel);
    revalidatePath(CAMINHO);
    const rotulo = papel === "coordenacao" ? "coordenação" : "bolsista";
    return sucesso(`${usuario.nome ?? usuario.email} agora faz parte da equipe como ${rotulo}.`);
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

export async function alterarPapelAction(_anterior: EstadoAcao | null, form: FormData): Promise<EstadoAcao> {
  const negado = await exigirCoordenacao();
  if (negado) return negado;
  const papel = papelDoForm(form);
  const id = idDoForm(form);
  if (!papel || !id) return falha("Escolha o papel.");

  try {
    await alterarPapel(id, papel);
    revalidatePath(CAMINHO);
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
