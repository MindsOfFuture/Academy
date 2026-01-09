"use server";

import { createClient } from "@/lib/supabase/server";
import { type CourseSummary, type CourseDetail, type LessonSummary, type ModuleSummary } from "./types";

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

function mapLesson(row: any): LessonSummary {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        durationMinutes: row.duration_minutes ?? null,
        contentUrl: row.content_url ?? null,
        contentType: row.content_type ?? null,
        order: row.order ?? null,
        isPublic: row.is_public ?? null,
    };
}

function mapModule(row: any): ModuleSummary {
    return {
        id: row.id,
        title: row.title,
        order: row.order ?? null,
        lessons: (row.lessons || []).map(mapLesson),
    };
}

export async function listCoursesServer(): Promise<CourseSummary[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("course")
        .select("id, title, description, level, status, thumb:media_file!course_thumb_id_fkey(url)")
        .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapCourse);
}

export async function getCourseDetailServer(courseId: string): Promise<CourseDetail | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("course")
        .select(`
            id,
            title,
            description,
            level,
            status,
            thumb:media_file!course_thumb_id_fkey(url),
            modules:course_module (
                id,
                title,
                order,
                lessons:lesson (
                    id,
                    title,
                    description,
                    duration_minutes,
                    content_url,
                    content_type,
                    order,
                    is_public
                )
            )
        `)
        .eq("id", courseId)
        .maybeSingle();

    if (error || !data) return null;

    return {
        id: data.id,
        title: data.title,
        description: data.description ?? null,
        level: data.level ?? null,
        status: data.status ?? null,
        thumbUrl: (data as any).thumb?.url ?? null,
        modules: ((data as any).modules || []).map(mapModule),
    };
}
