"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar/navbar";
import { getCurso } from "@/components/api/indexApi";
import {
  matricularAluno,
  verificaProgresso,
  verificarMatriculaExistente,
  registraProgresso, // 1. IMPORTADO AQUI
} from "@/components/api/courseApi";
import toast from "react-hot-toast";
import type { ProgressoProps } from "@/components/api/courseApi";
import { CheckCircle } from "lucide-react";

// Definição dos Types
type Lesson = {
  id: string;
  title: string;
  duration: string;
  link: string;
};

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

type Course = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  modules: Module[];
};

export default function CoursePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("id");

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMatriculado, setIsMatriculado] = useState<boolean | null>(null);
  const [progresso, setProgresso] = useState<ProgressoProps[]>([]);

  // 1. useEffect para buscar os dados do CURSO
  useEffect(() => {
    console.log("Course ID from URL:", courseId);

    const fetchCourse = async () => {
      try {
        const data = await getCurso(courseId);

        if (!data) {
          // router.push("/protected");
          return;
        }

        setCourse(data);
      } catch (err) {
        console.error("Erro ao buscar curso:", err);
        // router.push("/protected");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, router]);

  // 2. useEffect para VERIFICAR A MATRÍCULA
  useEffect(() => {
    if (course?.id) {
      const checkMatricula = async () => {
        try {
          const matricula = await verificarMatriculaExistente(course.id);
          setIsMatriculado(matricula != null);
        } catch (error) {
          console.error("Erro ao verificar matrícula:", error);
          setIsMatriculado(false);
        }
      };

      checkMatricula();
    }
  }, [course]);

  // 3. useEffect para buscar o PROGRESSO
  useEffect(() => {
    const fetchProgresso = async () => {
      if (course?.id) {
        try {
          const data = await verificaProgresso(course.id);
          setProgresso(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error("Erro ao buscar progresso:", e);
          setProgresso([]);
        }
      }
    };

    fetchProgresso();
  }, [course]);

  // Checa se a lição foi concluída
  const isLessonDone = (lessonId: string) => {
    return progresso.some(
      (p) => p.id_item_concluido === Number(lessonId) || String(p.id_item_concluido) === lessonId
    );
  };

  // Função para lidar com a matrícula
  const handleMatricula = async () => {
    if (!course?.id) return;

    try {
      await matricularAluno(course.id);
      setIsMatriculado(true);
      toast.success("Matrícula realizada com sucesso!");
    } catch (error) {
      console.error("Erro ao matricular:", error);
      toast.error("Erro ao realizar matrícula. Tente novamente.");
    }
  };

  // 2. FUNÇÃO DE PROGRESSO IMPLEMENTADA
  function handelProgresso(
    courseId: string,
    moduleId: number,
    itemId: number
  ) {
    if (!isLessonDone(String(itemId))) {
      const fakeProgresso = {
        id_item_concluido: itemId,
      } as ProgressoProps;

      setProgresso((prevProgresso) => [...prevProgresso, fakeProgresso]);
    }

    registraProgresso(courseId, moduleId, itemId)
      .then((data) => {
        if (data) {
        } else {
          toast.error("Erro ao salvar progresso.");
        }
      })
      .catch((err) => {
        console.error("Erro na API de progresso:", err);
        toast.error("Erro ao salvar progresso.");
      });
  }

  // --- Renderização ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando curso...</p>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showTextLogo={true} />
      <div className="flex justify-center p-6">
        <div className="w-full max-w-5xl">
          <h2 className="text-3xl font-bold mb-6">
            Explore o módulo de: {course.title}
          </h2>

          {/* Botão de Matrícula */}
          {isMatriculado === false && (
            <button
              onClick={handleMatricula}
              className="mb-4 text-blue-500 hover:underline"
            >
              Matricule-se!
            </button>
          )}

          {/* Lista de Módulos */}
          <div className="flex flex-col gap-8">
            {course.modules.map((module, idx) => (
              <div key={module.id ?? idx} className="flex items-start gap-4">
                {/* bolinha da trilha */}
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  {idx < course.modules.length - 1 && (
                    <div className="flex-1 w-[2px] bg-blue-300"></div>
                  )}
                </div>

                {/* conteúdo do módulo */}
                <div className="flex-1 bg-white rounded-xl shadow-md p-4">
                  <h3 className="text-xl font-semibold mb-3">{module.title}</h3>
                  <div className="flex flex-col gap-2">
                    {module.lessons.map((lesson) => (
                      <a
                        onClick={(e) => {
                          e.preventDefault();

                          handelProgresso(
                            course.id,
                            Number(module.id),
                            Number(lesson.id)
                          );

                          window.open(lesson.link, "_blank");
                        }}
                        href={lesson.link}
                        key={lesson.id}
                        target="_blank"
                        className="flex justify-between items-center border p-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-2">
                          {isLessonDone(lesson.id) ? (
                            <CheckCircle className="h-4 w-4 text-green-600" aria-label="Concluída" />
                          ) : null}
                          <span>{lesson.title}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {lesson.duration}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}