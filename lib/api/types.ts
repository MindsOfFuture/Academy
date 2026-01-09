export type RoleName = "admin" | "teacher" | "student" | "unknown";

// Tipos para dados brutos do Supabase (DB rows)
// Nota: Supabase retorna joins como arrays, então thumb pode vir como array ou objeto
export interface CourseRow {
    id: string;
    title: string;
    description?: string | null;
    level?: string | null;
    status?: string | null;
    thumb?: { url?: string | null } | { url?: string | null }[] | null;
    modules?: ModuleRow[];
}

// Helper para extrair URL de thumb (pode ser array ou objeto)
export function getThumbUrl(thumb: CourseRow['thumb']): string | null {
    if (!thumb) return null;
    if (Array.isArray(thumb)) return thumb[0]?.url ?? null;
    return thumb.url ?? null;
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
    cover?: { url?: string | null } | { url?: string | null }[] | null;
}

export interface LearningPathRow {
    id: string;
    title: string;
    description?: string | null;
    cover?: { url?: string | null } | { url?: string | null }[] | null;
    courses?: Array<{ order?: number; course?: CourseRow }>;
}

// Helper para extrair URL de cover (pode ser array ou objeto)
export function getCoverUrl(cover: ArticleRow['cover'] | LearningPathRow['cover']): string | null {
    if (!cover) return null;
    if (Array.isArray(cover)) return cover[0]?.url ?? null;
    return cover.url ?? null;
}

export interface UserProfileRow {
    id: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    is_active?: boolean | null;
}

export interface SystemConfigRow {
    key: string;
    value: string;
}

// Tipos de resumo (transformados)
export interface CourseSummary {
    id: string;
    title: string;
    description: string | null;
    level?: string | null;
    status?: string | null;
    thumbUrl?: string | null;
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
    isActive?: boolean | null;
    role: RoleName;
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
    coverUrl?: string | null;
    courses: CourseSummary[];
}
