import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  AreaMelhoria,
  GestaoPapel,
  Melhoria,
  MelhoriaRow,
  NovaMelhoria,
  Pendencia,
  RespostaMelhoria,
  StatusMelhoria,
} from "./types";

/**
 * Pedido de melhoria dos bolsistas (spec 011).
 *
 * Leitura por `gestao.listar_melhorias()` (traz o nome de quem pediu, que a
 * RLS de `user_profile` esconderia, e deriva "atrasada" por data). Escrita
 * direto na tabela: autor, status inicial, transições, motivo obrigatório e
 * aviso no sino são regras do banco (migration `20260924_gestao_melhorias.sql`).
 */

export const AREA_MELHORIA: Record<AreaMelhoria, string> = {
  plataforma: "Plataforma (site dos alunos e professores)",
  gestao: "Gestão (esta área)",
  aulas_material: "Aulas e material",
  processo: "Processo do projeto",
  outra: "Outra",
};

export const STATUS_MELHORIA: Record<StatusMelhoria, string> = {
  nova: "Nova",
  em_analise: "Em análise",
  aceita: "Aceita",
  recusada: "Recusada",
  duplicada: "Repetida",
  entregue: "Entregue",
};

/** Próximos status que a coordenação pode escolher — espelho da regra do banco. */
export const PROXIMOS_STATUS: Record<StatusMelhoria, StatusMelhoria[]> = {
  nova: ["em_analise", "aceita", "recusada", "duplicada"],
  em_analise: ["aceita", "recusada", "duplicada"],
  aceita: ["entregue"],
  recusada: [],
  duplicada: [],
  entregue: [],
};

const PESO_STATUS: Record<StatusMelhoria, number> = {
  nova: 1,
  em_analise: 2,
  aceita: 3,
  entregue: 4,
  recusada: 5,
  duplicada: 5,
};

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export function mapMelhoria(row: MelhoriaRow): Melhoria {
  return {
    id: row.id,
    autorId: row.autor,
    autorNome: row.autor_nome,
    titulo: row.titulo,
    area: row.area,
    problema: row.problema,
    proposta: row.proposta,
    quemSofre: row.quem_sofre,
    status: row.status,
    resposta: row.resposta,
    duplicadaDe: row.duplicada_de,
    linkExecucao: row.link_execucao,
    respondidaEm: row.respondida_em,
    criadoEm: row.criado_em,
    apoios: Number(row.apoios ?? 0),
    apoiei: Boolean(row.apoiei),
    atrasada: Boolean(row.atrasada),
  };
}

/**
 * Fila da coordenação: atrasadas primeiro, depois novas mais antigas, depois o
 * que está em andamento; decididas por último, mais recentes primeiro.
 */
export function ordenarFila(melhorias: Melhoria[]): Melhoria[] {
  return [...melhorias].sort((a, b) => {
    if (a.atrasada !== b.atrasada) return a.atrasada ? -1 : 1;
    const peso = PESO_STATUS[a.status] - PESO_STATUS[b.status];
    if (peso !== 0) return peso;
    const aberta = a.status === "nova" || a.status === "em_analise";
    return aberta ? a.criadoEm.localeCompare(b.criadoEm) : b.criadoEm.localeCompare(a.criadoEm);
  });
}

/** Cartões da tela Hoje (spec 011). */
export function pendenciasDeMelhoria(papel: GestaoPapel, usuarioId: string, melhorias: Melhoria[], agora: Date): Pendencia[] {
  if (papel === "coordenacao") {
    const esperando = melhorias.filter((m) => m.status === "nova");
    if (esperando.length === 0) return [];
    const atrasadas = esperando.filter((m) => m.atrasada).length;
    return [
      {
        tipo: "melhoria_sem_resposta",
        titulo: `${esperando.length} ${esperando.length === 1 ? "pedido de melhoria espera" : "pedidos de melhoria esperam"} resposta`,
        detalhe: atrasadas > 0 ? `${atrasadas} há mais de 14 dias` : "Responder em até 14 dias",
        href: "/gestao/melhorias",
        urgente: atrasadas > 0,
      },
    ];
  }

  const semana = agora.getTime() - 7 * 86_400_000;
  return melhorias
    .filter((m) => m.autorId === usuarioId && m.respondidaEm && new Date(m.respondidaEm).getTime() >= semana)
    .map((m) => ({
      tipo: "melhoria_respondida" as const,
      titulo: `Seu pedido "${m.titulo}" está ${STATUS_MELHORIA[m.status].toLowerCase()}`,
      detalhe: m.resposta ?? "Veja a resposta da coordenação.",
      href: `/gestao/melhorias/${m.id}`,
    }));
}

export async function listarMelhorias(): Promise<Melhoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").rpc("listar_melhorias");
  throwOnError(error);
  return ((data ?? []) as MelhoriaRow[]).map(mapMelhoria);
}

export async function obterMelhoria(id: string): Promise<Melhoria | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").rpc("listar_melhorias", { p_id: id });
  throwOnError(error);
  const [linha] = (data ?? []) as MelhoriaRow[];
  return linha ? mapMelhoria(linha) : null;
}

export async function criarMelhoria(pedido: NovaMelhoria): Promise<string> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Usuário não autenticado.");
  const { data, error } = await supabase
    .schema("gestao")
    .from("melhoria")
    .insert({
      // O banco sobrescreve o autor com auth.uid(); mandar o mesmo valor só
      // satisfaz o with check da policy.
      autor: auth.user.id,
      titulo: pedido.titulo,
      area: pedido.area,
      problema: pedido.problema,
      proposta: pedido.proposta,
      quem_sofre: pedido.quemSofre,
    })
    .select("id")
    .single();
  throwOnError(error);
  return (data as { id: string }).id;
}

export async function editarMelhoria(id: string, pedido: NovaMelhoria): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("gestao")
    .from("melhoria")
    .update({
      titulo: pedido.titulo,
      area: pedido.area,
      problema: pedido.problema,
      proposta: pedido.proposta,
      quem_sofre: pedido.quemSofre,
    })
    .eq("id", id)
    .select("id");
  throwOnError(error);
  return ((data ?? []) as unknown[]).length > 0;
}

export async function retirarMelhoria(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").from("melhoria").delete().eq("id", id).select("id");
  throwOnError(error);
  return ((data ?? []) as unknown[]).length > 0;
}

export async function responderMelhoria(id: string, resposta: RespostaMelhoria): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .from("melhoria")
    .update({
      status: resposta.status,
      resposta: resposta.resposta,
      duplicada_de: resposta.duplicadaDe,
      link_execucao: resposta.linkExecucao,
    })
    .eq("id", id);
  throwOnError(error);
}

export async function alternarApoio(id: string, apoiar: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Usuário não autenticado.");
  const tabela = supabase.schema("gestao").from("melhoria_apoio");
  const { error } = apoiar
    ? await tabela.insert({ melhoria_id: id, user_profile_id: auth.user.id })
    : await tabela.delete().eq("melhoria_id", id).eq("user_profile_id", auth.user.id);
  throwOnError(error);
}

export async function usuarioAtualId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
