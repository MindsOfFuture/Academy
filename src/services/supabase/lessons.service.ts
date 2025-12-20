import { getSupabaseClient } from "./client";
import { LessonProps } from "./types";

export async function insertLesson(
  lesson: Omit<LessonProps, "id">
): Promise<LessonProps | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("lessons")
    .insert(lesson)
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function getLessons(moduleId: string): Promise<LessonProps[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("title");

  if (error) return [];
  return data ?? [];
}

export async function deleteLesson(lessonId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  await supabase.from("lessons").delete().eq("id", lessonId);
  return true;
}
