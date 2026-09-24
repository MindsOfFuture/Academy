import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BolsaVigente, EquipeRow, GestaoPapel, MembroEquipe, NovaBolsa, UsuarioBuscadoRow } from "./types";

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
    papel: row.papel,
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
 * Concede papel a quem já tem conta. Se a pessoa já foi membro e está
 * desligada, reativa com o papel novo em vez de criar um segundo vínculo.
 */
export async function concederPapel(userProfileId: string, papel: GestaoPapel): Promise<void> {
  const supabase = await createClient();
  const { data: existente, error: erroLeitura } = await supabase
    .schema("gestao")
    .from("papel_membro")
    .select("user_profile_id, desligado_em")
    .eq("user_profile_id", userProfileId)
    .maybeSingle();
  throwOnError(erroLeitura);

  if (existente) {
    if (!(existente as { desligado_em: string | null }).desligado_em) {
      throw new Error("gestao: esta pessoa já faz parte da equipe");
    }
    const { error } = await supabase
      .schema("gestao")
      .from("papel_membro")
      .update({ papel, desligado_em: null })
      .eq("user_profile_id", userProfileId);
    throwOnError(error);
    return;
  }

  const { error } = await supabase.schema("gestao").from("papel_membro").insert({ user_profile_id: userProfileId, papel });
  throwOnError(error);
}

export async function alterarPapel(userProfileId: string, papel: GestaoPapel): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .from("papel_membro")
    .update({ papel })
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
