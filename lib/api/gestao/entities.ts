import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  AgendaRow,
  AgendaSummary,
  AlunoRow,
  AlunoSummary,
  AulaRow,
  AulaSummary,
  EscolaRow,
  EscolaSummary,
  ListaEnviadaRow,
  ListaEnviadaSummary,
  PresencaRow,
  PresencaSummary,
  ReservaRow,
  ReservaSummary,
} from "./types";

/**
 * Leitura do registro operacional do schema `gestao.*` (spec 002).
 *
 * Fronteira única de consulta: mapeia `*Row` (snake_case) → `*Summary`
 * (camelCase). A RLS do schema confere o papel de membro pelo `auth.uid()` do
 * chamador; cliente SSR autenticado, sem caminho de service role.
 *
 * Toda leitura aponta o schema explicitamente com `.schema("gestao")`: sem isso
 * o PostgREST cairia no schema padrão (`public`), onde `aluno`/`aula` são outra
 * coisa (ou nada).
 */

function asserirAutenticado(user: { id: string } | null): string {
  if (!user) throw new Error("Usuário não autenticado.");
  return user.id;
}

function mapEscola(row: EscolaRow): EscolaSummary {
  return { id: row.id, nome: row.nome, categoria: row.categoria, cidade: row.cidade };
}

function mapAluno(row: AlunoRow): AlunoSummary {
  return {
    id: row.id,
    nome: row.nome,
    idade: row.idade,
    escolaId: row.escola_id,
    categoriaEscola: row.categoria_escola,
    anoEscolar: row.ano_escolar,
    modalidade: row.modalidade,
    execucao: row.execucao,
    cidade: row.cidade,
  };
}

function mapReserva(row: ReservaRow): ReservaSummary {
  return {
    id: row.id,
    escolaId: row.escola_id,
    onibus: row.onibus,
    dias: row.dias,
    horarios: row.horarios,
    modalidade: row.modalidade,
    numeroAlunos: row.numero_alunos,
    serie: row.serie,
    status: row.status,
  };
}

function mapAgenda(row: AgendaRow): AgendaSummary {
  return {
    id: row.id,
    data: row.data,
    escolaId: row.escola_id,
    aulas: row.aulas,
    modalidade: row.modalidade,
    horario: row.horario,
  };
}

function mapAula(row: AulaRow): AulaSummary {
  return {
    id: row.id,
    agendaId: row.agenda_id,
    titulo: row.titulo,
    realizadaEm: row.realizada_em,
  };
}

function mapPresenca(row: PresencaRow): PresencaSummary {
  return {
    id: row.id,
    aulaId: row.aula_id,
    alunoId: row.aluno_id,
    presente: row.presente,
    assinaturaStatus: row.assinatura_status,
    bolsistaId: row.bolsista_id,
    professorId: row.professor_id,
  };
}

function mapListaEnviada(row: ListaEnviadaRow): ListaEnviadaSummary {
  return {
    id: row.id,
    escolaId: row.escola_id,
    reservaId: row.reserva_id,
    nomes: row.nomes,
  };
}

export async function listEscolas(): Promise<EscolaSummary[]> {
  const supabase = await createClient();
  asserirAutenticado((await supabase.auth.getUser()).data.user);
  const { data, error } = await supabase.schema("gestao").from("escola").select("*").order("nome");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEscola);
}

export async function listAlunos(escolaId?: string): Promise<AlunoSummary[]> {
  const supabase = await createClient();
  asserirAutenticado((await supabase.auth.getUser()).data.user);
  let query = supabase.schema("gestao").from("aluno").select("*");
  if (escolaId) query = query.eq("escola_id", escolaId);
  const { data, error } = await query.order("nome");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAluno);
}

export async function listReservas(): Promise<ReservaSummary[]> {
  const supabase = await createClient();
  asserirAutenticado((await supabase.auth.getUser()).data.user);
  const { data, error } = await supabase.schema("gestao").from("reserva").select("*").order("criado_em", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapReserva);
}

export async function listAgendas(): Promise<AgendaSummary[]> {
  const supabase = await createClient();
  asserirAutenticado((await supabase.auth.getUser()).data.user);
  const { data, error } = await supabase.schema("gestao").from("agenda").select("*").order("data", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgenda);
}

export async function listAulas(agendaId?: string): Promise<AulaSummary[]> {
  const supabase = await createClient();
  asserirAutenticado((await supabase.auth.getUser()).data.user);
  let query = supabase.schema("gestao").from("aula").select("*");
  if (agendaId) query = query.eq("agenda_id", agendaId);
  const { data, error } = await query.order("realizada_em", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAula);
}

export async function listPresencas(aulaId?: string): Promise<PresencaSummary[]> {
  const supabase = await createClient();
  asserirAutenticado((await supabase.auth.getUser()).data.user);
  let query = supabase.schema("gestao").from("presenca").select("*");
  if (aulaId) query = query.eq("aula_id", aulaId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPresenca);
}

export async function listListasEnviadas(): Promise<ListaEnviadaSummary[]> {
  const supabase = await createClient();
  asserirAutenticado((await supabase.auth.getUser()).data.user);
  const { data, error } = await supabase.schema("gestao").from("lista_enviada").select("*").order("criado_em", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapListaEnviada);
}