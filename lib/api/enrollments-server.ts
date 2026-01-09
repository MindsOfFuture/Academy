"use server";

import { createClient } from "@/lib/supabase/server";
import { type CourseSummary, type EnrollmentSummary } from "./types";

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

export async function getUserCoursesServer(): Promise<EnrollmentSummary[]> {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return [];

    const { data: enrollments, error } = await supabase
        .from("enrollment")
        .select(
            "id, status, course:course_id (id, title, description, level, status, thumb:media_file!course_thumb_id_fkey(url))"
        )
        .eq("user_id", user.id);

    if (error || !enrollments) return [];

    const enrollmentIds = enrollments.map((e: any) => e.id);
    const courseIds = enrollments.map((e: any) => e.course?.id).filter(Boolean);

    if (courseIds.length === 0) return [];

    const { data: lessons } = await supabase
        .from("lesson")
        .select("id, course_id")
        .in("course_id", courseIds);

    const { data: progresses } = enrollmentIds.length
        ? await supabase
            .from("lesson_progress")
            .select("enrollment_id, lesson_id, is_completed")
            .in("enrollment_id", enrollmentIds)
        : { data: [] };

    const lessonsByCourse: Record<string, string[]> = {};
    (lessons || []).forEach((l: any) => {
        if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = [];
        lessonsByCourse[l.course_id].push(l.id);
    });

    const completedByEnrollment: Record<string, Set<string>> = {};
    (progresses || []).forEach((p: any) => {
        if (!completedByEnrollment[p.enrollment_id]) completedByEnrollment[p.enrollment_id] = new Set();
        if (p.is_completed) completedByEnrollment[p.enrollment_id].add(p.lesson_id);
    });

    return enrollments.map((e: any) => {
        const courseId = e.course?.id;
        const totalLessons = lessonsByCourse[courseId]?.length || 0;
        const completedLessons = completedByEnrollment[e.id]?.size || 0;
        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
            enrollmentId: e.id,
            status: e.status,
            course: mapCourse(e.course),
            progressPercent,
            completedLessons,
            totalLessons,
        };
    });
}
