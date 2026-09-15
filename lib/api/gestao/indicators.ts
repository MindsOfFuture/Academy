import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  IndicadorAlunos,
  IndicadorAulas,
  IndicadorCargaBolsistas,
  IndicadorPresenca,
  IndicadorReservasOnibus,
  IndicadorTermos,
  IndicadoresGestao,
} from "./types";

/**
 * Fronteira de query do módulo de gestão interna.
 *
 * Única camada que lê o schema `gestao.*` (spec 002). Usa o cliente SSR
 * autenticado (`server.ts#createClient`) — a RLS do schema confere o papel de
 * membro (`coordenacao` | `bolsista`) pelo `auth.uid()` do chamador, então não
 * existe caminho de service role aqui. Nenhum componente/rota fala com o
 * Supabase direto sobre estas tabelas: passa sempre por este módulo.
 *
 * Toda query aponta o schema explicitamente com `.schema("gestao")`. Sem isso o
 * PostgREST cairia no schema padrão (`public`), onde estas tabelas não existem —
 * ou, pior, onde existe homônimo do produto público (`aluno`, `aula`).
 *
 * Os seis indicadores do convênio são derivados por query de agregação sobre as
 * tabelas normalizadas (spec 002, "indicador como dado, não como schema").
 */

/**
 * Indicador 6 lê a alocação junto do papel do membro: `!inner` descarta a
 * alocação sem vínculo e o filtro deixa passar só `papel = 'bolsista'`. A
 * junção existe no banco pela FK `agenda_bolsista.bolsista_id ->
 * papel_membro.user_profile_id` criada na migration do modelo operacional.
 */
const SELECT_CARGA = "bolsista_id, carga, papel_membro!inner(papel)";

/** Embed do PostgREST: objeto quando é 1:1, array quando a relação é 1:N. */
type VinculoPapel = { papel: string } | { papel: string }[] | null;

interface CargaRow {
  bolsista_id: string;
  carga: string;
  papel_membro: VinculoPapel;
}

function throwOnError(error: { message: string } | null): never | void {
  if (error) throw new Error(error.message);
}

function erroNaoAutenticado(): never {
  throw new Error("Usuário não autenticado.");
}

function papelDoVinculo(vinculo: VinculoPapel): string | null {
  const alvo = Array.isArray(vinculo) ? vinculo[0] : vinculo;
  return alvo?.papel ?? null;
}

/**
 * Só alocação de quem é bolsista hoje entra no indicador 6. O filtro roda no
 * banco (`SELECT_CARGA` + `eq`); esta conferência repete a regra em memória
 * para que uma alocação de coordenação nunca seja contada como carga de
 * bolsista, mesmo se a junção vier frouxa.
 */
function mapCarga(data: unknown): IndicadorCargaBolsistas {
  const bolsistas = ((data ?? []) as CargaRow[]).filter(
    (row) => papelDoVinculo(row.papel_membro) === "bolsista",
  );
  return {
    items: bolsistas.map((row) => ({ bolsistaId: row.bolsista_id, carga: row.carga })),
    totalAlocacoes: bolsistas.length,
  };
}

/** Indicador 1 — total de alunos participantes. */
export async function getTotalAlunos(): Promise<IndicadorAlunos> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) erroNaoAutenticado();

  const { error, count } = await supabase
    .schema("gestao")
    .from("aluno")
    .select("id", { count: "exact", head: true });
  throwOnError(error);
  return { total: count ?? 0 };
}

/** Indicador 2 — número de reservas de ônibus. */
export async function getReservasOnibus(): Promise<IndicadorReservasOnibus> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) erroNaoAutenticado();

  const { error, count } = await supabase
    .schema("gestao")
    .from("reserva")
    .select("id", { count: "exact", head: true })
    .eq("onibus", true);
  throwOnError(error);
  return { total: count ?? 0 };
}

