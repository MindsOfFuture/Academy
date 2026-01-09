"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/navbar/navbar";
import { getCourseDetail } from "@/lib/api/courses";
import {
  enrollInCourse,
  verifyEnrollment,
  fetchLessonProgress,
  toggleLessonProgress,
} from "@/lib/api/enrollments";
import toast from "react-hot-toast";
import { CheckCircle } from "lucide-react";
import { type CourseDetail } from "@/lib/api/types";

function CoursePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("id");

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMatriculado, setIsMatriculado] = useState<boolean | null>(null);
  const [progresso, setProgresso] = useState<string[]>([]);

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

  async function handleMatricula() {
    if (!course?.id) return;
    try {
      await enrollInCourse(course.id);
      setIsMatriculado(true);
      toast.success("Matrícula realizada com sucesso!");
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
    } catch (error) {
      console.error("Erro ao atualizar progresso:", error);
      toast.error("Não foi possível atualizar o progresso.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showTextLogo={true} />
      <div className="max-w-6xl mx-auto py-8 px-4">
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
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-4">
                <Image
                  src={course.thumbUrl || "/logo_navbar.svg"}
                  alt={course.title}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded object-cover"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                  {course.description && (
                    <p className="text-gray-600 mt-1 whitespace-pre-wrap">{course.description}</p>
                  )}
                </div>
              </div>

              {course.modules.map((module, moduleIndex) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold">
                      Módulo {moduleIndex + 1}: {module.title}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {module.lessons.length} aulas
                    </span>
                  </div>

                  <div className="space-y-3">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = progresso.includes(lesson.id);
                      return (
                        <div
                          key={lesson.id}
                          className="flex items-start justify-between gap-4 bg-gray-50 rounded-lg p-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                Aula {lessonIndex + 1}: {lesson.title}
                              </span>
                              {isCompleted && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
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
                            className={`px-3 py-1 text-sm rounded ${isCompleted
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-purple-100 text-purple-700 border border-purple-200"
                              }`}
                          >
                            {isCompleted ? "Concluída" : "Marcar como concluída"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Matrícula</h2>
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
                        <div key={lesson.id} className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${isCompleted ? "bg-green-500" : "bg-gray-300"}`}
                          />
                          <span className="text-sm text-gray-700">
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
