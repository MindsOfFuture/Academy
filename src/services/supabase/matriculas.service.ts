import { getSupabaseClient } from "./client";

export async function verificarMatriculaExistente(courseId: string) {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("users_cursos")
    .select("id")
    .eq("Curso", courseId)
    .eq("User", user.id)
    .maybeSingle();

  return data;
}

export async function matricularAluno(courseId: string) {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("users_cursos")
    .insert({ Curso: courseId, User: user.id })
    .select()
    .single();

  return data;
}
