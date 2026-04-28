import "server-only";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { fetchRoleForUser } from "@/lib/api/profiles-server";
import { type LearningPathSummary, type CourseSummary, type CourseRow, type LearningPathRow, type RoleName, getThumbUrl, getCoverUrl } from "./types";

interface LearningPathCourseJoin {
    order?: number | null;
    course?: CourseRow;
}

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabase>>;

async function getCurrentUserAndRole(requireUser: boolean): Promise<{ supabase: ServerSupabase; userId: string | null; role: RoleName; }> {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;
    if (!userId) {
        if (requireUser) {
            throw new Error("Usuário não autenticado.");
        }
        return { supabase, userId: null, role: "unknown" };
    }

    const role = await fetchRoleForUser(userId, supabase);
    if (requireUser && role !== "admin" && role !== "teacher") {
        throw new Error("Acesso negado.");
    }

    return { supabase, userId, role };
}

async function ensureLearningPathOwnership(
    supabase: ServerSupabase,
    pathId: string,
    userId: string | null,
    role: RoleName,
): Promise<void> {
    if (role !== "teacher") return;
    if (!userId) throw new Error("Usuário não autenticado.");

    const { data, error } = await supabase
        .from("learning_path")
        .select("owner_id")
        .eq("id", pathId)
        .maybeSingle();

    if (error || !data || data.owner_id !== userId) {
        throw new Error("Acesso negado.");
    }
}

async function ensureCourseOwnership(
    supabase: ServerSupabase,
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

// Gera slug a partir do título
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        + "-" + Date.now();
}

export async function getLearningPaths(options?: { scope?: "public" | "manage" }): Promise<LearningPathSummary[]> {
        const isManageScope = options?.scope === "manage";
        const { supabase, userId, role } = await getCurrentUserAndRole(isManageScope);

        if (isManageScope && !userId) return [];

        let query = supabase
        .from("learning_path")
        .select(`
      id,
      title,
      description,
            owner_id,
      audience,
      cover:media_file!learning_path_cover_media_id_fkey(url),
      courses:learning_path_course(order, course:course_id (id, title, description, level, status, thumb:media_file!course_thumb_id_fkey(url)))
    `)
                .order("created_at", { ascending: false });

        if (isManageScope && role === "teacher" && userId) {
                query = query.eq("owner_id", userId);
        }

        const { data, error } = await query;

    if (error || !data) return [];

    return data.map((row) => {
        const lpRow = row as unknown as LearningPathRow;
        return {
            id: lpRow.id,
            title: lpRow.title,
            description: lpRow.description ?? null,
            audience: (lpRow.audience as "student" | "teacher") ?? "student",
            coverUrl: getCoverUrl(lpRow.cover),
            courses: ((lpRow.courses || []) as LearningPathCourseJoin[])
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((item) => mapCourse((item.course || {}) as CourseRow)),
        };
    });
}

// Busca uma trilha por ID com detalhes completos
export async function getLearningPathDetail(pathId: string, options?: { scope?: "public" | "manage" }): Promise<LearningPathSummary | null> {
    const isManageScope = options?.scope === "manage";
    const { supabase, userId, role } = await getCurrentUserAndRole(isManageScope);

    if (isManageScope && !userId) return null;

    let query = supabase
        .from("learning_path")
        .select(`
            id,
            title,
            description,
            owner_id,
            audience,
            cover:media_file!learning_path_cover_media_id_fkey(url),
            courses:learning_path_course(order, course:course_id (id, title, description, level, status, thumb:media_file!course_thumb_id_fkey(url)))
        `)
        .eq("id", pathId);

    if (isManageScope && role === "teacher" && userId) {
        query = query.eq("owner_id", userId);
    }

    const { data, error } = await query.single();

    if (error || !data) return null;

    const lpRow = data as unknown as LearningPathRow;
    return {
        id: lpRow.id,
        title: lpRow.title,
        description: lpRow.description ?? null,
        audience: (lpRow.audience as "student" | "teacher") ?? "student",
        coverUrl: getCoverUrl(lpRow.cover),
        courses: ((lpRow.courses || []) as LearningPathCourseJoin[])
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((item) => mapCourse((item.course || {}) as CourseRow)),
    };
}

