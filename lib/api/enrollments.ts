import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { type CourseSummary, type EnrollmentSummary, type CourseRow, type EnrollmentRow, type LessonProgressRow, getThumbUrl } from "./types";

interface EnrollmentWithCountsRow {
    id: string;
    status: string | null;
    course: {
        id: string;
        title: string;
        description: string | null;
        level: string | null;
        status: string | null;
        thumb: { url?: string | null } | { url?: string | null }[] | null;
        lessons: { count: number }[];
    } | null;
    completed_lessons: { count: number }[];
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

function getSupabase() {
    return createBrowserSupabase();
}

export async function verifyEnrollment(courseId: string) {
    const supabase = getSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return null;

    const { data } = await supabase
        .from("enrollment")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

    return data;
}

export async function enrollInCourse(courseId: string) {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Usuário não autenticado.");

    const existing = await verifyEnrollment(courseId);
    if (existing) return existing;

    const { data, error } = await supabase
        .from("enrollment")
        .insert({ course_id: courseId, user_id: user.id, status: "active" })
        .select("id")
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function getUserCourses(): Promise<EnrollmentSummary[]> {
    const supabase = getSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return [];

    const { data: enrollments, error } = await supabase
        .from("enrollment")
        .select(`
            id,
            status,
            course:course_id (
                id, title, description, level, status,
                thumb:media_file!course_thumb_id_fkey(url),
                lessons:lesson(count)
            ),
            completed_lessons:lesson_progress(count)
        `)
        .eq("user_id", user.id)
        .eq("completed_lessons.is_completed", true);

    if (error || !enrollments) return [];

    return enrollments.map<EnrollmentSummary>((row) => {
        const enrollmentRow = row as unknown as EnrollmentWithCountsRow;
        const course = enrollmentRow.course;
        const totalLessons = course?.lessons?.[0]?.count ?? 0;
        const completed = enrollmentRow.completed_lessons?.[0]?.count ?? 0;
        const progressPercent = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

        return {
            enrollmentId: enrollmentRow.id,
            status: enrollmentRow.status ?? null,
            course: mapCourse(course as CourseRow),
            progressPercent,
            completedLessons: completed,
            totalLessons,
        };
    });
}

export async function fetchLessonProgress(courseId: string) {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return [];

    const { data: enrollment } = await supabase
        .from("enrollment")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!enrollment?.id) return [];

    const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("enrollment_id", enrollment.id)
        .eq("is_completed", true);

    return (data || []).map((row) => (row as LessonProgressRow).lesson_id as string);
}

export async function toggleLessonProgress(courseId: string, lessonId: string): Promise<boolean> {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Usuário não autenticado.");

    const { data: enrollment, error: enrollError } = await supabase
        .from("enrollment")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (enrollError) {
        console.error("Erro ao buscar matrícula:", enrollError);
        throw new Error(`Erro ao buscar matrícula: ${enrollError.message}`);
    }

    if (!enrollment?.id) {
        throw new Error("Usuário não matriculado neste curso.");
    }

    // Verificar se já existe progresso
    const { data: existing, error: existingError } = await supabase
        .from("lesson_progress")
        .select("id, is_completed")
        .eq("enrollment_id", enrollment.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

    if (existingError) {
        console.error("Erro ao buscar progresso existente:", existingError);
        throw new Error(`Erro ao buscar progresso: ${existingError.message}`);
    }

    const newState = !(existing?.is_completed ?? false);

    const { error } = await supabase
        .from("lesson_progress")
        .upsert({
            enrollment_id: enrollment.id,
            lesson_id: lessonId,
            is_completed: newState,
            completed_at: newState ? new Date().toISOString() : null,
        }, {
            onConflict: "enrollment_id,lesson_id",
        });

    if (error) {
        console.error("Erro no upsert:", error);
        throw new Error(`Erro ao salvar progresso: ${error.message}`);
    }
    return newState;
}

export async function listCourseStudents(courseId: string) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
        .from("enrollment")
        .select("id, status, user:user_id (id, full_name, email)")
        .eq("course_id", courseId)
        .order("enrolled_at", { ascending: true });

    if (error || !data) return [];
    return data.map((row) => {
        const enrollmentRow = row as unknown as EnrollmentRow;
        // user pode vir como array (join) - pegar o primeiro elemento
        const userData = enrollmentRow.user;
        const user = Array.isArray(userData) ? userData[0] : userData;
        return {
            id: enrollmentRow.id,
            status: enrollmentRow.status,
            user,
        };
    });
}

export async function addStudentToCourse(courseId: string, userId: string) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
        .from("enrollment")
        .insert({ course_id: courseId, user_id: userId, status: "active" })
        .select("id, status, user:user_id (id, full_name, email)")
        .maybeSingle();
    if (error || !data) return null;
    // user pode vir como array (join) - pegar o primeiro elemento
    const userData = data.user;
    const user = Array.isArray(userData) ? userData[0] : userData;
    return { id: data.id, status: data.status, user };
}

export async function removeStudentFromCourse(enrollmentId: string): Promise<boolean> {
    const supabase = createBrowserSupabase();
    await supabase.from("lesson_progress").delete().eq("enrollment_id", enrollmentId);
    const { error } = await supabase.from("enrollment").delete().eq("id", enrollmentId);
    return !error;
}
