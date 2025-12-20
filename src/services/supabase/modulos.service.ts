import { getSupabaseClient } from "./client";
import { ModuleProps } from "./types";

export async function insertModule(courseId: string, title: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("modules")
    .insert({ Curso: courseId, title })
    .select()
    .single();

  if (error) {
    console.error(error.message);
    return null;
  }

  return data;
}

export async function getModules(courseId: string): Promise<ModuleProps[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("title");

  if (error) return [];
  return data ?? [];
}

export async function deleteModule(moduleId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  await supabase.from("lessons").delete().eq("modulo", moduleId);
  await supabase.from("modules").delete().eq("id", moduleId);

  return true;
}
