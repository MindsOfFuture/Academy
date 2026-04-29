"use client";

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type EnrollmentSummary } from "@/lib/api/types";
import { getUserCourses } from "@/lib/api/enrollments";
import { checkCourseCompletion, getExistingCertificate, issueCertificate, type CertificateInfo } from "@/lib/api/certificates";
import { generateAndDownloadCertificate } from "@/lib/utils/pdfGenerator";
import toast from "react-hot-toast";
import { Award, Download } from "lucide-react";

type YourCoursesProps = {
  initialCursos?: EnrollmentSummary[];
};

export function YourCourses({ initialCursos = [] }: YourCoursesProps) {
  const [cursos, setCursos] = useState<EnrollmentSummary[]>(initialCursos);
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState<Record<string, CertificateInfo | null>>({});
  const [completionFlags, setCompletionFlags] = useState<Record<string, boolean>>({});
  const [issuingMap, setIssuingMap] = useState<Record<string, boolean>>({});

  const refreshCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserCourses();
      setCursos(data);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Escutar eventos personalizados para atualizar a lista (mesma página)
  useEffect(() => {
    const handleEnrollmentChange = () => {
      refreshCourses();
    };

    const handleProgressChange = () => {
      refreshCourses();
    };

    window.addEventListener("enrollment-changed", handleEnrollmentChange);
    window.addEventListener("lesson-progress-changed", handleProgressChange);

    return () => {
      window.removeEventListener("enrollment-changed", handleEnrollmentChange);
      window.removeEventListener("lesson-progress-changed", handleProgressChange);
    };
  }, [refreshCourses]);

  // Escutar mudanças no localStorage (entre páginas diferentes)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "courses-updated") {
        refreshCourses();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshCourses]);

  // Verificar se houve mudanças quando a página fica visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Checar se há flag de atualização pendente
        const lastUpdate = localStorage.getItem("courses-updated");
        if (lastUpdate) {
          refreshCourses();
          localStorage.removeItem("courses-updated");
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Também verificar no mount
    const lastUpdate = localStorage.getItem("courses-updated");
    if (lastUpdate) {
      refreshCourses();
      localStorage.removeItem("courses-updated");
    }

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refreshCourses]);

  // Verificar certificados para cursos com 100% de progresso
  useEffect(() => {
    async function checkCerts() {
      const candidateCourses = cursos.filter(c => c.progressPercent === 100);
      for (const curso of candidateCourses) {
        if (certificates[curso.course.id] !== undefined) continue; // Já verificou
        try {
          const [cert, status] = await Promise.all([
            getExistingCertificate(curso.course.id),
            checkCourseCompletion(curso.course.id),
          ]);
          setCertificates(prev => ({ ...prev, [curso.course.id]: cert }));
          setCompletionFlags(prev => ({ ...prev, [curso.course.id]: status.isCompleted }));
        } catch {
          setCertificates(prev => ({ ...prev, [curso.course.id]: null }));
          setCompletionFlags(prev => ({ ...prev, [curso.course.id]: false }));
        }
      }
    }
    checkCerts();
  }, [cursos]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCertificate(e: React.MouseEvent, courseId: string) {
    e.preventDefault();
    e.stopPropagation();

    const existing = certificates[courseId];
    if (existing) {
      generateAndDownloadCertificate({
        studentName: existing.studentName,
        studentCpf: existing.studentCpf,
        courseName: existing.courseTitle,
        completionDate: new Date(existing.issuedAt).toLocaleDateString("pt-BR"),
        verificationCode: existing.verificationCode,
      });
      return;
    }

    setIssuingMap(prev => ({ ...prev, [courseId]: true }));
    try {
      const cert = await issueCertificate(courseId);
      setCertificates(prev => ({ ...prev, [courseId]: cert }));
      generateAndDownloadCertificate({
        studentName: cert.studentName,
        studentCpf: cert.studentCpf,
        courseName: cert.courseTitle,
        completionDate: new Date(cert.issuedAt).toLocaleDateString("pt-BR"),
        verificationCode: cert.verificationCode,
      });
      toast.success("Certificado emitido com sucesso!");
    } catch (error) {
      console.error("Erro ao emitir certificado:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao emitir certificado.");
    } finally {
      setIssuingMap(prev => ({ ...prev, [courseId]: false }));
    }
  }

  if (cursos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-2">
            Você ainda não está matriculado em nenhum curso.
          </p>
          <p className="text-gray-500">
            Explore nossas trilhas de aprendizagem e comece sua jornada!
          </p>
        </div>
        <Link
          href="/trilhas"
          className="bg-[#684A97] hover:bg-[#553d7a] text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Explorar Trilhas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-auto items-center">
      {loading && (
        <div className="absolute top-2 right-2 text-sm text-gray-500">
          Atualizando...
        </div>
      )}
      <div className="flex flex-col">
        <div className="flex justify-center items-start gap-20 flex-wrap p-6">

          {cursos.map((curso) => {
            const hasCertButton = !!(certificates[curso.course.id] || completionFlags[curso.course.id]);
            return (
            <Link
              key={curso.enrollmentId}
              href={`/course?id=${curso.course.id}`}
              className="flex flex-col items-center p-3 rounded-[5px] bg-white shadow-[15px_15px_4px_0_rgba(152,152,152,0.2)] text-black w-[300px] h-[500px] cursor-pointer hover:shadow-lg transition"
            >
              <Image
                src={curso.course.thumbUrl || "/logo_navbar.svg"}
                alt={curso.course.title}
                width={430}
                height={72}
                className="w-full h-[180px] bg-gray-200 p-4"
              />
              <h3 className="text-[18pt] font-bold w-full flex items-center justify-center mt-4">
                {curso.course.title}
              </h3>

              <div className="flex-1 flex flex-col items-center justify-center">
                <div className={`relative ${hasCertButton ? "size-28" : "size-40"}`}>
                  <svg className="size-full rotate-180" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-orange-100" strokeWidth="3" strokeDasharray="50 100" strokeLinecap="round"></circle>
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-orange-600" strokeWidth="1" strokeDasharray={`${curso.progressPercent / 2} 100`} strokeLinecap="round"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className={`font-bold text-orange-600 ${hasCertButton ? "text-xl" : "text-2xl"}`}>{curso.progressPercent}%</span>
                    <span className="text-xs text-orange-600">Concluído</span>
                  </div>
                </div>
              </div>

              {/* Botão de Certificado */}
              {hasCertButton && (
                <button
                  onClick={(e) => handleCertificate(e, curso.course.id)}
                  disabled={issuingMap[curso.course.id]}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-1 bg-[#684A97] text-white rounded-lg hover:bg-[#553d7a] transition text-sm font-semibold disabled:opacity-50 shadow-md"
                >
                  {certificates[curso.course.id] ? (
                    <>
                      <Download className="w-4 h-4" />
                      Baixar Certificado
                    </>
                  ) : issuingMap[curso.course.id] ? (
                    "Emitindo..."
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      Emitir Certificado
                    </>
                  )}
                </button>
              )}
            </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
