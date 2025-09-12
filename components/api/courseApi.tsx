import { createClient as createBrowserClient } from "@/lib/supabase/client";

export type CourseProps = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type ModuleProps = {
  id: string;
  course_id: string;
  title: string;
};

export type LessonProps = {
  id: string;
  module_id: string;
  title: string;
  duration: number; // em minutos, por ex
  link: string;
};

// =======================
// CURSOS
// =======================

export async function insertCurso(
  course: Omit<CourseProps, "id">
): Promise<CourseProps | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("nossos_cursos")
    .insert([course])
    .select()
    .single();

  if (error) {
    console.error("Erro ao inserir curso:", error.message);
    return null;
  }

  return data as CourseProps;
}

export async function getCursos(): Promise<CourseProps[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("nossos_cursos")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    console.error("Erro ao buscar cursos:", error.message);
    return [];
  }

  return data as CourseProps[];
}

export async function updateCurso(
  id: string,
  course: Omit<CourseProps, "id">
): Promise<CourseProps | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("nossos_cursos")
    .update(course)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar curso:", error.message);
    return null;
  }

  return data as CourseProps;
}

// =======================
// MÓDULOS
// =======================

export async function insertModule(module: { Curso: string; title: string }) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("modules")
    .insert([{ Curso: module.Curso, title: module.title }]) // id não passa
    .select()
    .single();

  if (error) {
    console.error("Erro ao inserir módulo:", error.message);
    return null;
  }

  return data;}

export async function getModules(courseId: string): Promise<ModuleProps[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("title", { ascending: true });

  if (error) {
    console.error("Erro ao buscar módulos:", error.message);
    return [];
  }

  return data as ModuleProps[];
}

// =======================
// LIÇÕES
// =======================

export async function insertLesson(
  lesson: Omit<LessonProps, "id">
): Promise<LessonProps | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("lessons")
    .insert([lesson])
    .select()
    .single();

  if (error) {
    console.error("Erro ao inserir lição:", error.message);
    return null;
  }

  return data as LessonProps;
}

export async function getLessons(moduleId: string): Promise<LessonProps[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("title", { ascending: true });

  if (error) {
    console.error("Erro ao buscar lições:", error.message);
    return [];
  }

  return data as LessonProps[];
}

// =======================
// CURSO COMPLETO (com módulos e lições)
// =======================

export async function getCursoCompleto(id: string) {
  const supabase = createBrowserClient();

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
    console.error("Erro ao buscar curso completo:", error.message);
    return null;
  }

  return data;
}
export async function getCurso(id: string) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("users_cursos")
    .select(`
      id,
      Curso:nossos_cursos (
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
      )
    `)
    .eq("Curso", id) // pega o registro de users_cursos específico
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
