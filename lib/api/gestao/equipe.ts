import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BolsaVigente, EquipeRow, GestaoPapel, MembroEquipe, NovaBolsa, PapeisMembro, UsuarioBuscadoRow } from "./types";

/**
 * Equipe e bolsa do projeto (spec 003).
 *
 * A leitura da equipe passa por `gestao.equipe()` e a busca por
 * `gestao.buscar_usuario_por_email()`: a RLS de `public.user_profile` não deixa
 * a coordenação ler perfis alheios, e as duas funções devolvem só nome e e-mail,
 * só para a coordenação ativa. A escrita vai direto nas tabelas, sob a RLS
 * fatiada da migration `20260923_gestao_fundacao.sql`.
 *
 * Cliente SSR autenticado; nenhum caminho de service role.
 */

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function numero(valor: number | string | null): number {
  return typeof valor === "number" ? valor : Number(valor ?? 0);
}

export function mapMembro(row: EquipeRow): MembroEquipe {
  const bolsaVigente: BolsaVigente | null =
    row.bolsa_id && row.modalidade && row.bolsa_inicio && row.bolsa_fim
      ? {
          id: row.bolsa_id,
          modalidade: row.modalidade,
          cargaSemanalHoras: numero(row.carga_semanal_horas),
          valorMensal: numero(row.valor_mensal),
          inicio: row.bolsa_inicio,
          fim: row.bolsa_fim,
        }
      : null;

  return {
    userProfileId: row.user_profile_id,
    nome: row.nome?.trim() || "Pessoa sem nome no cadastro",
    email: row.email ?? "",
    coordenacao: row.coordenacao,
    bolsista: row.bolsista,
    desligadoEm: row.desligado_em,
    membroDesde: row.membro_desde,
    bolsaVigente,
    temAlocacao: row.tem_alocacao,
  };
}

export async function listarEquipe(): Promise<MembroEquipe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").rpc("equipe");
  throwOnError(error);
  return ((data ?? []) as EquipeRow[]).map(mapMembro);
}

export async function buscarUsuarioPorEmail(email: string): Promise<UsuarioBuscadoRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").rpc("buscar_usuario_por_email", { p_email: email });
  throwOnError(error);
  const linhas = (data ?? []) as UsuarioBuscadoRow[];
  return linhas[0] ?? null;
}

/**
 * Dá papel a quem já tem conta (spec 012). Quem nunca foi membro entra com os
 * papéis escolhidos; quem está desligado volta só com eles, sem segundo
 * vínculo; quem já está ativo soma os escolhidos aos que já tem. Devolve os
 * papéis com que a pessoa ficou.
 */
export async function concederPapel(userProfileId: string, papeis: PapeisMembro): Promise<PapeisMembro> {
  const supabase = await createClient();
  const { data: existente, error: erroLeitura } = await supabase
    .schema("gestao")
    .from("papel_membro")
    .select("coordenacao, bolsista, desligado_em")
    .eq("user_profile_id", userProfileId)
    .maybeSingle();
  throwOnError(erroLeitura);

  const escolhidos = { coordenacao: papeis.coordenacao, bolsista: papeis.bolsista };
  if (!existente) {
    const { error } = await supabase
      .schema("gestao")
      .from("papel_membro")
      .insert({ user_profile_id: userProfileId, ...escolhidos });
    throwOnError(error);
    return escolhidos;
  }

  const atual = existente as PapeisMembro & { desligado_em: string | null };
  const final = atual.desligado_em
    ? escolhidos
    : { coordenacao: atual.coordenacao || escolhidos.coordenacao, bolsista: atual.bolsista || escolhidos.bolsista };
  if (!atual.desligado_em && final.coordenacao === atual.coordenacao && final.bolsista === atual.bolsista) {
    throw new Error("gestao: esta pessoa já tem esse papel na equipe");
  }

  const { error } = await supabase
    .schema("gestao")
    .from("papel_membro")
    .update({ ...final, desligado_em: null })
    .eq("user_profile_id", userProfileId);
  throwOnError(error);
  return final;
}

/**
 * Dá ou tira um papel de quem está na equipe. O banco recusa deixar a pessoa
 * sem papel e tirar a última pessoa ativa da coordenação.
 */
export async function definirPapel(userProfileId: string, papel: GestaoPapel, ativo: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .from("papel_membro")
    .update({ [papel]: ativo })
    .eq("user_profile_id", userProfileId);
  throwOnError(error);
}

/** Desligar corta o acesso na hora; reativar devolve. O histórico fica. */
export async function definirDesligamento(userProfileId: string, desligar: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .from("papel_membro")
    .update({ desligado_em: desligar ? new Date().toISOString() : null })
    .eq("user_profile_id", userProfileId);
  throwOnError(error);
}

/** Só funciona para quem nunca foi alocado; o banco recusa o resto. */
export async function removerMembro(userProfileId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").from("papel_membro").delete().eq("user_profile_id", userProfileId);
  throwOnError(error);
}

export async function cadastrarBolsa(bolsa: NovaBolsa): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").from("bolsa").insert({
    bolsista_id: bolsa.bolsistaId,
    modalidade: bolsa.modalidade,
    carga_semanal_horas: bolsa.cargaSemanalHoras,
    valor_mensal: bolsa.valorMensal,
    inicio: bolsa.inicio,
    fim: bolsa.fim,
  });
  throwOnError(error);
}