/** Indicador 3 — termos arquivados vs. pendentes. */
export async function getTermos(): Promise<IndicadorTermos> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) erroNaoAutenticado();

  const { data, error } = await supabase
    .schema("gestao")
    .from("reserva_termo")
    .select("status");
  throwOnError(error);

  let pendentes = 0;
  let arquivados = 0;
  for (const row of (data ?? []) as { status: string }[]) {
    if (row.status === "arquivado") arquivados += 1;
    else pendentes += 1;
  }
  return { pendentes, arquivados };
}

/** Indicador 4 — presença (presentes vs. ausentes). */
export async function getPresenca(aulaId?: string): Promise<IndicadorPresenca> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) erroNaoAutenticado();

  let query = supabase.schema("gestao").from("presenca").select("presente");
  if (aulaId) query = query.eq("aula_id", aulaId);
  const { data, error } = await query;
  throwOnError(error);

  let presentes = 0;
  let ausentes = 0;
  for (const row of (data ?? []) as { presente: boolean }[]) {
    if (row.presente) presentes += 1;
    else ausentes += 1;
  }
  return { presentes, ausentes };
}

/** Indicador 5 — aulas/módulos realizados. */
export async function getAulasRealizadas(): Promise<IndicadorAulas> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) erroNaoAutenticado();

  const { error, count } = await supabase
    .schema("gestao")
    .from("aula")
    .select("id", { count: "exact", head: true })
    .not("realizada_em", "is", null);
  throwOnError(error);
  return { total: count ?? 0 };
}

/** Indicador 6 — alocação/carga dos bolsistas. */
export async function getCargaBolsistas(): Promise<IndicadorCargaBolsistas> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) erroNaoAutenticado();

  // Junção agenda_bolsista ⊗ papel_membro, filtrando apenas papel = 'bolsista'
  // (spec 002, indicador 6). A RLS já restringe às linhas visíveis ao chamador.
  const { data, error } = await supabase
    .schema("gestao")
    .from("agenda_bolsista")
    .select(SELECT_CARGA)
    .eq("papel_membro.papel", "bolsista");
  throwOnError(error);

  return mapCarga(data);
}

/** Agregado dos seis indicadores, numa única chamada à fronteira de query. */
export async function getIndicadores(): Promise<IndicadoresGestao> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) erroNaoAutenticado();

  const [
    alunosRes,
    onibusRes,
    termosRes,
    presencaRes,
    aulasRes,
    cargaRes,
  ] = await Promise.all([
    supabase.schema("gestao").from("aluno").select("id", { count: "exact", head: true }),
    supabase.schema("gestao").from("reserva").select("id", { count: "exact", head: true }).eq("onibus", true),
    supabase.schema("gestao").from("reserva_termo").select("status"),
    supabase.schema("gestao").from("presenca").select("presente"),
    supabase.schema("gestao").from("aula").select("id", { count: "exact", head: true }).not("realizada_em", "is", null),
    supabase.schema("gestao").from("agenda_bolsista").select(SELECT_CARGA).eq("papel_membro.papel", "bolsista"),
  ]);

  for (const res of [alunosRes, onibusRes, termosRes, presencaRes, aulasRes, cargaRes]) {
    throwOnError(res.error);
  }

  let pendentes = 0;
  let arquivados = 0;
  for (const row of (termosRes.data ?? []) as { status: string }[]) {
    if (row.status === "arquivado") arquivados += 1;
    else pendentes += 1;
  }

  let presentes = 0;
  let ausentes = 0;
  for (const row of (presencaRes.data ?? []) as { presente: boolean }[]) {
    if (row.presente) presentes += 1;
    else ausentes += 1;
  }

  return {
    alunos: { total: alunosRes.count ?? 0 },
    reservasOnibus: { total: onibusRes.count ?? 0 },
    termos: { pendentes, arquivados },
    presenca: { presentes, ausentes },
    aulas: { total: aulasRes.count ?? 0 },
    cargaBolsistas: mapCarga(cargaRes.data),
  };
}
