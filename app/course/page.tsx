"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar/navbar";
import { getCurso } from "@/components/api/indexApi";

type Lesson = {
  id: string;
  title: string;
  duration: number;
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

function CoursePageContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("id");

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Course ID from URL:", courseId);
    //devaneio do typescript
    const fetchCourse = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getCurso(courseId);
        console.log(data);

        if (!data) {
          return;
        }

        setCourse(data);
      } catch (err) {
        console.error("Erro ao buscar curso:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando curso...</p>
      </div>
    );
  }

  if (!course) return null; // já redirecionou
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showTextLogo={true} />
      <div className="flex justify-center p-6">
        <div className="w-full max-w-5xl">
          <h2 className="text-3xl font-bold mb-6">
            Explore o módulo de: {course.title}
          </h2>
          {/* trilha dos módulos */}
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
                        href={lesson.link}
                        key={lesson.id}
                        target="_blank"
                        className="flex justify-between items-center border p-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        <span>{lesson.title}</span>
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

export default function CoursePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Carregando curso...</p>
        </div>
      }
    >
      <CoursePageContent />
    </Suspense>
  );
}
