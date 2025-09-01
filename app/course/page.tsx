"use client";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar/navbar";
import { getUserTypeServer } from "@/components/api/admApi";
import { useSearchParams } from "next/navigation";

export default  function CoursePage() {

  const searchParams = useSearchParams();
  const courseId = searchParams.get("id");
  console.log(courseId);
  
  const course = {
    id: "24",
    title: "Scratch",
    percentCourse: 25,
    imageUrl:
      "data:image/jpeg;base64,...",
    content: {
      modules: [
        {
          title: "Introdução ao Scratch",
          lessons: [
            { title: "O que é o Scratch?", duration: "10:00", link: "https://www.youtube.com/watch?v=8DhQG27oLPs" },
            { title: "Sprites, oque comem, onde dorme?", duration: "10:00", link: "https://www.youtube.com/watch?v=8DhQG27oLPs" },

          ],
        },
        {
          title: "Jogo da Cobrinha",
          lessons: [
            { title: "Clonagem", duration: "15:00", link: "https://www.youtube.com/watch?v=8DhQG27oLPs" },
          ],
        },
        {
          title: "Variaveis?",
          lessons: [
            { title: "tem que ter??", duration: "15:00", link: "https://www.youtube.com/watch?v=8DhQG27oLPs" },
          ],
        },
      ],
    },
  };

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
            {course.content.modules.map((module, idx) => (
              <div key={idx} className="flex items-start gap-4">
                {/* bolinha da trilha */}
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  {idx < course.content.modules.length - 1 && (
                    <div className="flex-1 w-[2px] bg-blue-300"></div>
                  )}
                </div>

                {/* conteúdo do módulo */}
                <div className="flex-1 bg-white rounded-xl shadow-md p-4">
                  <h3 className="text-xl font-semibold mb-3">{module.title}</h3>
                  <div className="flex flex-col gap-2">
                    {module.lessons.map((lesson, lidx) => (
                      <a
                        href={lesson.link}
                        key={lidx}
                        target="_blank"
                        className="flex justify-between items-center border p-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        <span>{lesson.title}</span>
                        <span className="text-sm text-gray-500">{lesson.duration}</span>
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
