"use server";

import { createClient } from "@/lib/supabase/server";
import { type CourseSummary, type EnrollmentSummary, type CourseRow, type EnrollmentRow, type LessonRow, type LessonProgressRow, getThumbUrl } from "./types";

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

    const enrollmentIds = enrollments.map((e) => (e as unknown as EnrollmentRow).id);
    const courseIds = enrollments.map((e) => (e as unknown as EnrollmentRow).course?.id).filter(Boolean);

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
    (lessons || []).forEach((l) => {
        const lesson = l as LessonRow;
        if (!lesson.course_id) return;
        if (!lessonsByCourse[lesson.course_id]) lessonsByCourse[lesson.course_id] = [];
        lessonsByCourse[lesson.course_id].push(lesson.id);
    });

    const completedByEnrollment: Record<string, Set<string>> = {};
    (progresses || []).forEach((p) => {
        const progress = p as LessonProgressRow;
        if (!completedByEnrollment[progress.enrollment_id]) completedByEnrollment[progress.enrollment_id] = new Set();
        if (progress.is_completed) completedByEnrollment[progress.enrollment_id].add(progress.lesson_id);
    });

    return enrollments.map((e) => {
        const enrollmentRow = e as unknown as EnrollmentRow;
        const courseId = enrollmentRow.course?.id;
        const totalLessons = courseId ? lessonsByCourse[courseId]?.length || 0 : 0;
        const completedLessons = completedByEnrollment[enrollmentRow.id]?.size || 0;
        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
            enrollmentId: enrollmentRow.id,
            status: enrollmentRow.status ?? null,
            course: mapCourse(enrollmentRow.course as CourseRow),
            progressPercent,
            completedLessons,
            totalLessons,
        };
    });
}
