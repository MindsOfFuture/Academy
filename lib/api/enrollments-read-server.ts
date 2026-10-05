import "server-only";

import type { createClient } from "@/lib/supabase/server";
import { type EnrollmentSummary, type CourseRow, type EnrollmentRow, type LessonRow, type LessonProgressRow, mapCourse } from "./types";

// Recebe cliente e userId JÁ verificados (auth.getUser) pelo chamador de servidor.
// Não é Server Action: nunca exponha a entrada pública que aceite userId/cliente.
export async function readUserCourses(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
): Promise<EnrollmentSummary[]> {
    const { data: enrollments, error } = await supabase
        .from("enrollment")
        .select(
            "id, status, course:course_id (id, title, description, level, status, thumb:media_file!course_thumb_id_fkey(url))"
        )
        .eq("user_id", userId);

    if (error || !enrollments) return [];

    const validEnrollments = enrollments
        .map((e) => e as unknown as EnrollmentRow)
        .filter((e): e is EnrollmentRow & { course: CourseRow } => Boolean(e?.id && e.course?.id));

    const enrollmentIds = validEnrollments.map((e) => e.id);
    const courseIds = validEnrollments.map((e) => e.course.id);

    if (courseIds.length === 0) return [];

    // Aulas e progresso são independentes: dispara as duas consultas juntas.
    const [{ data: lessons }, { data: progresses }] = await Promise.all([
        supabase
            .from("lesson")
            .select("id, course_id")
            .in("course_id", courseIds),
        enrollmentIds.length
            ? supabase
                .from("lesson_progress")
                .select("enrollment_id, lesson_id, is_completed")
                .in("enrollment_id", enrollmentIds)
            : { data: [] },
    ]);

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

    return validEnrollments.map((enrollmentRow) => {
        const courseId = enrollmentRow.course?.id;
        const totalLessons = courseId ? lessonsByCourse[courseId]?.length || 0 : 0;
        const completedLessons = completedByEnrollment[enrollmentRow.id]?.size || 0;
        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
            enrollmentId: enrollmentRow.id,
            status: enrollmentRow.status ?? null,
            course: mapCourse(enrollmentRow.course),
            progressPercent,
            completedLessons,
            totalLessons,
        };
    });
}
