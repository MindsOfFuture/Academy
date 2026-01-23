import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { type CourseSummary, type CourseDetail, type LessonSummary, type ModuleSummary, type CourseRow, type LessonRow, type ModuleRow, getThumbUrl } from "./types";

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

type SupabaseClient = ReturnType<typeof createBrowserSupabase>;

async function withSupabase<T>(handler: (supabase: SupabaseClient) => Promise<T>): Promise<T> {
    const supabase = createBrowserSupabase();
    return handler(supabase);
}

export async function listCourses(): Promise<CourseSummary[]> {
    return withSupabase(async (supabase) => {
        const { data, error } = await supabase
            .from("course")
            .select("id, title, description, level, status, audience, thumb:media_file!course_thumb_id_fkey(url)")
            .order("created_at", { ascending: false });

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

export async function createCourse(payload: { title: string; description: string; imageUrl?: string; level?: string; status?: string; }) {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Usuário não autenticado.");

    const thumbId = await ensureThumbId(payload.imageUrl, supabase, user.id);

    const { data, error } = await supabase
        .from("course")
        .insert({
            title: payload.title,
            description: payload.description,
            level: payload.level ?? "básico",
            status: payload.status ?? "draft",
            owner_id: user.id,
            thumb_id: thumbId,
        })
        .select(
            "id, title, description, level, status, thumb:media_file!course_thumb_id_fkey(url)"
        )
        .maybeSingle();

    if (error || !data) return null;
    return mapCourse(data as CourseRow);
}

export async function updateCourse(courseId: string, payload: { title?: string; description?: string; imageUrl?: string; level?: string; status?: string; }) {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Usuário não autenticado.");

    const thumbId = await ensureThumbId(payload.imageUrl, supabase, user.id);

    const { data, error } = await supabase
        .from("course")
        .update({
            ...(payload.title ? { title: payload.title } : {}),
            ...(payload.description ? { description: payload.description } : {}),
            ...(payload.level ? { level: payload.level } : {}),
            ...(payload.status ? { status: payload.status } : {}),
            ...(thumbId ? { thumb_id: thumbId } : {}),
            updated_at: new Date().toISOString(),
        })
        .eq("id", courseId)
        .select(
            "id, title, description, level, status, thumb:media_file!course_thumb_id_fkey(url)"
        )
        .maybeSingle();

    if (error || !data) return null;
    return mapCourse(data as CourseRow);
}

export async function deleteCourse(courseId: string): Promise<boolean> {
    const supabase = createBrowserSupabase();

    const { data: modules } = await supabase
        .from("course_module")
        .select("id")
        .eq("course_id", courseId);

    const moduleIds = (modules || []).map((m: { id: string }) => m.id);
    if (moduleIds.length) {
        await supabase.from("lesson").delete().in("module_id", moduleIds);
    }

    await supabase.from("course_module").delete().eq("course_id", courseId);
    await supabase.from("enrollment").delete().eq("course_id", courseId);
    const { error } = await supabase.from("course").delete().eq("id", courseId);
    return !error;
}

export async function addModule(courseId: string, title: string) {
    const supabase = createBrowserSupabase();

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
    await supabase.from("lesson").delete().eq("module_id", moduleId);
    const { error } = await supabase.from("course_module").delete().eq("id", moduleId);
    return !error;
}

export async function addLesson(courseId: string, moduleId: string, payload: { title: string; description?: string; durationMinutes?: number; contentUrl?: string; contentType?: string; order?: number; isPublic?: boolean; }) {
    const supabase = createBrowserSupabase();

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
    await supabase.from("lesson_progress").delete().eq("lesson_id", lessonId);
    const { error } = await supabase.from("lesson").delete().eq("id", lessonId);
    return !error;
}

export async function updateLesson(lessonId: string, payload: { title?: string; description?: string | null; durationMinutes?: number | null; }) {
    const supabase = createBrowserSupabase();
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
