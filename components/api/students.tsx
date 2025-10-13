import { createClient as createBrowserClient } from "@/lib/supabase/client";

export type UserSummary = {
  id: string;
  display_name: string;
  email: string | null;
};

export type UserCursoProps = {
  id: string;
  Curso: string;
  User: UserSummary;
  progresso?: number;
};

// =======================
// CADASTRAR ALUNO EM CURSO
// =======================

export async function insertAlunoNoCurso(
  cursoId: string,
  alunoId: string
): Promise<UserCursoProps | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("users_cursos")
    .insert([{ Curso: cursoId, User: alunoId, progresso: 0 }])
    .select(`
      id,
      Curso,
      progresso,
      User: users(
        id,
        display_name,
        email
      )
    `)
    .single();

  if (error) {
    console.error("Erro ao adicionar aluno ao curso:", error.message);
    return null;
  }

  return data as unknown as UserCursoProps;
}

// =======================
// LISTAR ALUNOS DE UM CURSO
// =======================

export async function getAlunosDoCurso(
  cursoId: string
): Promise<UserCursoProps[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("users_cursos")
    .select(`
      id,
      Curso,
      progresso,
      User:users (
        id,
        display_name,
        email
      )
    `)
    .eq("Curso", cursoId)
    .order("id", { ascending: true });

  if (error) {
    console.error("Erro ao buscar alunos do curso:", error.message);
    return [];
  }

  return (data ?? []) as unknown as UserCursoProps[];
}

// =======================
// REMOVER ALUNO DE UM CURSO
// =======================

export async function removeAlunoDoCurso(
  matriculaId: string
): Promise<boolean> {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from("users_cursos").delete()
    .eq("id", matriculaId)

  if (error) {
    console.error("Erro ao remover aluno do curso:", error.message);
    return false;
  }

  return true;
}

export async function getAllUsers(): Promise<UserSummary[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, email")
    .order("display_name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar usuários:", error.message);
    return [];
  }

  return (data ?? []) as UserSummary[];
}
