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

// Deletar módulo

// Deletar módulo com lições
export async function deleteModule(moduleId: string): Promise<boolean> {
  const supabase = createBrowserClient();

  // 1. Deletar todas as lições do módulo
  const { error: lessonError } = await supabase
    .from("lessons")
    .delete()
    .eq("modulo", moduleId);

  if (lessonError) {
    console.error("Erro ao deletar lições do módulo:", lessonError.message);
    return false;
  }

  // 2. Deletar o módulo
  const { error: moduleError } = await supabase
    .from("modules")
    .delete()
    .eq("id", moduleId);

  if (moduleError) {
    console.error("Erro ao deletar módulo:", moduleError.message);
    return false;
  }

  return true;
}

// Deletar lição
export async function deleteLesson(lessonId: string): Promise<boolean> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", lessonId);

  if (error) {
    console.error("Erro ao deletar lição:", error.message);
    return false;
  }

  return true;
}

// Deletar curso com todos os módulos e lições
export async function deleteCurso(courseId: string): Promise<boolean> {
  const supabase = createBrowserClient();

  // 0. Deletar registros em users_cursos
  const { error: usersError } = await supabase
    .from("users_cursos")
    .delete()
    .eq("Curso", courseId);

  if (usersError) {
    console.error("Erro ao deletar usuários do curso:", usersError.message);
    return false;
  }

  // 1. Deletar lições dos módulos do curso
  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("id")
    .eq("Curso", courseId);

  if (modulesError) {
    console.error("Erro ao buscar módulos do curso:", modulesError.message);
    return false;
  }

  if (modules?.length) {
    const lessonIds = modules.map((m: unknown) => m.id);
    const { error: lessonError } = await supabase
      .from("lessons")
      .delete()
      .in("modulo", lessonIds);

    if (lessonError) {
      console.error("Erro ao deletar lições do curso:", lessonError.message);
      return false;
    }
  }

  // 2. Deletar módulos do curso
  const { error: moduleError } = await supabase
    .from("modules")
    .delete()
    .eq("Curso", courseId);

  if (moduleError) {
    console.error("Erro ao deletar módulos do curso:", moduleError.message);
    return false;
  }

  // 3. Deletar o curso
  const { error: courseError } = await supabase
    .from("nossos_cursos")
    .delete()
    .eq("id", courseId);

  if (courseError) {
    console.error("Erro ao deletar curso:", courseError.message);
    return false;
  }

  return true;
}

