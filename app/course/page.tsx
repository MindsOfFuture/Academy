"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar/navbar";
import { getCourseDetail } from "@/lib/api/courses";
import {
  enrollInCourse,
  verifyEnrollment,
  fetchLessonProgress,
  toggleLessonProgress,
} from "@/lib/api/enrollments";
import { listCourseAssignments, getUserCourseSubmissions } from "@/lib/api/assignments";
import toast from "react-hot-toast";
import { CheckCircle, FileText, Clock, CheckCheck } from "lucide-react";
import { type CourseDetail, type AssignmentSummary, type SubmissionSummary } from "@/lib/api/types";

function CoursePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("id");

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMatriculado, setIsMatriculado] = useState<boolean | null>(null);
  const [progresso, setProgresso] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SubmissionSummary>>({});

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await getCourseDetail(courseId || "");
        if (data) setCourse(data);
      } catch (err) {
        console.error("Erro ao buscar curso:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    if (course?.id) {
      verifyEnrollment(course.id)
        .then((matricula) => setIsMatriculado(!!matricula))
        .catch((error) => {
          console.error("Erro ao verificar matrícula:", error);
          setIsMatriculado(false);
        });
    }
  }, [course]);

  useEffect(() => {
    if (course?.id) {
      fetchLessonProgress(course.id)
        .then((data) => setProgresso(Array.isArray(data) ? data : []))
        .catch((e) => {
          console.error("Erro ao buscar progresso:", e);
          setProgresso([]);
        });
    }
  }, [course]);

  // Buscar atividades do curso quando matriculado
  useEffect(() => {
    if (course?.id && isMatriculado) {
      listCourseAssignments(course.id)
        .then((data) => setAssignments(data))
        .catch((e) => {
          console.error("Erro ao buscar atividades:", e);
          setAssignments([]);
        });

      getUserCourseSubmissions(course.id)
        .then((data) => setSubmissions(data))
        .catch((e) => {
          console.error("Erro ao buscar submissões:", e);
          setSubmissions({});
        });
    }
  }, [course, isMatriculado]);

  // Helper para formatar data
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Sem prazo";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Helper para status da atividade
  const getAssignmentStatus = (assignment: AssignmentSummary) => {
    const sub = submissions[assignment.id];
    if (sub?.gradedAt) return { label: "Avaliado", color: "bg-green-100 text-green-700" };
    if (sub?.submittedAt) return { label: "Entregue", color: "bg-blue-100 text-blue-700" };
    if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
      return { label: "Atrasado", color: "bg-red-100 text-red-700" };
    }
    return { label: "Pendente", color: "bg-yellow-100 text-yellow-700" };
  };

  async function handleMatricula() {
    if (!course?.id) return;
    try {
      await enrollInCourse(course.id);
      setIsMatriculado(true);
      toast.success("Matrícula realizada com sucesso!");
      // Sinalizar atualização para outras páginas via localStorage
      localStorage.setItem("courses-updated", Date.now().toString());
      window.dispatchEvent(new CustomEvent("enrollment-changed"));
    } catch (error) {
      console.error("Erro ao matricular:", error);
      toast.error("Falha ao realizar matrícula.");
    }
  }

  async function handleConcluirAula(lessonId: string) {
    if (!course?.id) return;
    try {
      const isNowCompleted = await toggleLessonProgress(course.id, lessonId);
      if (isNowCompleted) {
        setProgresso((prev) => Array.from(new Set([...prev, lessonId])));
        toast.success("Aula marcada como concluída!");
      } else {
        setProgresso((prev) => prev.filter((id) => id !== lessonId));
        toast.success("Progresso desmarcado.");
      }
      // Sinalizar atualização para outras páginas via localStorage
      localStorage.setItem("courses-updated", Date.now().toString());
      window.dispatchEvent(new CustomEvent("lesson-progress-changed"));
    } catch (error) {
      console.error("Erro ao atualizar progresso:", error);
      toast.error("Não foi possível atualizar o progresso.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar showTextLogo={true} />
      <div className="max-w-6xl mx-auto py-8 px-4 overflow-hidden">
        <button
          onClick={() => router.back()}
          className="mb-4 text-purple-600 hover:text-purple-800 transition"
        >
          ← Voltar
        </button>

        {loading ? (
          <p className="text-center text-gray-600">Carregando curso...</p>
        ) : course ? (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="bg-white shadow rounded-lg p-6 space-y-4 overflow-hidden">
              <div className="flex items-start gap-4">
                <Image
                  src={course.thumbUrl || "/logo_navbar.svg"}
                  alt={course.title}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                  {course.description && (
                    <p className="text-gray-600 mt-1 whitespace-pre-wrap">{course.description}</p>
                  )}
                </div>
              </div>

              {course.modules.map((module, moduleIndex) => (
                <div key={module.id} className="border rounded-lg p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold">
                      Módulo {moduleIndex + 1}: {module.title}
                    </h2>
                    <span className="text-sm text-gray-500 flex-shrink-0">
                      {module.lessons.length} aulas
                    </span>
                  </div>

                  <div className="space-y-3">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = progresso.includes(lesson.id);
                      // Filtrar atividades desta lição
                      const lessonAssignments = assignments.filter(a => a.lessonId === lesson.id);

                      return (
                        <div key={lesson.id} className="space-y-2">
                          {/* Card da Aula */}
                          <div className="flex items-start justify-between gap-4 bg-gray-50 rounded-lg p-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900">
                                  Aula {lessonIndex + 1}: {lesson.title}
                                </span>
                                {isCompleted && (
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                )}
                              </div>
                              {lesson.description && (
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {lesson.description}
                                </p>
                              )}
                              {lesson.durationMinutes && (
                                <p className="text-sm text-gray-500">
                                  Duração: {lesson.durationMinutes} min
                                </p>
                              )}
                              {lesson.contentUrl && (
                                <a
                                  href={lesson.contentUrl.startsWith('http') ? lesson.contentUrl : `https://${lesson.contentUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-purple-600 hover:text-purple-800"
                                >
                                  Assistir aula
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => handleConcluirAula(lesson.id)}
                              className={`px-3 py-1 text-sm rounded flex-shrink-0 ${isCompleted
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-purple-100 text-purple-700 border border-purple-200"
                                }`}
                            >
                              {isCompleted ? "Concluída" : "Marcar como concluída"}
                            </button>
                          </div>

                          {/* Atividades da Lição */}
                          {isMatriculado && lessonAssignments.length > 0 && (
                            <div className="ml-4 space-y-2">
                              {lessonAssignments.map((assignment) => {
                                const status = getAssignmentStatus(assignment);
                                const sub = submissions[assignment.id];
                                return (
                                  <Link
                                    key={assignment.id}
                                    href={`/protected/activitie?id=${assignment.id}`}
                                    className="flex items-center justify-between gap-3 bg-purple-50 rounded-lg p-3 hover:bg-purple-100 transition-colors border border-purple-100"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium text-gray-900 text-sm truncate">
                                            {assignment.title}
                                          </span>
                                          <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${status.color}`}>
                                            {status.label}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            {formatDate(assignment.dueDate)}
                                          </span>
                                          {assignment.maxScore && (
                                            <span className="flex-shrink-0">{assignment.maxScore} pts</span>
                                          )}
                                          {sub?.score !== null && sub?.score !== undefined && (
                                            <span className="text-green-600 font-medium flex-shrink-0">
                                              Nota: {sub.score}/{assignment.maxScore || 10}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {sub?.submittedAt && (
                                        <CheckCheck className="w-4 h-4 text-green-500" />
                                      )}
                                      <span className="text-purple-600 text-xs font-medium">
                                        {sub?.submittedAt ? "Ver" : "Responder"} →
                                      </span>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white shadow rounded-lg p-6 space-y-4 overflow-hidden min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-gray-900 truncate">Matrícula</h2>
                <span className={`px-3 py-1 rounded-full text-sm ${isMatriculado
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
                  }`}>
                  {isMatriculado ? "Matriculado" : "Não matriculado"}
                </span>
              </div>

              <p className="text-sm text-gray-600">
                {isMatriculado
                  ? "Você está matriculado neste curso."
                  : "Matricule-se para acompanhar seu progresso e ter acesso completo."}
              </p>

              <button
                onClick={handleMatricula}
                disabled={isMatriculado === null || isMatriculado}
                className={`w-full py-2 rounded-lg font-semibold transition ${isMatriculado
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
              >
                {isMatriculado ? "Já matriculado" : "Matricular-se"}
              </button>

              {isMatriculado && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">Progresso</h3>
                  <div className="space-y-2">
                    {course.modules.flatMap((module) => module.lessons).map((lesson, index) => {
                      const isCompleted = progresso.includes(lesson.id);
                      return (
                        <div key={lesson.id} className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${isCompleted ? "bg-green-500" : "bg-gray-300"}`}
                          />
                          <span className="text-sm text-gray-700 truncate">
                            Aula {index + 1}: {lesson.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600">Curso não encontrado.</p>
        )}
      </div>
    </div>
  );
}

export default function CoursePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando curso...</div>}>
      <CoursePageContent />
    </Suspense>
  );
}
