export type RoleName = "admin" | "teacher" | "student" | "unknown";

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
