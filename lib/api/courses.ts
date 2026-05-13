import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { type CourseSummary, type CourseDetail, type LessonSummary, type ModuleSummary, type CourseRow, type LessonRow, type ModuleRow, type RoleName, getThumbUrl } from "./types";

function mapCourse(row: CourseRow): CourseSummary {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        level: row.level ?? null,
        status: row.status ?? null,
        audience: row.audience ?? null,
        thumbUrl: getThumbUrl(row.thumb),
    };
}

function mapLesson(row: LessonRow): LessonSummary {
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

function mapModule(row: ModuleRow): ModuleSummary {
    return {
        id: row.id,
        title: row.title,
        order: row.order ?? null,
        lessons: (row.lessons || []).map(mapLesson),
    };
}

async function getCurrentUserAndRole(supabase: SupabaseClient): Promise<{ userId: string | null; role: RoleName; }> {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;
    if (!userId) {
        return { userId: null, role: "unknown" };
    }

    const { data: roleData } = await supabase
        .from("user_role")
        .select("role(name)")
        .eq("user_profile_id", userId)
        .maybeSingle();

    const rawRole = Array.isArray(roleData?.role) ? roleData?.role[0] : roleData?.role;
    const role = rawRole?.name === "admin" || rawRole?.name === "teacher" || rawRole?.name === "student"
        ? (rawRole.name as RoleName)
        : "student";

    return { userId, role };
}

async function ensureCourseOwnerOrAdmin(
    supabase: SupabaseClient,
    courseId: string,
    userId: string | null,
    role: RoleName,
): Promise<void> {
    if (role !== "teacher") return;
    if (!userId) throw new Error("Usuário não autenticado.");

    const { data, error } = await supabase
        .from("course")
        .select("owner_id")
        .eq("id", courseId)
        .maybeSingle();

    if (error || !data || data.owner_id !== userId) {
        throw new Error("Acesso negado.");
    }
}

async function getCourseIdByModuleId(
    supabase: SupabaseClient,
    moduleId: string,
): Promise<string | null> {
    const { data } = await supabase
        .from("course_module")
        .select("course_id")
        .eq("id", moduleId)
        .maybeSingle();
    return (data?.course_id as string | undefined) ?? null;
}

async function getCourseIdByLessonId(
    supabase: SupabaseClient,
    lessonId: string,
): Promise<string | null> {
    const { data } = await supabase
        .from("lesson")
        .select("course_id")
        .eq("id", lessonId)
        .maybeSingle();
    return (data?.course_id as string | undefined) ?? null;
}

type SupabaseClient = ReturnType<typeof createBrowserSupabase>;

async function withSupabase<T>(handler: (supabase: SupabaseClient) => Promise<T>): Promise<T> {
    const supabase = createBrowserSupabase();
    return handler(supabase);
}

export async function listCourses(): Promise<CourseSummary[]> {
    return withSupabase(async (supabase) => {
        const { userId, role } = await getCurrentUserAndRole(supabase);
        let query = supabase
            .from("course")
            .select("id, title, description, level, status, audience, thumb:media_file!course_thumb_id_fkey(url)");

        if (role === "teacher" && userId) {
            query = query.eq("owner_id", userId);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error || !data) return [];
        return data.map(mapCourse);
    });
}

export async function getCourseDetail(courseId: string): Promise<CourseDetail | null> {
    return withSupabase(async (supabase) => {
        const { data, error } = await supabase
            .from("course")
            .select(`
        id,
        title,
        description,
        level,
        status,
        audience,
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
            ...mapCourse(data as CourseRow),
            modules: ((data as CourseRow).modules || []).map(mapModule),
        };
    });
}

async function ensureThumbId(url: string | null | undefined, supabase: SupabaseClient, ownerId: string | null) {
    if (!url || !ownerId) return null;
    const { data, error } = await supabase
        .from("media_file")
        .insert({ url, owner_id: ownerId, type: "image" })
        .select("id")
        .maybeSingle();
    if (error) return null;
    return data?.id ?? null;
}

export async function createCourse(payload: { title: string; description: string; imageUrl?: string; level?: string; status?: string; audience?: string; }) {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    if (!userId) throw new Error("Usuário não autenticado.");

    if (role === "teacher") {
        const { data: profile } = await supabase
            .from("user_profile")
            .select("verification_status")
            .eq("id", userId)
            .maybeSingle();

        if (profile?.verification_status !== "approved") {
            throw new Error("Professor não verificado. Aguarde aprovação do administrador para criar cursos.");
        }
    }

    const thumbId = await ensureThumbId(payload.imageUrl, supabase, userId);

    const { data, error } = await supabase
        .from("course")
        .insert({
            title: payload.title,
            description: payload.description,
            level: payload.level ?? "básico",
            status: payload.status ?? "draft",
            audience: payload.audience ?? "student",
            owner_id: userId,
            thumb_id: thumbId,
        })
        .select(
            "id, title, description, level, status, audience, thumb:media_file!course_thumb_id_fkey(url)"
        )
        .maybeSingle();

    if (error || !data) return null;
    return mapCourse(data as CourseRow);
}

export async function updateCourse(courseId: string, payload: { title?: string; description?: string; imageUrl?: string; level?: string; status?: string; audience?: string; }) {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    if (!userId) throw new Error("Usuário não autenticado.");

    if (role === "teacher") {
        const { data: profile } = await supabase
            .from("user_profile")
            .select("verification_status")
            .eq("id", userId)
            .maybeSingle();

        if (profile?.verification_status !== "approved") {
            throw new Error("Professor não verificado. Aguarde aprovação do administrador para editar cursos.");
        }
    }

    await ensureCourseOwnerOrAdmin(supabase, courseId, userId, role);

    const thumbId = await ensureThumbId(payload.imageUrl, supabase, userId);

    let query = supabase
        .from("course")
        .update({
            ...(payload.title ? { title: payload.title } : {}),
            ...(payload.description ? { description: payload.description } : {}),
            ...(payload.level ? { level: payload.level } : {}),
            ...(payload.status ? { status: payload.status } : {}),
            ...(payload.audience ? { audience: payload.audience } : {}),
            ...(thumbId ? { thumb_id: thumbId } : {}),
            updated_at: new Date().toISOString(),
        })
        .eq("id", courseId);

    if (role === "teacher") {
        query = query.eq("owner_id", userId);
    }

    const { data, error } = await query
        .select("id, title, description, level, status, audience, thumb:media_file!course_thumb_id_fkey(url)")
        .maybeSingle();

    if (error || !data) return null;
    return mapCourse(data as CourseRow);
}

export async function deleteCourse(courseId: string): Promise<boolean> {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    if (!userId) throw new Error("Usuário não autenticado.");
    await ensureCourseOwnerOrAdmin(supabase, courseId, userId, role);

    // All dependent tables (modules, lessons, enrollments, certificates,
    // submissions, comments, class_groups) are now ON DELETE CASCADE,
    // so deleting the course row cleans up everything automatically.
    let query = supabase.from("course").delete().eq("id", courseId);
    if (role === "teacher") {
        query = query.eq("owner_id", userId);
    }
    const { error } = await query;
    return !error;
}

export async function addModule(courseId: string, title: string) {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    await ensureCourseOwnerOrAdmin(supabase, courseId, userId, role);

    // Calcula próximo order: pega o maior existente e soma 1
    const { data: existing } = await supabase
        .from("course_module")
        .select("order")
        .eq("course_id", courseId)
        .order("order", { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextOrder = (existing?.order ?? 0) + 1;

    const { data, error } = await supabase
        .from("course_module")
        .insert({ course_id: courseId, title, order: nextOrder })
        .select("id, title, order")
        .maybeSingle();
    if (error || !data) return null;
    return mapModule({ ...data, lessons: [] });
}

export async function removeModule(moduleId: string): Promise<boolean> {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    const courseId = await getCourseIdByModuleId(supabase, moduleId);
    if (courseId) {
        await ensureCourseOwnerOrAdmin(supabase, courseId, userId, role);
    }
    await supabase.from("lesson").delete().eq("module_id", moduleId);
    const { error } = await supabase.from("course_module").delete().eq("id", moduleId);
    return !error;
}

export async function addLesson(courseId: string, moduleId: string, payload: { title: string; description?: string; durationMinutes?: number; contentUrl?: string; contentType?: string; order?: number; isPublic?: boolean; }) {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    await ensureCourseOwnerOrAdmin(supabase, courseId, userId, role);

    // Calcula próximo order: pega o maior existente no módulo e soma 1
    const { data: existing } = await supabase
        .from("lesson")
        .select("order")
        .eq("module_id", moduleId)
        .order("order", { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextOrder = payload.order ?? ((existing?.order ?? 0) + 1);

    const { data, error } = await supabase
        .from("lesson")
        .insert({
            course_id: courseId,
            module_id: moduleId,
            title: payload.title,
            description: payload.description ?? null,
            duration_minutes: payload.durationMinutes ?? null,
            content_url: payload.contentUrl ?? null,
            content_type: payload.contentType ?? null,
            order: nextOrder,
            is_public: payload.isPublic ?? false,
        })
        .select("id, title, description, duration_minutes, content_url, content_type, order, is_public")
        .maybeSingle();
    if (error || !data) return null;
    return mapLesson(data as LessonRow);
}

export async function removeLesson(lessonId: string): Promise<boolean> {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    const courseId = await getCourseIdByLessonId(supabase, lessonId);
    if (courseId) {
        await ensureCourseOwnerOrAdmin(supabase, courseId, userId, role);
    }
    await supabase.from("lesson_progress").delete().eq("lesson_id", lessonId);
    const { error } = await supabase.from("lesson").delete().eq("id", lessonId);
    return !error;
}

export async function updateLesson(lessonId: string, payload: { title?: string; description?: string | null; durationMinutes?: number | null; }) {
    const supabase = createBrowserSupabase();
    const { userId, role } = await getCurrentUserAndRole(supabase);
    const courseId = await getCourseIdByLessonId(supabase, lessonId);
    if (courseId) {
        await ensureCourseOwnerOrAdmin(supabase, courseId, userId, role);
    }
    const { data, error } = await supabase
        .from("lesson")
        .update({
            ...(payload.title !== undefined && { title: payload.title }),
            ...(payload.description !== undefined && { description: payload.description }),
            ...(payload.durationMinutes !== undefined && { duration_minutes: payload.durationMinutes }),
        })
        .eq("id", lessonId)
        .select("id, title, description, duration_minutes, content_url, content_type, order, is_public")
        .maybeSingle();
    if (error || !data) return null;
    return mapLesson(data as LessonRow);
}
