import "server-only";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { type LearningPathSummary, type CourseSummary } from "./types";

function mapCourse(row: any): CourseSummary {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        level: row.level ?? null,
        status: row.status ?? null,
        thumbUrl: row.thumb?.url ?? null,
    };
}

export async function getLearningPaths(): Promise<LearningPathSummary[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("learning_path")
        .select(`
      id,
      title,
      description,
      cover:media_file!learning_path_cover_media_id_fkey(url),
      courses:learning_path_course(order, course:course_id (id, title, description, level, status, thumb:media_file!course_thumb_id_fkey(url)))
    `)
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        coverUrl: row.cover?.url ?? null,
        courses: (row.courses || [])
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
            .map((item: any) => mapCourse(item.course || {})),
    }));
}
