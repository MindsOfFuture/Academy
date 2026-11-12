import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  NovaProducaoPesquisa,
  NovaReuniaoPesquisa,
  ProducaoPesquisa,
  ReuniaoPesquisa,
  TipoProducao,
} from "./types";

/**
 * Reuniões e produções de pesquisa. Quem lê, cria, edita e apaga é regra da
 * RLS (migration `20261117_gestao_pesquisa.sql`); autoria vem do banco.
 * Editar/apagar devolvem `false` quando a RLS não deixou tocar em nenhuma linha.
 */

const SELECT_REUNIAO = "id, data, participantes, feito, desdobramentos, criado_por";
const SELECT_PRODUCAO = "id, tipo, titulo, autores, data, onde, link, criado_por";

interface ReuniaoRow {
  id: string;
  data: string;
  participantes: string;
  feito: string;
  desdobramentos: string | null;
  criado_por: string | null;
}

interface ProducaoRow {
  id: string;
  tipo: TipoProducao;
  titulo: string;
  autores: string;
  data: string;
  onde: string | null;
  link: string | null;
  criado_por: string | null;
}

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function mapReuniao({ criado_por, ...resto }: ReuniaoRow): ReuniaoPesquisa {
  return { ...resto, criadoPor: criado_por };
}

function mapProducao({ criado_por, ...resto }: ProducaoRow): ProducaoPesquisa {
  return { ...resto, criadoPor: criado_por };
}

// Devolve o schema, não a tabela: o construtor de consulta é "thenable" e um `await` nele a executaria.
async function gestao() {
  return (await createClient()).schema("gestao");
}

// ---------------------------------------------------------------------------
// Reuniões
// ---------------------------------------------------------------------------

export async function listarReunioes(): Promise<ReuniaoPesquisa[]> {
  const { data, error } = await (await gestao()).from("reuniao_pesquisa")
    .select(SELECT_REUNIAO)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false });
  throwOnError(error);
  return ((data ?? []) as ReuniaoRow[]).map(mapReuniao);
}

export async function buscarReuniao(id: string): Promise<ReuniaoPesquisa | null> {
  const { data, error } = await (await gestao()).from("reuniao_pesquisa").select(SELECT_REUNIAO).eq("id", id).maybeSingle();
  throwOnError(error);
  return data ? mapReuniao(data as ReuniaoRow) : null;
}

export async function criarReuniao(dados: NovaReuniaoPesquisa): Promise<void> {
  const { error } = await (await gestao()).from("reuniao_pesquisa").insert(dados);
  throwOnError(error);
}

export async function editarReuniao(id: string, dados: NovaReuniaoPesquisa): Promise<boolean> {
  const { data, error } = await (await gestao()).from("reuniao_pesquisa").update(dados).eq("id", id).select("id");
  throwOnError(error);
  return ((data ?? []) as unknown[]).length > 0;
}

export async function apagarReuniao(id: string): Promise<boolean> {
  const { data, error } = await (await gestao()).from("reuniao_pesquisa").delete().eq("id", id).select("id");
  throwOnError(error);
  return ((data ?? []) as unknown[]).length > 0;
}

// ---------------------------------------------------------------------------
// Produções
// ---------------------------------------------------------------------------

export async function listarProducoes(tipo?: TipoProducao): Promise<ProducaoPesquisa[]> {
  let consulta = (await gestao()).from("producao_pesquisa").select(SELECT_PRODUCAO);
  if (tipo) consulta = consulta.eq("tipo", tipo);
  const { data, error } = await consulta.order("data", { ascending: false }).order("criado_em", { ascending: false });
  throwOnError(error);
  return ((data ?? []) as ProducaoRow[]).map(mapProducao);
}

export async function buscarProducao(id: string): Promise<ProducaoPesquisa | null> {
  const { data, error } = await (await gestao()).from("producao_pesquisa").select(SELECT_PRODUCAO).eq("id", id).maybeSingle();
  throwOnError(error);
  return data ? mapProducao(data as ProducaoRow) : null;
}

export async function criarProducao(dados: NovaProducaoPesquisa): Promise<void> {
  const { error } = await (await gestao()).from("producao_pesquisa").insert(dados);
  throwOnError(error);
}

export async function editarProducao(id: string, dados: NovaProducaoPesquisa): Promise<boolean> {
  const { data, error } = await (await gestao()).from("producao_pesquisa").update(dados).eq("id", id).select("id");
  throwOnError(error);
  return ((data ?? []) as unknown[]).length > 0;
}

export async function apagarProducao(id: string): Promise<boolean> {
  const { data, error } = await (await gestao()).from("producao_pesquisa").delete().eq("id", id).select("id");
  throwOnError(error);
  return ((data ?? []) as unknown[]).length > 0;
}
