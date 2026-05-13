"use client";
import { useEffect, useRef, useState } from "react";
import { Award, Download, FileBadge, Loader2 } from "lucide-react";
import { type CertificateInfo, type StudentProgress } from "@/lib/api/certificates";
import { generateAndDownloadCertificate } from "@/lib/utils/pdfGenerator";
import toast from "react-hot-toast";

interface UserInfo {
  id?: string;
  full_name?: string;
  email?: string;
  role_name?: string;
}

interface Aluno {
  id: string;
  user?: UserInfo | null;
}

type StudentsManagerProps = {
  alunos: Aluno[];
  alunosDisponiveis: UserInfo[];
  loading: boolean;
  onAdd: (aluno: UserInfo) => void;
  onRemove: (id: string) => void;
  certificates?: Record<string, CertificateInfo>;
  progress?: Record<string, StudentProgress>;
  onIssueCertificate?: (enrollmentId: string, userId: string) => Promise<CertificateInfo>;
};

export default function StudentsManager({
  alunos,
  alunosDisponiveis,
  loading,
  onAdd,
  onRemove,
  certificates = {},
  progress = {},
  onIssueCertificate,
}: StudentsManagerProps) {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<UserInfo[]>([]);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Fecha a lista ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setFiltered([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Atualiza a lista conforme o texto digitado
  useEffect(() => {
    if (!search) return;
    const result = alunosDisponiveis.filter((u) =>
      (u.full_name ?? u.email ?? "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, alunosDisponiveis]);

  function handleDownloadCertificate(cert: CertificateInfo) {
    generateAndDownloadCertificate({
      studentName: cert.studentName,
      studentCpf: cert.studentCpf,
      courseName: cert.courseTitle,
      completionDate: new Date(cert.issuedAt).toLocaleDateString("pt-BR"),
      verificationCode: cert.verificationCode,
    });
  }

  async function handleIssueCertificate(enrollmentId: string, userId: string) {
    if (!onIssueCertificate) return;
    setIssuingId(enrollmentId);
    try {
      const cert = await onIssueCertificate(enrollmentId, userId);
      toast.success("Certificado emitido com sucesso!");
      handleDownloadCertificate(cert);
    } catch (error) {
      console.error("Erro ao emitir certificado:", error);
      toast.error("Erro ao emitir certificado.");
    } finally {
      setIssuingId(null);
    }
  }

  function getProgressColor(percent: number) {
    if (percent >= 100) return "bg-green-500";
    if (percent >= 60) return "bg-blue-500";
    if (percent >= 30) return "bg-yellow-500";
    return "bg-gray-400";
  }

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h3 className="text-xl font-semibold mb-2">Gerenciar Alunos</h3>

      {loading ? (
        <p>Carregando alunos...</p>
      ) : (
        <>
          <ul className="divide-y mb-4">
            {alunos.map((a) => {
              const cert = certificates[a.id];
              const prog = progress[a.id];
              const percent = prog?.progressPercent ?? 0;
              const isEligible = prog?.isEligible && !cert;

              return (
                <li key={a.id} className="py-3">
                  {/* Top row: name + badges + actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="truncate font-medium text-gray-900">
                        {a.user?.full_name || a.user?.email || a.id}
                      </span>
                      {cert && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium whitespace-nowrap">
                          <Award className="w-3 h-3" />
                          Certificado
                        </span>
                      )}
                      {isEligible && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium whitespace-nowrap">
                          <FileBadge className="w-3 h-3" />
                          Apto
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEligible && onIssueCertificate && (
                        <button
                          onClick={() => handleIssueCertificate(a.id, prog!.userId)}
                          disabled={issuingId === a.id}
                          title="Emitir certificado para este aluno"
                          className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded hover:bg-amber-600 transition text-sm disabled:opacity-50"
                        >
                          {issuingId === a.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileBadge className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Emitir</span>
                        </button>
                      )}
                      {cert && (
                        <button
                          onClick={() => handleDownloadCertificate(cert)}
                          title="Baixar certificado do aluno"
                          className="flex items-center gap-1 bg-[#684A97] text-white px-2.5 py-1 rounded hover:bg-[#553d7a] transition text-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Certificado</span>
                        </button>
                      )}
                      <button
                        onClick={() => onRemove(a.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {prog && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getProgressColor(percent)}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 min-w-[80px] text-right">
                        {percent}% ({prog.completedLessons}/{prog.totalLessons})
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div ref={wrapperRef} className="relative">
            <input
              type="text"
              placeholder="Adicionar aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={() => setFiltered(alunosDisponiveis)} // mostra todos ao clicar
              className="border rounded px-2 py-1 w-full mb-2"
            />

            {filtered.length > 0 && (
              <ul className="absolute z-10 w-full border rounded p-2 max-h-40 overflow-y-auto bg-white shadow">
                {filtered.map((u) => (
                  <li
                    key={u.id}
                    onClick={() => {
                      onAdd(u);
                      setSearch("");
                      setFiltered([]);
                    }}
                    className="py-1 px-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  >
                    <span>{u.full_name || u.email}</span>
                    {u.role_name && u.role_name !== "student" && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        u.role_name === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {u.role_name === "admin" ? "Admin" : "Professor"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
