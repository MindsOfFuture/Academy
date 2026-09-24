export type RoleName = "admin" | "teacher" | "student" | "unknown";
export type TeacherVerificationStatus = "pending" | "approved" | "rejected" | null;

// Tipos para dados brutos do Supabase (DB rows)
// Nota: Supabase retorna joins como arrays, então thumb pode vir como array ou objeto
export type CourseAudience = 'student' | 'teacher';

// Join de media_file: Supabase devolve objeto ou array conforme a relação
export type MediaRef = { url?: string | null } | { url?: string | null }[] | null | undefined;

export interface CourseRow {
    id: string;
    title: string;
    description?: string | null;
    level?: string | null;
    status?: string | null;
    owner_id?: string | null;
    audience?: CourseAudience | null;
    thumb?: MediaRef;
    modules?: ModuleRow[];
    enrollments?: { count: number }[];
}

// Helper para extrair URL de mídia (Supabase retorna joins como objeto ou array)
export function getMediaUrl(ref: MediaRef): string | null {
    if (!ref) return null;
    if (Array.isArray(ref)) return ref[0]?.url ?? null;
    return ref.url ?? null;
}

export interface LessonRow {
    id: string;
    title: string;
    description?: string | null;
    duration_minutes?: number | null;
    content_url?: string | null;
    content_type?: string | null;
    order?: number | null;
    is_public?: boolean | null;
    course_id?: string;
}

export interface ModuleRow {
    id: string;
    title: string;
    order?: number | null;
    lessons?: LessonRow[];
}

export interface EnrollmentUserInfo {
    id?: string;
    full_name?: string;
    email?: string;
}

export interface EnrollmentRow {
    id: string;
    status?: string | null;
    course?: CourseRow | null;
    user?: EnrollmentUserInfo | EnrollmentUserInfo[] | null;
}

export interface LessonProgressRow {
    enrollment_id: string;
    lesson_id: string;
    is_completed?: boolean | null;
}

export interface ArticleRow {
    id: string;
    title: string;
    slug?: string | null;
    excerpt?: string | null;
    content?: string | null;
    published_at?: string | null;
    author_id?: string | null;
    cover?: MediaRef;
}

export interface LearningPathRow {
    id: string;
    title: string;
    description?: string | null;
    audience?: CourseAudience | null;
    owner_id?: string | null;
    cover?: MediaRef;
    courses?: Array<{ order?: number; course?: CourseRow }>;
}

// Tipos de resumo (transformados)
export interface CourseSummary {
    id: string;
    title: string;
    description: string | null;
    level?: string | null;
    status?: string | null;
    audience?: CourseAudience | null;
    thumbUrl?: string | null;
    enrollmentCount?: number;
}

export interface LessonSummary {
    id: string;
    title: string;
    description?: string | null;
    durationMinutes?: number | null;
    contentUrl?: string | null;
    contentType?: string | null;
    order?: number | null;
    isPublic?: boolean | null;
}

export interface ModuleSummary {
    id: string;
    title: string;
    order?: number | null;
    lessons: LessonSummary[];
}

export interface CourseDetail extends CourseSummary {
    modules: ModuleSummary[];
}

export interface UserProfileSummary {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    phone?: string | null;
    address?: string | null;
    specialties?: string[] | null;
    certifications?: string[] | null;
    verificationStatus?: TeacherVerificationStatus;
    verificationReason?: string | null;
    verificationDocumentUrl?: string | null;
    isActive?: boolean | null;
    role: RoleName;
    // Teacher-specific fields from teacher_details table
    schools?: string[] | null;
    educationLevel?: string | null;
    degree?: string | null;
}

export interface EnrollmentSummary {
    enrollmentId: string;
    status: string | null;
    course: CourseSummary;
    progressPercent: number;
    completedLessons: number;
    totalLessons: number;
}

export interface ArticleSummary {
    id: string;
    title: string;
    slug?: string | null;
    excerpt?: string | null;
    content?: string | null;
    coverUrl?: string | null;
    authorId?: string | null;
    publishedAt?: string | null;
}

export interface LearningPathSummary {
    id: string;
    title: string;
    description: string | null;
    audience?: CourseAudience | null;
    coverUrl?: string | null;
    courses: CourseSummary[];
}

// Tipos para Atividades (Assignments)
export interface AssignmentRow {
    id: string;
    lesson_id: string;
    title: string;
    description?: string | null;
    due_date?: string | null;
    max_score?: number | null;
    created_by?: string | null;
    created_at?: string | null;
}

export interface AssignmentSummary {
    id: string;
    lessonId: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    maxScore: number | null;
    createdAt: string | null;
}

// Tipos para Submissões de Atividades
export interface SubmissionSummary {
    id: string;
    assignmentId: string;
    enrollmentId: string | null;
    userId: string | null;
    submittedAt: string | null;
    answerUrl: string | null;
    contentUrl: string | null;
    comments: string | null;
    score: number | null;
    feedback: string | null;
    gradedAt: string | null;
}

// Tipos para Chat de Atividade (mensagens 1-a-1 aluno ↔ professor/admin)
export interface ActivityChatMessageRow {
    id: string;
    assignment_id: string;
    student_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender?: {
        full_name?: string | null;
        avatar_url?: string | null;
    } | {
        full_name?: string | null;
        avatar_url?: string | null;
    }[];
}

export interface ActivityChatMessage {
    id: string;
    assignmentId: string;
    studentId: string;
    senderId: string;
    content: string;
    createdAt: string;
    senderName: string;
    senderAvatar: string | null;
}

export interface ChatUser {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    role: RoleName;
}

// Submissão com dados do aluno (para professores)
export interface SubmissionWithStudent extends SubmissionSummary {
    studentName: string;
    studentEmail: string | null;
}

// Submissão pendente de correção (para lista geral do professor)
export interface PendingSubmission extends SubmissionWithStudent {
    assignmentTitle: string;
    assignmentMaxScore: number | null;
    courseName: string;
    courseId: string;
    lessonTitle: string;
}

// Mapeadores compartilhados (DB row -> view model)
export function mapCourse(row: CourseRow): CourseSummary {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        level: row.level ?? null,
        status: row.status ?? null,
        audience: row.audience ?? null,
        thumbUrl: getMediaUrl(row.thumb),
    };
}

export function mapLesson(row: LessonRow): LessonSummary {
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

export function mapModule(row: ModuleRow): ModuleSummary {
    return {
        id: row.id,
        title: row.title,
        order: row.order ?? null,
        lessons: (row.lessons || []).map(mapLesson),
    };
}

export type ContentHistoryTable = "course" | "course_module" | "lesson";
export type ContentHistoryAction = "insert" | "update" | "delete";
export type ContentHistoryData = Record<string, unknown>;

export interface ContentHistoryRow {
    id: number;
    tabela: ContentHistoryTable;
    registro_id: string;
    curso_id: string | null;
    acao: ContentHistoryAction;
    autor: string | null;
    ocorrido_em: string;
    antes: ContentHistoryData | null;
    depois: ContentHistoryData | null;
    campos_alterados: string[] | null;
}

export interface ContentHistoryEntry {
    id: number;
    table: ContentHistoryTable;
    recordId: string;
    courseId: string | null;
    action: ContentHistoryAction;
    authorId: string | null;
    authorName: string;
    occurredAt: string;
    before: ContentHistoryData | null;
    after: ContentHistoryData | null;
    changedFields: string[];
}
