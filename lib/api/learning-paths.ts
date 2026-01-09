import "server-only";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { type LearningPathSummary, type CourseSummary, type CourseRow, type LearningPathRow, getThumbUrl, getCoverUrl } from "./types";

interface LearningPathCourseJoin {
    order?: number | null;
    course?: CourseRow;
}

function mapCourse(row: CourseRow): CourseSummary {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        level: row.level ?? null,
        status: row.status ?? null,
        thumbUrl: getThumbUrl(row.thumb),
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

    return data.map((row) => {
        const lpRow = row as unknown as LearningPathRow;
        return {
            id: lpRow.id,
            title: lpRow.title,
            description: lpRow.description ?? null,
            coverUrl: getCoverUrl(lpRow.cover),
            courses: ((lpRow.courses || []) as LearningPathCourseJoin[])
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((item) => mapCourse((item.course || {}) as CourseRow)),
        };
    });
}
