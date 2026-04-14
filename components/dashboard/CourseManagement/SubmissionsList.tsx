"use client";

import { useState, useEffect } from "react";
import { type AssignmentSummary, type SubmissionWithStudent } from "@/lib/api/types";
import { listAssignmentSubmissions } from "@/lib/api/assignments";
import GradingModal from "./GradingModal";
import {
    X,
    Users,
    CheckCircle,
    Clock,
    PencilLine,
    ExternalLink,
    RefreshCw,
    Filter
} from "lucide-react";

interface SubmissionsListProps {
    assignment: AssignmentSummary;
    onClose: () => void;
}

type FilterType = "all" | "pending" | "graded";

export default function SubmissionsList({
    assignment,
    onClose,
}: SubmissionsListProps) {
    const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");
    const [gradingSubmission, setGradingSubmission] = useState<SubmissionWithStudent | null>(null);

    const loadSubmissions = async () => {
        setLoading(true);
        try {
            const data = await listAssignmentSubmissions(assignment.id);
            setSubmissions(data);
        } catch (error) {
            console.error("Erro ao carregar entregas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
    }, [assignment.id]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const filteredSubmissions = submissions.filter((sub) => {
        if (filter === "pending") return !sub.gradedAt;
        if (filter === "graded") return !!sub.gradedAt;
        return true;
    });

    const pendingCount = submissions.filter((s) => !s.gradedAt).length;
    const gradedCount = submissions.filter((s) => !!s.gradedAt).length;

    const handleGraded = () => {
        setGradingSubmission(null);
        loadSubmissions();
    };

    return (
        <>
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                Entregas da Atividade
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {assignment.title}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-500 hover:text-gray-700 rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Filtros e Stats */}
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                                Total: <strong>{submissions.length}</strong> entregas
                            </span>
                            <span className="text-yellow-600">
                                Pendentes: <strong>{pendingCount}</strong>
                            </span>
                            <span className="text-green-600">
                                Corrigidas: <strong>{gradedCount}</strong>
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={loadSubmissions}
                                disabled={loading}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition"
                                title="Atualizar"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            </button>

                            <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
                                <Filter className="w-4 h-4 text-gray-400 ml-2" />
                                <button
                                    onClick={() => setFilter("all")}
                                    className={`px-3 py-1 rounded text-sm transition ${
                                        filter === "all"
                                            ? "bg-purple-100 text-purple-700"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    Todas
                                </button>
                                <button
                                    onClick={() => setFilter("pending")}
                                    className={`px-3 py-1 rounded text-sm transition ${
                                        filter === "pending"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    Pendentes
                                </button>
                                <button
                                    onClick={() => setFilter("graded")}
                                    className={`px-3 py-1 rounded text-sm transition ${
                                        filter === "graded"
                                            ? "bg-green-100 text-green-700"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    Corrigidas
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Entregas */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-pulse text-gray-500">
                                    Carregando entregas...
                                </div>
                            </div>
                        ) : filteredSubmissions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                                <Users className="w-12 h-12 mb-2 opacity-50" />
                                <p>
                                    {filter === "all"
                                        ? "Nenhuma entrega ainda"
                                        : filter === "pending"
                                        ? "Nenhuma entrega pendente"
                                        : "Nenhuma entrega corrigida"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredSubmissions.map((sub) => (
                                    <div
                                        key={sub.id}
                                        className={`border rounded-lg p-4 transition ${
                                            sub.gradedAt
                                                ? "bg-green-50 border-green-200"
                                                : "bg-white border-gray-200 hover:border-purple-300"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-medium text-gray-900">
                                                        {sub.studentName}
                                                    </h4>
                                                    {sub.gradedAt ? (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Corrigida
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                                            <Clock className="w-3 h-3" />
                                                            Pendente
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-sm text-gray-500 mt-1">
                                                    {sub.studentEmail}
                                                </p>

                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span>
                                                        Enviado: {formatDate(sub.submittedAt)}
                                                    </span>
                                                    {sub.gradedAt && (
                                                        <span>
                                                            Corrigido: {formatDate(sub.gradedAt)}
                                                        </span>
                                                    )}
                                                </div>

                                                {(sub.answerUrl || sub.contentUrl) && (
                                                    <a
                                                        href={(() => { const u = sub.answerUrl || sub.contentUrl || "#"; return u.startsWith("http") ? u : `https://${u}`; })()}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-2"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        Ver Entrega
                                                    </a>
                                                )}

                                                {sub.gradedAt && (
                                                    <div className="mt-2 pt-2 border-t border-green-200">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Nota: {sub.score ?? "-"} / {assignment.maxScore ?? 10}
                                                        </span>
                                                        {sub.feedback && (
                                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                                {sub.feedback}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => setGradingSubmission(sub)}
                                                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm ml-4 flex-shrink-0"
                                            >
                                                <PencilLine className="w-4 h-4" />
                                                {sub.gradedAt ? "Editar" : "Corrigir"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Correção */}
            {gradingSubmission && (
                <GradingModal
                    submission={gradingSubmission}
                    maxScore={assignment.maxScore}
                    onClose={() => setGradingSubmission(null)}
                    onGraded={handleGraded}
                />
            )}
        </>
    );
}
