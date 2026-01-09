import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { type AssignmentSummary, type AssignmentRow } from "./types";

function mapAssignment(row: AssignmentRow): AssignmentSummary {
    return {
        id: row.id,
        lessonId: row.lesson_id,
        title: row.title,
        description: row.description ?? null,
        dueDate: row.due_date ?? null,
        maxScore: row.max_score ?? null,
        createdAt: row.created_at ?? null,
    };
}

// Lista atividades de uma lição específica
export async function listLessonAssignments(lessonId: string): Promise<AssignmentSummary[]> {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
        .from("assignment")
        .select("id, lesson_id, title, description, due_date, max_score, created_at")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data.map((row) => mapAssignment(row as AssignmentRow));
}

// Lista todas as atividades de um curso
export async function listCourseAssignments(courseId: string): Promise<AssignmentSummary[]> {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
        .from("assignment")
        .select(`
            id, 
            lesson_id, 
            title, 
            description, 
            due_date, 
            max_score, 
            created_at,
            lesson!inner(course_id)
        `)
        .eq("lesson.course_id", courseId)
        .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data.map((row) => mapAssignment(row as unknown as AssignmentRow));
}

// Cria uma nova atividade
export async function createAssignment(params: {
    lessonId: string;
    title: string;
    description?: string;
    dueDate?: string;
    maxScore?: number;
}): Promise<AssignmentSummary | null> {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Usuário não autenticado.");

    const { data, error } = await supabase
        .from("assignment")
        .insert({
            lesson_id: params.lessonId,
            title: params.title,
            description: params.description || null,
            due_date: params.dueDate || null,
            max_score: params.maxScore || null,
            created_by: user.id,
        })
        .select("id, lesson_id, title, description, due_date, max_score, created_at")
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapAssignment(data as AssignmentRow);
}

// Atualiza uma atividade existente
export async function updateAssignment(
    assignmentId: string,
    params: {
        title?: string;
        description?: string | null;
        dueDate?: string | null;
        maxScore?: number | null;
    }
): Promise<AssignmentSummary | null> {
    const supabase = createBrowserSupabase();

    const updateData: Record<string, unknown> = {};
    if (params.title !== undefined) updateData.title = params.title;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.dueDate !== undefined) updateData.due_date = params.dueDate;
    if (params.maxScore !== undefined) updateData.max_score = params.maxScore;

    const { data, error } = await supabase
        .from("assignment")
        .update(updateData)
        .eq("id", assignmentId)
        .select("id, lesson_id, title, description, due_date, max_score, created_at")
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapAssignment(data as AssignmentRow);
}

// Remove uma atividade
export async function deleteAssignment(assignmentId: string): Promise<boolean> {
    const supabase = createBrowserSupabase();
    
    // Primeiro remove todas as submissões relacionadas
    await supabase.from("assignment_submission").delete().eq("assignment_id", assignmentId);
    
    // Depois remove a atividade
    const { error } = await supabase.from("assignment").delete().eq("id", assignmentId);
    return !error;
}

// Obtém uma atividade específica
export async function getAssignment(assignmentId: string): Promise<AssignmentSummary | null> {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
        .from("assignment")
        .select("id, lesson_id, title, description, due_date, max_score, created_at")
        .eq("id", assignmentId)
        .maybeSingle();

    if (error || !data) return null;
    return mapAssignment(data as AssignmentRow);
}
