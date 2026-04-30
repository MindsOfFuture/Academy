"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type LearningPathSummary } from "@/lib/api/types";

interface TrilhasClientProps {
  trilhasData: LearningPathSummary[];
}

export default function TrilhasClient({ trilhasData }: TrilhasClientProps) {
  const [query, setQuery] = useState("");
  const normalize = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const normalizedQuery = normalize(query.trim());

  const filteredTrilhas = useMemo(() => {
    if (!normalizedQuery) {
      return trilhasData;
    }

    return trilhasData
      .map((trilha) => {
        const titleNormalized = normalize(trilha.title || "");
        const descriptionNormalized = normalize(trilha.description || "");
        
        const trilhaMatches =
          titleNormalized.includes(normalizedQuery) ||
          descriptionNormalized.includes(normalizedQuery);

        if (trilhaMatches) {
          return trilha;
        }

        const filteredCourses = trilha.courses.filter((course) =>
          normalize(course.title || "").includes(normalizedQuery)
        );

        return { ...trilha, courses: filteredCourses };
      })
      .filter((trilha) => trilha.courses.length > 0);
  }, [trilhasData, normalizedQuery]);

  if (!trilhasData || trilhasData.length === 0) {
    return (
      <section className="w-full flex items-center justify-center py-12 bg-white px-4">
        <p>Nenhuma trilha de aprendizagem encontrada.</p>
      </section>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full bg-white px-4 pt-10">
        <div className="mx-auto w-full max-w-4xl">
          <label className="mb-2 block text-sm font-semibold text-[#6C3BAA]">
            Buscar cursos ou trilhas
          </label>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Digite o nome do curso ou trilha"
            className="w-full rounded-full border border-[#E7D9F4] bg-white px-5 py-3 text-base text-gray-800 shadow-sm outline-none transition focus:border-[#6C3BAA] focus:ring-2 focus:ring-[#6C3BAA]/20"
          />
        </div>
      </div>

      {filteredTrilhas.length === 0 ? (
        <section className="w-full flex items-center justify-center py-12 bg-white px-4">
          <p>Nenhum resultado encontrado.</p>
        </section>
      ) : (
        filteredTrilhas.map((trilha) => {
          const cursosDaTrilha = trilha.courses;

          return (
            <section
              key={trilha.id}
              className="w-full flex flex-col items-center py-12 bg-white px-4"
            >
              <div className="w-full max-w-4xl text-center md:text-left mb-16">
                <h2 className="text-4xl font-bold text-[#6C3BAA] mb-4">
                  Sua Jornada de <br /> {trilha.title || "Aprendizagem"}
                </h2>
                <p className="text-gray-700">
                  {trilha.description || "Descubra os cursos desta trilha e acompanhe sua jornada."}
                </p>
              </div>

              <div className="relative w-full max-w-4xl mb-8">
                <div
                  className="hidden md:block absolute top-6 left-0 right-0 bg-[#6C3BAA] rounded-full z-0"
                  style={{ height: "4px" }}
                />

                <div className="flex flex-col md:flex-row justify-between w-full z-10 space-y-16 md:space-y-0">
                  {cursosDaTrilha.map((course) => (
                    <div
                      key={course.id}
                      className="flex flex-col items-center w-full md:w-auto"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FFD600] border-4 border-white z-10" />
                      <div className="hidden md:block w-1 h-8 bg-[#6C3BAA]" />

                      <Link
                        href={`/course?id=${course.id}`}
                        className="bg-white rounded-xl shadow-md flex flex-col items-center px-6 py-6 mt-2 min-w-[170px] cursor-pointer transition-shadow hover:shadow-lg"
                      >
                        <div className="mb-4">
                          <Image
                            src={course.thumbUrl || "/logo_navbar.svg"}
                            alt={course.title}
                            width={60}
                            height={60}
                            className="rounded-md object-contain"
                          />
                        </div>
                        <span className="text-[#6C3BAA] text-lg font-semibold mb-4">
                          {course.title}
                        </span>
                        <div className="bg-[#FFD600] text-[#6C3BAA] font-semibold px-4 py-2 rounded-md shadow hover:bg-yellow-400 transition-colors">
                          Ver curso
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
