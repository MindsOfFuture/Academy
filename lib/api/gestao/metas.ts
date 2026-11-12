import "server-only";
import { createClient } from "@/lib/supabase/server";
import { nomesDaEquipe } from "./alocacao";
import type { Meta, MetaRow, NovaMeta, Pendencia, StatusMeta } from "./types";

/**
 * Metas da equipe. Leitura direta com os responsáveis e o andamento embutidos;
 * nomes de `gestao.nomes_da_equipe()`, porque a RLS de `user_profile` esconde
 * os perfis alheios. Quem grava o quê é regra do banco (migration
 * `20261115_gestao_atrasos_e_metas.sql`); o status é derivado aqui.
 */

export const STATUS_META: Record<StatusMeta, string> = {
  em_dia: "Em dia",
  atrasada: "Atrasada",
  concluida: "Concluída",
};

const PESO_STATUS: Record<StatusMeta, number> = { atrasada: 0, em_dia: 1, concluida: 2 };

const SELECT_META = "id, titulo, descricao, prazo, concluida_em, criado_em, meta_responsavel(user_profile_id)";

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/** `hoje` em "AAAA-MM-DD" (Brasília): o prazo vence no fim do dia. */
export function statusDaMeta(meta: Pick<Meta, "prazo" | "concluidaEm">, hoje: string): StatusMeta {
  if (meta.concluidaEm) return "concluida";
  return meta.prazo < hoje ? "atrasada" : "em_dia";
}

/** Atrasadas, depois em dia pelo prazo mais próximo, concluídas por último. */
export function ordenarMetas(metas: Meta[], hoje: string): Meta[] {
  return [...metas].sort(
    (a, b) => PESO_STATUS[statusDaMeta(a, hoje)] - PESO_STATUS[statusDaMeta(b, hoje)] || a.prazo.localeCompare(b.prazo),
  );
}

function dataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

/** Cartões da tela Hoje: só para quem é responsável pela meta atrasada. */
export function pendenciasDeMeta(usuarioId: string, metas: Meta[], hoje: string): Pendencia[] {
  return metas
    .filter((m) => statusDaMeta(m, hoje) === "atrasada" && m.responsaveis.some((r) => r.id === usuarioId))
    .map((m) => ({
      tipo: "meta_atrasada" as const,
      titulo: `Meta "${m.titulo}" está atrasada`,
      detalhe: `Prazo: ${dataCurta(m.prazo)}`,
      href: `/gestao/metas/${m.id}`,
      urgente: true,
    }));
}

function mapMeta(row: MetaRow, nomes: Map<string, string>): Meta {
  const nome = (id: string) => nomes.get(id) ?? "Pessoa da equipe";
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    prazo: row.prazo,
    concluidaEm: row.concluida_em,
    criadoEm: row.criado_em,
    responsaveis: (row.meta_responsavel ?? [])
      .map((r) => ({ id: r.user_profile_id, nome: nome(r.user_profile_id) }))
      .sort((a, b) => a.nome.localeCompare(b.nome)),
    andamentos: (row.meta_andamento ?? [])
      .map((a) => ({ id: a.id, autorId: a.autor, autorNome: nome(a.autor), texto: a.texto, criadoEm: a.criado_em }))
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)),
  };
}

export async function listarMetas(): Promise<Meta[]> {
  const supabase = await createClient();
  const [{ data, error }, nomes] = await Promise.all([
    supabase.schema("gestao").from("meta").select(SELECT_META).order("prazo"),
    nomesDaEquipe(),
  ]);
  throwOnError(error);
  return ((data ?? []) as MetaRow[]).map((m) => mapMeta(m, nomes));
}

export async function obterMeta(id: string): Promise<Meta | null> {
  const supabase = await createClient();
  const [{ data, error }, nomes] = await Promise.all([
    supabase
      .schema("gestao")
      .from("meta")
      .select(`${SELECT_META}, meta_andamento(id, autor, texto, criado_em)`)
      .eq("id", id)
      .maybeSingle(),
    nomesDaEquipe(),
  ]);
  throwOnError(error);
  return data ? mapMeta(data as MetaRow, nomes) : null;
}

/** Cria (id nulo) ou edita a meta e troca a lista de responsáveis, de uma vez. */
export async function salvarMeta(id: string | null, meta: NovaMeta): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").rpc("salvar_meta", {
    p_id: id,
    p_titulo: meta.titulo,
    p_descricao: meta.descricao,
    p_prazo: meta.prazo,
    p_responsaveis: meta.responsaveis,
  });
  throwOnError(error);
  return data as string;
}

/** O banco carimba a data de conclusão; `false` reabre. */
export async function concluirMeta(id: string, concluir: boolean): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("gestao")
    .from("meta")
    .update({ concluida_em: concluir ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id");
  throwOnError(error);
  if (((data ?? []) as unknown[]).length === 0) throw new Error("gestao: apenas a coordenação conclui metas");
}

export async function registrarAndamento(metaId: string, texto: string): Promise<void> {
  const supabase = await createClient();
  // Autor e hora vêm do banco.
  const { error } = await supabase.schema("gestao").from("meta_andamento").insert({ meta_id: metaId, texto });
  throwOnError(error);
}
