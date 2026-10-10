import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MatriculaRow, MatriculaSummary, NovoAlunoTurma } from "./types";

function erro(error: { message: string } | null): void { if (error) throw new Error(error.message); }
function mapear(row: MatriculaRow): MatriculaSummary {
  const aluno = Array.isArray(row.aluno) ? row.aluno[0] : row.aluno;
  return { id: row.id, turmaId: row.turma_id, alunoId: row.aluno_id, nome: aluno.nome, idade: aluno.idade,
    anoEscolar: aluno.ano_escolar, situacao: row.situacao, finalizadaEm: row.finalizada_em, motivo: row.motivo };
}
export async function listarMatriculasTurma(turmaId: string): Promise<MatriculaSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").from("matricula")
    .select("id, turma_id, aluno_id, situacao, finalizada_em, finalizada_por, motivo, criado_em, aluno(id, nome, idade, ano_escolar)")
    .eq("turma_id", turmaId).order("criado_em", { ascending: false });
  erro(error);
  return ((data ?? []) as unknown as MatriculaRow[]).map(mapear);
}
export async function cadastrarAlunoTurma(aluno: NovoAlunoTurma): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").rpc("cadastrar_aluno_turma", {
    p_turma: aluno.turmaId, p_nome: aluno.nome, p_idade: aluno.idade,
    p_ano_escolar: aluno.anoEscolar, p_execucao: aluno.execucao ?? "ensino fundamental",
  });
  erro(error);
}
export async function finalizarMatricula(id: string, motivo: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").rpc("finalizar_matricula", { p_matricula: id, p_motivo: motivo });
  erro(error);
}
export async function cadastrarListaAlunosTurma(turmaId: string, alunos: { nome: string; idade: number; anoEscolar: string }[]): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").rpc("cadastrar_lista_alunos_turma", { p_turma: turmaId, p_alunos: alunos });
  erro(error);
}
export async function contarMatriculasAtivas(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").from("matricula").select("turma_id").eq("situacao", "ativa");
  erro(error);
  return ((data ?? []) as { turma_id: string }[]).reduce<Record<string, number>>((totais, linha) => {
    totais[linha.turma_id] = (totais[linha.turma_id] ?? 0) + 1;
    return totais;
  }, {});
}