// Cria uma nova trilha
export async function createLearningPath(params: {
    title: string;
    description?: string;
    audience?: string;
    coverMediaId?: string;
    ownerId?: string | null;
}): Promise<LearningPathSummary | null> {
    const supabase = await createServerSupabase();
    const slug = generateSlug(params.title);

    const { data, error } = await supabase
        .from("learning_path")
        .insert({
            title: params.title,
            slug,
            description: params.description ?? null,
            audience: params.audience ?? "student",
            cover_media_id: params.coverMediaId ?? null,
            owner_id: params.ownerId ?? null,
        })
        .select("id, title, description, audience")
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        title: data.title,
        description: data.description ?? null,
        audience: (data.audience as "student" | "teacher") ?? "student",
        coverUrl: null,
        courses: [],
    };
}

// Atualiza uma trilha existente
export async function updateLearningPath(
    pathId: string,
    params: {
        title?: string;
        description?: string | null;
        audience?: string | null;
        coverMediaId?: string | null;
    }
): Promise<LearningPathSummary | null> {
    const { supabase, userId, role } = await getCurrentUserAndRole(true);
    await ensureLearningPathOwnership(supabase, pathId, userId, role);

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (params.title !== undefined) {
        updateData.title = params.title;
        updateData.slug = generateSlug(params.title);
    }
    if (params.description !== undefined) updateData.description = params.description;
    if (params.audience !== undefined) updateData.audience = params.audience;
    if (params.coverMediaId !== undefined) updateData.cover_media_id = params.coverMediaId;

    const { error } = await supabase
        .from("learning_path")
        .update(updateData)
        .eq("id", pathId);

    if (error) return null;

    return getLearningPathDetail(pathId, { scope: "manage" });
}

// Deleta uma trilha
export async function deleteLearningPath(pathId: string): Promise<boolean> {
    const { supabase, userId, role } = await getCurrentUserAndRole(true);
    await ensureLearningPathOwnership(supabase, pathId, userId, role);

    // Primeiro remove as associações de cursos
    await supabase
        .from("learning_path_course")
        .delete()
        .eq("learning_path_id", pathId);

    // Depois remove a trilha
    const { error } = await supabase
        .from("learning_path")
        .delete()
        .eq("id", pathId);

    return !error;
}

// Adiciona um curso a uma trilha
export async function addCourseToPath(
    pathId: string,
    courseId: string,
    order?: number
): Promise<boolean> {
    const { supabase, userId, role } = await getCurrentUserAndRole(true);
    await ensureLearningPathOwnership(supabase, pathId, userId, role);
    await ensureCourseOwnership(supabase, courseId, userId, role);

    // Se não passou order, pega o próximo disponível
    let nextOrder = order ?? 1;
    if (order === undefined) {
        const { data: existing } = await supabase
            .from("learning_path_course")
            .select("order")
            .eq("learning_path_id", pathId)
            .order("order", { ascending: false })
            .limit(1);

        if (existing && existing.length > 0) {
            nextOrder = (existing[0].order ?? 0) + 1;
        }
    }

    const { error } = await supabase
        .from("learning_path_course")
        .insert({
            learning_path_id: pathId,
            course_id: courseId,
            order: nextOrder,
        });

    return !error;
}

// Remove um curso de uma trilha
export async function removeCourseFromPath(
    pathId: string,
    courseId: string
): Promise<boolean> {
    const { supabase, userId, role } = await getCurrentUserAndRole(true);
    await ensureLearningPathOwnership(supabase, pathId, userId, role);
    await ensureCourseOwnership(supabase, courseId, userId, role);

    const { error } = await supabase
        .from("learning_path_course")
        .delete()
        .eq("learning_path_id", pathId)
        .eq("course_id", courseId);

    return !error;
}

// Reordena cursos de uma trilha
export async function reorderCoursesInPath(
    pathId: string,
    courseOrders: { courseId: string; order: number }[]
): Promise<boolean> {
    const { supabase, userId, role } = await getCurrentUserAndRole(true);
    await ensureLearningPathOwnership(supabase, pathId, userId, role);

    if (role === "teacher" && userId) {
        const courseIds = courseOrders.map((item) => item.courseId);
        if (courseIds.length > 0) {
            const { data } = await supabase
                .from("course")
                .select("id, owner_id")
                .in("id", courseIds);
            const allOwned = (data || []).every((row) => row.owner_id === userId);
            if (!allOwned) {
                throw new Error("Acesso negado.");
            }
        }
    }

    // Atualiza cada curso individualmente
    for (const { courseId, order } of courseOrders) {
        const { error } = await supabase
            .from("learning_path_course")
            .update({ order })
            .eq("learning_path_id", pathId)
            .eq("course_id", courseId);

        if (error) return false;
    }

    return true;
}
