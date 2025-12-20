import { getSupabaseClient } from "./client";
import { ProgressoProps } from "./types";

export async function verificaProgresso(courseId: string) {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("progresso_aluno")
    .select("*")
    .eq("id_curso", courseId)
    .eq("id", user.id);

  return data as ProgressoProps[];
}

export async function registraProgresso(
  courseId: string,
  moduleId: number,
  itemId: number
) {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("progresso_aluno")
    .upsert({
      id_curso: courseId,
      id_modulo: moduleId,
      id_item_concluido: itemId,
      id: user.id
    }, {
      onConflict: "id,id_curso,id_modulo,id_item_concluido"
    })
    .select()
    .single();

  return data;
}
