// Compatibilidade: reexporta operações atualizadas alinhadas ao novo esquema do Supabase.
export {
  listCourses as getCursos,
  createCourse as insertCurso,
  updateCourse,
  deleteCourse,
  getCourseDetail as getCursoCompleto,
  addModule as insertModule,
  addLesson as insertLesson,
  removeModule as deleteModule,
  removeLesson as deleteLesson,
} from "@/lib/api/courses";

export {
  enrollInCourse as matricularAluno,
  verifyEnrollment as verificarMatriculaExistente,
  fetchLessonProgress as verificaProgresso,
  toggleLessonProgress as registraProgresso,
  getUserCourses as getUserCourse,
} from "@/lib/api/enrollments";

export { getCourseDetail as getCurso } from "@/lib/api/courses";

export type { CourseSummary as CourseProps, ModuleSummary as ModuleProps, LessonSummary as LessonProps } from "@/lib/api/types";
