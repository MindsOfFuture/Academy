import { createClient as createBrowserClient } from "@/lib/supabase/client";

export type UserCursoProps = {
  id: string;
  Curso: string;      // FK para nossos_cursos
  Aluno: string;      // FK para users
  progresso?: number; // opcional
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
    .from("user_cursos")
    .insert([{ Curso: cursoId, Aluno: alunoId, progresso: 0 }])
    .select()
    .single();

  if (error) {
    console.error("Erro ao adicionar aluno ao curso:", error.message);
    return null;
  }

  return data as UserCursoProps;
}

// =======================
// LISTAR ALUNOS DE UM CURSO
// =======================

export async function getAlunosDoCurso(
  cursoId: string
): Promise<UserCursoProps[]> {
  const supabase = createBrowserClient();
    console.log("cursoID"+cursoId)
  const { data, error } = await supabase
    .from("users_cursos")
    .select(`
      id,
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
    console.log("cursoID", data)

  return data as UserCursoProps[];
}

// =======================
// REMOVER ALUNO DE UM CURSO
// =======================

export async function removeAlunoDoCurso(
  cursoId: string,
  alunoId: string
): Promise<boolean> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("user_cursos")
    .delete()
    .eq("Curso", cursoId)
    .eq("Aluno", alunoId);

  if (error) {
    console.error("Erro ao remover aluno do curso:", error.message);
    return false;
  }

  return true;
}

export async function getAllUsers() {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, email")
    .order("display_name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar usuários:", error.message);
    return [];
  }

  return data;
}
