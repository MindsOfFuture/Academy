import { createClient as createBrowserClient } from "@/lib/supabase/client";

export type CourseProps = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

// Inserir curso
export async function insertCurso(
  course: Omit<CourseProps, "id">
): Promise<CourseProps | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("nossos_cursos")
    .insert([
      {
        title: course.title,
        description: course.description,
        imageUrl: course.imageUrl,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Erro ao inserir curso:", error.message);
    return null;
  }

  return data as CourseProps;
}

// Buscar todos os cursos
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
