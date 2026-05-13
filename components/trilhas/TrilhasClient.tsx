"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { type LearningPathSummary, type CourseSummary } from "@/lib/api/types";

interface TrilhasClientProps {
  trilhasData: LearningPathSummary[];
  coursesData?: CourseSummary[];
}

/* ── Reusable course card with fixed dimensions ── */
function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      href={`/course?id=${course.id}`}
      className="group flex w-[200px] flex-col items-center rounded-2xl border border-[#EDE5F7] bg-white px-5 py-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#6C3BAA]/30"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#F3EAFB] to-[#E7D9F4] p-2 transition-transform duration-300 group-hover:scale-110">
        <Image
          src={course.thumbUrl || "/logo_navbar.svg"}
          alt={course.title || "Imagem do curso"}
          width={48}
          height={48}
          className="rounded-md object-contain"
        />
      </div>

      <span className="flex-1 text-center text-sm font-bold leading-snug text-[#4A2D7A]">
        {course.title}
      </span>

      <div className="mt-4 shrink-0 rounded-full bg-[#FFD600] px-5 py-2 text-xs font-bold uppercase tracking-wide text-[#4A2D7A] shadow-sm transition-all duration-300 group-hover:bg-[#ffe14d] group-hover:shadow-md">
        Ver curso
      </div>
    </Link>
  );
}

export default function TrilhasClient({ trilhasData, coursesData }: TrilhasClientProps) {
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

  const filteredCourses = useMemo(() => {
    if (!normalizedQuery || !coursesData) {
      return [];
    }

    const matchedCourses = coursesData.filter((course) => {
      const titleNormalized = normalize(course.title || "");
      const descriptionNormalized = normalize(course.description || "");
      return titleNormalized.includes(normalizedQuery) || descriptionNormalized.includes(normalizedQuery);
    });

    const coursesInTrilhas = new Set<string>();
    filteredTrilhas.forEach(t => t.courses.forEach(c => coursesInTrilhas.add(c.id)));

    return matchedCourses.filter(c => !coursesInTrilhas.has(c.id));
  }, [coursesData, normalizedQuery, filteredTrilhas]);

  if ((!trilhasData || trilhasData.length === 0) && (!coursesData || coursesData.length === 0)) {
    return (
      <section className="flex w-full items-center justify-center bg-[#FAFAFE] px-4 py-20">
        <p className="text-lg text-gray-500">Nenhum conteúdo encontrado.</p>
      </section>
    );
  }

  return (
    <div className="w-full bg-[#FAFAFE] min-h-screen">
      {/* ── Search header ── */}
      <div className="w-full bg-gradient-to-b from-white to-[#FAFAFE] px-4 pb-6 pt-10">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="mb-1 text-2xl font-bold text-[#4A2D7A]">Trilhas de Aprendizagem</h1>
          <p className="mb-5 text-sm text-gray-500">Explore trilhas e cursos disponíveis na plataforma</p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6C3BAA]/50" size={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome de curso ou trilha..."
              className="w-full rounded-xl border border-[#E7D9F4] bg-white py-3.5 pl-11 pr-5 text-sm text-gray-800 shadow-sm outline-none transition-all focus:border-[#6C3BAA] focus:shadow-md focus:ring-2 focus:ring-[#6C3BAA]/10"
            />
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {filteredTrilhas.length === 0 && filteredCourses.length === 0 ? (
        <section className="flex w-full items-center justify-center px-4 py-20">
          <div className="text-center">
            <Search className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-lg font-medium text-gray-400">Nenhum resultado encontrado.</p>
            <p className="mt-1 text-sm text-gray-400">Tente buscar por outro termo</p>
          </div>
        </section>
      ) : (
        <div className="mx-auto max-w-5xl space-y-6 px-4 pb-16">
          {/* ── Learning paths ── */}
          {filteredTrilhas.map((trilha) => {
            const cursosDaTrilha = trilha.courses;

            return (
              <section
                key={trilha.id}
                className="overflow-hidden rounded-2xl border border-[#EDE5F7]/80 bg-white shadow-sm"
              >
                {/* Path header */}
                <div className="border-b border-[#EDE5F7]/60 bg-gradient-to-r from-[#6C3BAA] to-[#8B5FC7] px-6 py-6 md:px-10">
                  <h2 className="text-2xl font-bold text-white md:text-3xl">
                    {trilha.title || "Aprendizagem"}
                  </h2>
                  {trilha.description && (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                      {trilha.description}
                    </p>
                  )}
                </div>

                {/* Timeline + cards */}
                <div className="relative px-6 py-10 md:px-10">
                  {/* Horizontal timeline line (desktop) */}
                  {cursosDaTrilha.length > 1 && (
                    <div className="absolute left-10 right-10 top-[3.25rem] hidden h-[3px] rounded-full bg-gradient-to-r from-[#6C3BAA] via-[#8B5FC7] to-[#FFD600] md:block" />
                  )}

                  {/* Vertical timeline line (mobile) */}
                  {cursosDaTrilha.length > 1 && (
                    <div className="absolute bottom-10 left-[1.85rem] top-[3.25rem] w-[3px] rounded-full bg-gradient-to-b from-[#6C3BAA] via-[#8B5FC7] to-[#FFD600] md:hidden" />
                  )}

                  <div className="flex flex-col gap-10 md:flex-row md:justify-around md:gap-4">
                    {cursosDaTrilha.map((course, idx) => (
                      <div
                        key={course.id || `course-${idx}`}
                        className="relative z-10 flex items-start gap-4 md:flex-col md:items-center md:gap-0"
                      >
                        {/* Step indicator */}
                        <div className="flex flex-col items-center md:mb-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFD600] text-xs font-extrabold text-[#4A2D7A] shadow-md ring-4 ring-white">
                            {idx + 1}
                          </div>
                          <div className="mt-1 hidden h-6 w-0.5 rounded-full bg-[#6C3BAA]/20 md:block" />
                        </div>

                        {/* Card */}
                        <CourseCard course={course} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}

          {/* ── Independent courses section ── */}
          {normalizedQuery && filteredCourses.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-[#EDE5F7]/80 bg-white shadow-sm">
              <div className="border-b border-[#EDE5F7]/60 bg-gradient-to-r from-[#4A2D7A] to-[#6C3BAA] px-6 py-6 md:px-10">
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  Outros Cursos Encontrados
                </h2>
              </div>

              <div className="flex flex-wrap justify-center gap-6 px-6 py-10 md:justify-start md:px-10">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
