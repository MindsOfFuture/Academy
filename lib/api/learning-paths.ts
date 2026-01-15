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

// Busca uma trilha por ID com detalhes completos
export async function getLearningPathDetail(pathId: string): Promise<LearningPathSummary | null> {
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
        .eq("id", pathId)
        .single();

    if (error || !data) return null;

    const lpRow = data as unknown as LearningPathRow;
    return {
        id: lpRow.id,
        title: lpRow.title,
        description: lpRow.description ?? null,
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
    coverMediaId?: string;
}): Promise<LearningPathSummary | null> {
    const supabase = await createServerSupabase();
    const slug = generateSlug(params.title);

    const { data, error } = await supabase
        .from("learning_path")
        .insert({
            title: params.title,
            slug,
            description: params.description ?? null,
            cover_media_id: params.coverMediaId ?? null,
        })
        .select("id, title, description")
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        title: data.title,
        description: data.description ?? null,
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
        coverMediaId?: string | null;
    }
): Promise<LearningPathSummary | null> {
    const supabase = await createServerSupabase();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (params.title !== undefined) {
        updateData.title = params.title;
        updateData.slug = generateSlug(params.title);
    }
    if (params.description !== undefined) updateData.description = params.description;
    if (params.coverMediaId !== undefined) updateData.cover_media_id = params.coverMediaId;

    const { error } = await supabase
        .from("learning_path")
        .update(updateData)
        .eq("id", pathId);

    if (error) return null;

    return getLearningPathDetail(pathId);
}

// Deleta uma trilha
export async function deleteLearningPath(pathId: string): Promise<boolean> {
    const supabase = await createServerSupabase();

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
    const supabase = await createServerSupabase();

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
    const supabase = await createServerSupabase();

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
    const supabase = await createServerSupabase();

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
