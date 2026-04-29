"use client";

import { useState } from "react";
import { validateCertificate, type CertificateInfo } from "@/lib/api/certificates";
import { generateAndDownloadCertificate } from "@/lib/utils/pdfGenerator";
import Navbar from "@/components/navbar/navbar";
import { Search, CheckCircle, XCircle, Download, ShieldCheck } from "lucide-react";

export default function ValidarPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateInfo | null | undefined>(undefined);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setResult(undefined);
    try {
      const cert = await validateCertificate(code.trim());
      setResult(cert);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    generateAndDownloadCertificate({
      studentName: result.studentName,
      studentCpf: result.studentCpf,
      courseName: result.courseTitle,
      completionDate: new Date(result.issuedAt).toLocaleDateString("pt-BR"),
      verificationCode: result.verificationCode,
    });
  }

  function formatCpfPartial(cpf: string) {
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `***.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-**`;
    }
    return "***.***.***-**";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showTextLogo={true} />
      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
            <ShieldCheck className="w-8 h-8 text-purple-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Validar Certificado
          </h1>
          <p className="text-gray-600">
            Insira o código de autenticidade presente no certificado para verificar sua validade.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleValidate} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ex: A1B2-C3D4-E5F6"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-lg tracking-widest font-mono"
                maxLength={14}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-6 py-3 bg-[#684A97] text-white rounded-lg font-semibold hover:bg-[#553d7a] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Buscando..." : "Validar"}
            </button>
          </div>
        </form>

        {/* Result */}
        {result !== undefined && (
          <div className="animate-in fade-in duration-300">
            {result ? (
              <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <h2 className="text-xl font-bold text-green-700">
                      Certificado Válido
                    </h2>
                    <p className="text-sm text-green-600">
                      Este certificado é autêntico e foi emitido pela Minds of Future Academy.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500 block">Aluno(a)</span>
                      <span className="font-semibold text-gray-900">
                        {result.studentName}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">CPF</span>
                      <span className="font-semibold text-gray-900">
                        {result.studentCpf
                          ? formatCpfPartial(result.studentCpf)
                          : "Não informado"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">Curso</span>
                      <span className="font-semibold text-gray-900">
                        {result.courseTitle}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">Data de Emissão</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(result.issuedAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-500 block">Código de Autenticidade</span>
                        <span className="font-mono font-bold text-purple-700 text-lg tracking-widest">
                          {result.verificationCode}
                        </span>
                      </div>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-[#684A97] text-white rounded-lg hover:bg-[#553d7a] transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Baixar PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-red-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <h2 className="text-xl font-bold text-red-700">
                      Certificado Não Encontrado
                    </h2>
                    <p className="text-sm text-red-600">
                      Nenhum certificado foi encontrado com este código. Verifique se digitou corretamente.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
