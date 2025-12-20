import { getSupabaseClient } from "./client";
import { CourseProps } from "./types";

export async function insertCurso(
  course: Omit<CourseProps, "id">
): Promise<CourseProps | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("nossos_cursos")
    .insert(course)
    .select()
    .single();

  if (error) {
    console.error("Erro ao inserir curso:", error.message);
    return null;
  }

  return data;
}

export async function getCursos(): Promise<CourseProps[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("nossos_cursos")
    .select("*")
    .order("title");

  if (error) {
    console.error(error.message);
    return [];
  }

  return data ?? [];
}

export async function getCursoCompleto(id: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("nossos_cursos")
    .select(`
      id,
      title,
      description,
      imageUrl,
      modules (
        id,
        title,
        lessons (
          id,
          title,
          duration,
          link
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error(error.message);
    return null;
  }

  return data;
}

export async function deleteCurso(courseId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  await supabase.from("users_cursos").delete().eq("Curso", courseId);

  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("Curso", courseId);

  if (modules?.length) {
    const moduleIds = modules.map(m => m.id);
    await supabase.from("lessons").delete().in("modulo", moduleIds);
  }

  await supabase.from("modules").delete().eq("Curso", courseId);
  await supabase.from("nossos_cursos").delete().eq("id", courseId);

  return true;
}
