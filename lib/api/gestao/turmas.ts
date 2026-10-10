import "server-only";
import { createClient } from "@/lib/supabase/server";
import { ensureGestaoMember } from "./auth";
import type { AlunoSummary, EscolaSummary } from "./types";
import type { EncontroSummary, IndicadoresTurma, MatriculaSummary, TurmaDetail, TurmaRow, TurmaSummary, TurmaStatus } from "./turmas-types";
import { revisarImportacao, validarData, validarHorario, validarId, validarSemestre, validarStatus } from "./turmas-validacao";

async function cliente(coordenacao = false) {
  const papel = await ensureGestaoMember();
  if (coordenacao && papel !== "coordenacao") throw new Error("Apenas a coordenação gerencia os cadastros.");
  return (await createClient()).schema("gestao");
}
function erro(error: { message: string } | null) { if (error) throw new Error(error.message); }
function nome(valor: string, limite = 120) {
  if (!valor.trim() || valor.trim().length > limite) throw new Error("Preencha os dados obrigatórios corretamente.");
  return valor.trim();
}
export function mapTurma(r: TurmaRow): TurmaSummary {
  return { id: r.id, escolaId: r.escola_id, reservaId: r.reserva_id, nome: r.nome, modalidade: r.modalidade, semestre: r.semestre, status: r.status, encerradaEm: r.encerrada_em, encerradaPor: r.encerrada_por };
}
export function mapIndicadores(r: Record<string, number | string | null>): IndicadoresTurma {
  const n = (k: string) => Number(r[k] ?? 0);
  return { matriculas: n("matriculas"), encontrosPrevistos: n("encontros_previstos"), encontrosRealizados: n("encontros_realizados"), horasAula: n("horas_aula"), presentes: n("presentes"), ausentes: n("ausentes"), naoInformados: n("nao_informados"), frequencia: r.frequencia == null ? null : n("frequencia"), cobertura: r.cobertura == null ? null : n("cobertura"), termosPendentes: n("termos_pendentes"), termosArquivados: n("termos_arquivados"), termosLegadosSemArquivo: n("termos_legados_sem_arquivo"), certificadosEntregues: n("certificados_entregues") };
}
export async function listarTurmas(): Promise<TurmaSummary[]> {
  const db = await cliente();
  const { data, error } = await db.from("turma").select("*").order("semestre", { ascending: false }).order("nome");
  erro(error); return (data ?? []).map(mapTurma);
}
export async function criarEscola(input: { nome: string; cidade: string; categoria: string }) {
  const db = await cliente(true);
  const { data, error } = await db.from("escola").insert({ nome: nome(input.nome), cidade: nome(input.cidade), categoria: nome(input.categoria, 80) }).select("id").single();
  erro(error); return data!.id as string;
}
export async function atualizarEscola(id: string, input: { nome: string; cidade: string; categoria: string }) {
  const db = await cliente(true);
  const { data, error } = await db.from("escola").update({ nome: nome(input.nome), cidade: nome(input.cidade), categoria: nome(input.categoria, 80) }).eq("id", validarId(id)).select("id").single();
  erro(error); return data!.id as string;
}
export async function criarTurma(input: { escolaId: string; nome: string; modalidade: string; semestre: string; reservaId?: string }) {
  const db = await cliente(true);
  const { data, error } = await db.from("turma").insert({ escola_id: validarId(input.escolaId), nome: nome(input.nome), modalidade: nome(input.modalidade, 80), semestre: validarSemestre(input.semestre), reserva_id: input.reservaId ? validarId(input.reservaId) : null }).select("id").single();
  erro(error); return data!.id as string;
}
export async function atualizarTurma(id: string, input: { nome: string; modalidade: string; semestre: string; status: TurmaStatus }) {
  const db = await cliente(true);
  if (input.status === "encerrada") throw new Error("Revise as pendências antes de encerrar.");
  const { error } = await db.from("turma").update({ nome: nome(input.nome), modalidade: nome(input.modalidade, 80), semestre: validarSemestre(input.semestre), status: validarStatus(input.status) }).eq("id", validarId(id)).select("id").single();
  erro(error);
}
export interface CadastroAluno { nome: string; idade: number; escolaId: string; anoEscolar: string; modalidade: string; execucao: string }
export async function salvarAluno(input: CadastroAluno, id?: string) {
  const db = await cliente(true);
  if (!Number.isInteger(input.idade) || input.idade < 1 || input.idade > 120) throw new Error("Informe uma idade válida.");
  const { data: escola, error: escolaError } = await db.from("escola").select("categoria,cidade").eq("id", validarId(input.escolaId)).single();
  erro(escolaError);
  const valores = { nome: nome(input.nome), idade: input.idade, escola_id: input.escolaId, categoria_escola: escola!.categoria, cidade: escola!.cidade, ano_escolar: nome(input.anoEscolar, 80), modalidade: nome(input.modalidade, 80), execucao: nome(input.execucao, 80) };
  const query = id ? db.from("aluno").update(valores).eq("id", validarId(id)) : db.from("aluno").insert(valores);
  const { data, error } = await query.select("id").single(); erro(error); return data!.id as string;
}
export async function cadastrarAlunoNaTurma(turmaId: string, input: { nome: string; idade: number; anoEscolar: string; inicio: string }) {
  const db = await cliente(true);
  if (!Number.isInteger(input.idade) || input.idade < 1 || input.idade > 120) throw new Error("Informe uma idade válida.");
  const { data, error } = await db.rpc("cadastrar_aluno_turma", { p_turma: validarId(turmaId), p_nome: nome(input.nome), p_idade: input.idade, p_ano: nome(input.anoEscolar, 80), p_inicio: validarData(input.inicio) });
  erro(error); return data as string;
}
export async function matricularAluno(turmaId: string, alunoId: string, inicio: string) {
  const db = await cliente(true);
  // ignoreDuplicates preserva correções de matrícula e termo ao reenviar.
  const { error } = await db.from("matricula").upsert({ turma_id: validarId(turmaId), aluno_id: validarId(alunoId), inicio: validarData(inicio) }, { onConflict: "turma_id,aluno_id", ignoreDuplicates: true }); erro(error);
}
export async function finalizarMatricula(id: string, fim: string) {
  const db = await cliente(true);
  const { error } = await db.from("matricula").update({ fim: validarData(fim) }).eq("id", validarId(id)).select("id").single(); erro(error);
}
export async function alocarBolsista(turmaId: string, bolsistaId: string, revogar = false) {
  const db = await cliente(true);
  const valores = { turma_id: validarId(turmaId), bolsista_id: validarId(bolsistaId), revogado_em: revogar ? new Date().toISOString() : null };
  const query = revogar ? db.from("turma_bolsista").update({ revogado_em: valores.revogado_em }).eq("turma_id", turmaId).eq("bolsista_id", bolsistaId) : db.from("turma_bolsista").upsert(valores, { onConflict: "turma_id,bolsista_id" });
  const { error } = await query; erro(error);
}
export async function agendarEncontro(input: { turmaId: string; data: string; titulo: string; inicio: string; fim: string; professor: string }, id?: string) {
  const db = await cliente(true);
  const horarios = validarHorario(input.inicio, input.fim);
  const { data: turma, error: turmaError } = await db.from("turma").select("escola_id,modalidade").eq("id", validarId(input.turmaId)).single(); erro(turmaError);
  const valores = { turma_id: input.turmaId, escola_id: turma!.escola_id, modalidade: turma!.modalidade, data: validarData(input.data), aulas: nome(input.titulo), horario: `${horarios.inicio}–${horarios.fim}`, ...horarios, professor: input.professor.trim() || null };
  const query = id ? db.from("agenda").update(valores).eq("id", validarId(id)).eq("turma_id", input.turmaId) : db.from("agenda").insert(valores);
  const { error } = await query.select("id").single(); erro(error);
}
export async function salvarChamada(agendaId: string, itens: { alunoId: string; presente: boolean | null }[], realizada: boolean) {
  const db = await cliente();
  if (!Array.isArray(itens) || itens.length > 500 || typeof realizada !== "boolean") throw new Error("Chamada inválida.");
  for (const item of itens) {
    validarId(item.alunoId);
    if (item.presente !== null && typeof item.presente !== "boolean") throw new Error("Presença inválida.");
  }
  const { data, error } = await db.rpc("salvar_chamada", { p_agenda: validarId(agendaId), p_itens: itens, p_realizada: realizada }); erro(error); return data as string;
}
export async function encerrarTurma(id: string, confirmado: boolean) {
  const db = await cliente(true);
  const { error } = await db.rpc("encerrar_turma", { p_turma: validarId(id), p_confirmado: confirmado }); erro(error);
}
export async function importarMatriculas(input: { turmaId: string; origem: string; periodo: string; lote: string; json: string; revisado: boolean }) {
  const db = await cliente(true);
  const revisao = revisarImportacao(input.json);
  if (!input.revisado || revisao.problemas.length) throw new Error(revisao.problemas.join(" ") || "Confirme a revisão antes de importar.");
  const { data, error } = await db.rpc("importar_matriculas", { p_turma: validarId(input.turmaId), p_origem: nome(input.origem, 200), p_periodo: nome(input.periodo, 80), p_lote: nome(input.lote, 120), p_itens: revisao.linhas, p_revisado: true }); erro(error); return Number(data);
}
export async function registrarTermoLegado(matriculaId: string, reservaTermoId: string) {
  const db = await cliente(true);
  // A RPC concilia aluno/reserva e atualiza o status junto da referência, atomicamente.
  const { error } = await db.rpc("conciliar_termo_legado", { p_matricula: validarId(matriculaId), p_reserva_termo: validarId(reservaTermoId) }); erro(error);
}
export async function obterTurma(id: string): Promise<TurmaDetail | null> {
  const db = await cliente();
  const { data: row, error } = await db.from("turma").select("*").eq("id", validarId(id)).maybeSingle(); erro(error);
  if (!row) return null;
  const [mat, ag, ind, eq, autores] = await Promise.all([
    db.from("matricula").select("id,aluno_id,inicio,fim,termo_status,certificado_entregue_em,aluno(nome)").eq("turma_id", id).order("criado_em"),
    db.from("agenda").select("id,data,aulas,inicio,fim,professor,aula(id,realizada_em,m1)").eq("turma_id", id).order("data").order("inicio"),
    db.from("turma_indicadores").select("*").eq("turma_id", id).single(),
    db.rpc("turma_equipe", { p_turma: id }),
    db.rpc("chamada_autores", { p_turma: id }),
  ]);
  for (const r of [mat, ag, ind, eq, autores]) erro(r.error);
  type MatRow = { id: string; aluno_id: string; inicio: string; fim: string | null; termo_status: MatriculaSummary["termoStatus"]; certificado_entregue_em: string | null; aluno: { nome: string } | { nome: string }[] | null };
  const matriculas: MatriculaSummary[] = ((mat.data ?? []) as unknown as MatRow[]).map((m) => ({ id: m.id, alunoId: m.aluno_id, nome: (Array.isArray(m.aluno) ? m.aluno[0] : m.aluno)?.nome ?? "Aluno", inicio: m.inicio, fim: m.fim, termoStatus: m.termo_status, certificadoEntregueEm: m.certificado_entregue_em })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  type AgRow = { id: string; data: string; aulas: string; inicio: string | null; fim: string | null; professor: string | null; aula: { id: string; realizada_em: string | null; m1: boolean }[] };
  const encontros: EncontroSummary[] = ((ag.data ?? []) as unknown as AgRow[]).map((a) => { const lesson = a.aula?.find((l) => l.m1); return { id: a.id, data: a.data, titulo: a.aulas, inicio: a.inicio, fim: a.fim, professor: a.professor, aulaId: lesson?.id ?? null, realizadaEm: lesson?.realizada_em ?? null }; });
  const ids = encontros.flatMap((a) => a.aulaId ? [a.aulaId] : []);
  const pres = ids.length ? await db.from("presenca").select("aula_id,aluno_id,presente,atualizado_por,atualizado_em").in("aula_id", ids) : { data: [], error: null }; erro(pres.error);
  return { ...mapTurma(row as TurmaRow), matriculas, encontros, equipe: (eq.data ?? []) as { id: string; nome: string }[], indicadores: mapIndicadores(ind.data!), presencas: (pres.data ?? []).map((p) => ({ aulaId: p.aula_id, alunoId: p.aluno_id, presente: p.presente, atualizadoPor: p.atualizado_por, atualizadoEm: p.atualizado_em, autorNome: ((autores.data ?? []) as { id: string; nome: string }[]).find((a) => a.id === p.atualizado_por)?.nome ?? "Registro legado" })) };
}
export async function abrirTermoPrivado(matriculaId: string): Promise<string> {
  await cliente(true);
  validarId(matriculaId);
  // Nem URL nem upload de documento real enquanto a retenção está indefinida.
  throw new Error("Documentos bloqueados até a definição da retenção. Nenhum arquivo foi enviado.");
}
// Reutiliza o cadastro existente, sem tornar conta ou e-mail obrigatórios.
export type { AlunoSummary, EscolaSummary };
