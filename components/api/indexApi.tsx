// Compatibilidade: reexporta funções alinhadas ao novo esquema do Supabase.
export { getHero, getAboutUs, getFooter } from "@/lib/api/content";
export { listCourses as getNossosCursos, getCourseDetail as getCurso } from "@/lib/api/courses";
export { getArticles } from "@/lib/api/articles";
export { getUserCourses as getUserCourse, fetchLessonProgress as getProgressCount } from "@/lib/api/enrollments";
export { updateUserProfileClient } from "@/lib/api/profiles";
export { getLearningPaths as getTrilhas } from "@/lib/api/learning-paths";

export type { CourseSummary as CourseProps, ArticleSummary as ArticleProps, LearningPathSummary as TrilhaProps } from "@/lib/api/types";