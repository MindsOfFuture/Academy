import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { type AssignmentSummary, type AssignmentRow, type SubmissionSummary } from "./types";

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

// Busca a submissão do aluno para uma atividade
export async function getUserSubmission(assignmentId: string): Promise<SubmissionSummary | null> {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return null;

    const { data, error } = await supabase
        .from("assignment_submission")
        .select("*")
        .eq("assignment_id", assignmentId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error || !data) return null;

    return {
        id: data.id,
        assignmentId: data.assignment_id,
        enrollmentId: data.enrollment_id ?? null,
        userId: data.user_id ?? null,
        submittedAt: data.submitted_at ?? null,
        answerUrl: data.answer_url ?? null,
        contentUrl: data.content_url ?? null,
        comments: data.comments ?? null,
        score: data.score ?? null,
        feedback: data.feedback ?? null,
        gradedAt: data.graded_at ?? null,
    };
}

// Busca todas as submissões do usuário para um curso
export async function getUserCourseSubmissions(courseId: string): Promise<Record<string, SubmissionSummary>> {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return {};

    const { data: assignments } = await supabase
        .from("assignment")
        .select(`id, lesson!inner(course_id)`)
        .eq("lesson.course_id", courseId);

    if (!assignments || assignments.length === 0) return {};

    const assignmentIds = assignments.map(a => a.id);

    const { data: submissions, error } = await supabase
        .from("assignment_submission")
        .select("*")
        .in("assignment_id", assignmentIds)
        .eq("user_id", user.id);

    if (error || !submissions) return {};

    const result: Record<string, SubmissionSummary> = {};
    for (const sub of submissions) {
        result[sub.assignment_id] = {
            id: sub.id,
            assignmentId: sub.assignment_id,
            enrollmentId: sub.enrollment_id ?? null,
            userId: sub.user_id ?? null,
            submittedAt: sub.submitted_at ?? null,
            answerUrl: sub.answer_url ?? null,
            contentUrl: sub.content_url ?? null,
            comments: sub.comments ?? null,
            score: sub.score ?? null,
            feedback: sub.feedback ?? null,
            gradedAt: sub.graded_at ?? null,
        };
    }
    return result;
}

// Submete uma atividade (criar nova submissão)
export async function submitAssignment(params: {
    assignmentId: string;
    contentUrl?: string;
    answerUrl?: string;
    comments?: string;
}): Promise<SubmissionSummary | null> {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Usuário não autenticado.");

    const { data: assignmentData } = await supabase
        .from("assignment")
        .select("lesson!inner(course_id)")
        .eq("id", params.assignmentId)
        .single();

    let enrollmentId: string | null = null;
    if (assignmentData?.lesson) {
        const lesson = Array.isArray(assignmentData.lesson) 
            ? assignmentData.lesson[0] 
            : assignmentData.lesson;
        const courseId = (lesson as { course_id: string }).course_id;
        const { data: enrollment } = await supabase
            .from("enrollment")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .maybeSingle();
        enrollmentId = enrollment?.id ?? null;
    }

    const { data, error } = await supabase
        .from("assignment_submission")
        .insert({
            assignment_id: params.assignmentId,
            user_id: user.id,
            enrollment_id: enrollmentId,
            content_url: params.contentUrl || null,
            answer_url: params.answerUrl || null,
            comments: params.comments || null,
            submitted_at: new Date().toISOString(),
        })
        .select("*")
        .single();

    if (error) throw error;
    if (!data) return null;

    return {
        id: data.id,
        assignmentId: data.assignment_id,
        enrollmentId: data.enrollment_id ?? null,
        userId: data.user_id ?? null,
        submittedAt: data.submitted_at ?? null,
        answerUrl: data.answer_url ?? null,
        contentUrl: data.content_url ?? null,
        comments: data.comments ?? null,
        score: data.score ?? null,
        feedback: data.feedback ?? null,
        gradedAt: data.graded_at ?? null,
    };
}

// Atualiza uma submissão existente
export async function updateSubmission(
    submissionId: string,
    params: {
        contentUrl?: string;
        answerUrl?: string;
        comments?: string;
    }
): Promise<SubmissionSummary | null> {
    const supabase = createBrowserSupabase();

    const { data, error } = await supabase
        .from("assignment_submission")
        .update({
            content_url: params.contentUrl,
            answer_url: params.answerUrl,
            comments: params.comments,
            submitted_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select("*")
        .single();

    if (error) throw error;
    if (!data) return null;

    return {
        id: data.id,
        assignmentId: data.assignment_id,
        enrollmentId: data.enrollment_id ?? null,
        userId: data.user_id ?? null,
        submittedAt: data.submitted_at ?? null,
        answerUrl: data.answer_url ?? null,
        contentUrl: data.content_url ?? null,
        comments: data.comments ?? null,
        score: data.score ?? null,
        feedback: data.feedback ?? null,
        gradedAt: data.graded_at ?? null,
    };
}

// Remove uma submissão
export async function deleteSubmission(submissionId: string): Promise<boolean> {
    const supabase = createBrowserSupabase();
    const { error } = await supabase
        .from("assignment_submission")
        .delete()
        .eq("id", submissionId);
    return !error;
}
