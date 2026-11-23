"use client";

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type EnrollmentSummary } from "@/lib/api/types";
import { getUserCourses } from "@/lib/api/enrollments";
import { checkCourseCompletion, getExistingCertificate, issueCertificate, type CertificateInfo } from "@/lib/api/certificates";
import toast from "react-hot-toast";
import { Award, Download } from "lucide-react";
import { BOTAO_PRIMARIO } from "@/components/ui/botoes";
import { cn } from "@/lib/utils";

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

    setIssuingMap(prev => ({ ...prev, [courseId]: true }));
    try {
      // jsPDF é pesado: só carrega quando o aluno pede o certificado.
      const { generateAndDownloadCertificate } = await import("@/lib/utils/pdfGenerator").catch(() => {
        throw new Error("Não foi possível carregar o gerador de certificado. Tente novamente.");
      });

      const existing = certificates[courseId];
      if (existing) {
        await generateAndDownloadCertificate({
          studentName: existing.studentName,
          studentCpf: existing.studentCpf,
          courseName: existing.courseTitle,
          completionDate: new Date(existing.issuedAt).toLocaleDateString("pt-BR"),
          verificationCode: existing.verificationCode,
        });
        return;
      }

      const cert = await issueCertificate(courseId);
      setCertificates(prev => ({ ...prev, [courseId]: cert }));
      await generateAndDownloadCertificate({
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
          className={BOTAO_PRIMARIO}
        >
          Explorar Trilhas
        </Link>
      </div>
    );
  }

  // Cartão horizontal: foto, nome, barra de progresso e a ação. Cabem dois por
  // linha no computador e a página não fica com um cartão alto solto no meio.
  return (
    <div className="relative">
      {loading && (
        <div className="absolute -top-7 right-0 text-sm text-gray-500">
          Atualizando...
        </div>
      )}
      <ul className="grid gap-4 md:grid-cols-2">
        {cursos.map((curso) => {
          const hasCertButton = !!(certificates[curso.course.id] || completionFlags[curso.course.id]);
          return (
            <li key={curso.enrollmentId}>
              <Link
                href={`/course?id=${curso.course.id}`}
                className="flex h-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-3 text-black shadow-sm transition hover:border-[#684A97]/40 hover:shadow-md"
              >
                <Image
                  src={curso.course.thumbUrl || "/logo_navbar.svg"}
                  alt={curso.course.title}
                  width={240}
                  height={160}
                  className="h-20 w-28 shrink-0 rounded-xl bg-gray-100 object-cover sm:w-32"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold leading-snug line-clamp-2">{curso.course.title}</h3>
                  <div
                    className="mt-2 h-2 rounded-full bg-[#ECE9F3]"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={curso.progressPercent}
                    aria-label={`Progresso em ${curso.course.title}`}
                  >
                    <div className="h-2 rounded-full bg-[#684A97]" style={{ width: `${curso.progressPercent}%` }} />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{curso.progressPercent}% concluído</p>
                  {hasCertButton && (
                    <button
                      onClick={(e) => handleCertificate(e, curso.course.id)}
                      disabled={issuingMap[curso.course.id]}
                      className={cn(BOTAO_PRIMARIO, "mt-2")}
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
                </div>
                {!hasCertButton && (
                  <span className="hidden shrink-0 rounded-full bg-[#684A97] px-4 py-2 text-sm font-semibold text-white sm:inline-flex">
                    {curso.progressPercent > 0 ? "Continuar" : "Começar"}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
