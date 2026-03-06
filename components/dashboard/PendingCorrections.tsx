"use client";

import { useState, useEffect, useCallback } from "react";
import { type PendingSubmission } from "@/lib/api/types";
import { listPendingSubmissions, listGradedSubmissions, deleteGrade } from "@/lib/api/assignments";
import GradingModal from "./CourseManagement/GradingModal";
import {
    ClipboardCheck,
    Clock,
    User,
    BookOpen,
    FileText,
    ExternalLink,
    RefreshCw,
    PencilLine,
    Inbox,
    History,
    ChevronDown,
    ChevronUp,
    Trash2,
    Star,
    MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";

type SubTab = "pending" | "history";

export default function PendingCorrections() {
    const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
    const [gradedSubmissions, setGradedSubmissions] = useState<PendingSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<SubTab>("pending");
    const [gradingSubmission, setGradingSubmission] = useState<PendingSubmission | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set());

    const loadSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listPendingSubmissions();
            setSubmissions(data);
        } catch (error) {
            console.error("Erro ao carregar correções pendentes:", error);
            toast.error("Erro ao carregar correções pendentes");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const data = await listGradedSubmissions();
            setGradedSubmissions(data);
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
            toast.error("Erro ao carregar histórico");
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        loadSubmissions();
    }, [loadSubmissions]);

    useEffect(() => {
        if (activeSubTab === "history" && gradedSubmissions.length === 0 && !loadingHistory) {
            loadHistory();
        }
    }, [activeSubTab, gradedSubmissions.length, loadingHistory, loadHistory]);

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

    const handleGraded = () => {
        setGradingSubmission(null);
        loadSubmissions();
        if (activeSubTab === "history") loadHistory();
        toast.success("Correção salva com sucesso!");
    };

    const handleDeleteGrade = async (sub: PendingSubmission) => {
        if (!confirm(`Tem certeza que deseja remover a correção de "${sub.studentName}" na atividade "${sub.assignmentTitle}"?\n\nA submissão voltará para pendente.`)) return;
        
        setDeletingId(sub.id);
        try {
            await deleteGrade(sub.id);
            toast.success("Correção removida. Submissão retornou para pendente.");
            loadHistory();
            loadSubmissions();
        } catch {
            toast.error("Erro ao remover correção");
        } finally {
            setDeletingId(null);
        }
    };

    const toggleFeedback = (id: string) => {
        setExpandedFeedback(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const normalizeUrl = (url: string) => url.startsWith("http") ? url : `https://${url}`;

    // Agrupar por curso
    const groupByCourse = (subs: PendingSubmission[]) =>
        subs.reduce((acc, sub) => {
            const courseId = sub.courseId;
            if (!acc[courseId]) {
                acc[courseId] = { courseName: sub.courseName, submissions: [] };
            }
            acc[courseId].submissions.push(sub);
            return acc;
        }, {} as Record<string, { courseName: string; submissions: PendingSubmission[] }>);

    const groupedPending = groupByCourse(submissions);
    const groupedGraded = groupByCourse(gradedSubmissions);

    const renderSubmissionCard = (sub: PendingSubmission, isHistory: boolean) => (
        <div key={sub.id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Atividade */}
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900">{sub.assignmentTitle}</span>
                        {sub.assignmentMaxScore && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {sub.assignmentMaxScore} pts
                            </span>
                        )}
                    </div>

                    {/* Aula */}
                    <p className="text-sm text-gray-500 mb-2 ml-6">Aula: {sub.lessonTitle}</p>

                    {/* Aluno, Data e Link */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 ml-6">
                        <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {sub.studentName}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(sub.submittedAt)}
                        </span>
                        {(sub.answerUrl || sub.contentUrl) && (
                            <a
                                href={normalizeUrl(sub.answerUrl || sub.contentUrl || "#")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Ver Entrega
                            </a>
                        )}
                    </div>

                    {/* Nota e Feedback (apenas histórico) */}
                    {isHistory && (
                        <div className="mt-3 ml-6 space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">
                                    <Star className="w-4 h-4" />
                                    Nota: {sub.score ?? "-"}{sub.assignmentMaxScore ? ` / ${sub.assignmentMaxScore}` : ""}
                                </span>
                                <span className="text-xs text-gray-400">
                                    Corrigido em {formatDate(sub.gradedAt)}
                                </span>
                            </div>
                            {sub.feedback && (
                                <div>
                                    <button
                                        onClick={() => toggleFeedback(sub.id)}
                                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Feedback
                                        {expandedFeedback.has(sub.id)
                                            ? <ChevronUp className="w-3.5 h-3.5" />
                                            : <ChevronDown className="w-3.5 h-3.5" />
                                        }
                                    </button>
                                    {expandedFeedback.has(sub.id) && (
                                        <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border">
                                            {sub.feedback}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Botões */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {isHistory ? (
                        <>
                            <button
                                onClick={() => setGradingSubmission(sub)}
                                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm"
                                title="Editar correção"
                            >
                                <PencilLine className="w-4 h-4" />
                                Editar
                            </button>
                            <button
                                onClick={() => handleDeleteGrade(sub)}
                                disabled={deletingId === sub.id}
                                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm disabled:opacity-50"
                                title="Remover correção"
                            >
                                <Trash2 className={`w-4 h-4 ${deletingId === sub.id ? "animate-spin" : ""}`} />
                                Remover
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setGradingSubmission(sub)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                        >
                            <PencilLine className="w-4 h-4" />
                            Corrigir
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const renderCourseGroups = (groups: Record<string, { courseName: string; submissions: PendingSubmission[] }>, isHistory: boolean) => (
        <div className="space-y-6">
            {Object.entries(groups).map(([courseId, { courseName, submissions: courseSubs }]) => (
                <div key={courseId} className="bg-white rounded-lg shadow border overflow-hidden">
                    <div className={`${isHistory ? "bg-green-50" : "bg-purple-50"} px-4 py-3 border-b flex items-center gap-2`}>
                        <BookOpen className={`w-5 h-5 ${isHistory ? "text-green-600" : "text-purple-600"}`} />
                        <h3 className={`font-semibold ${isHistory ? "text-green-900" : "text-purple-900"}`}>{courseName}</h3>
                        <span className={`ml-auto text-sm ${isHistory ? "text-green-600 bg-green-100" : "text-purple-600 bg-purple-100"} px-2 py-0.5 rounded-full`}>
                            {courseSubs.length} {isHistory ? "corrigida" : "pendente"}{courseSubs.length > 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className="divide-y">
                        {courseSubs.map((sub) => renderSubmissionCard(sub, isHistory))}
                    </div>
                </div>
            ))}
        </div>
    );

    const isCurrentLoading = activeSubTab === "pending" ? loading : loadingHistory;

    return (
        <div>
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <ClipboardCheck className="w-6 h-6 text-purple-600" />
                        Correções
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        {submissions.length === 0
                            ? "Nenhuma atividade aguardando correção"
                            : `${submissions.length} atividade${submissions.length > 1 ? "s" : ""} aguardando correção`
                        }
                    </p>
                </div>
                <button
                    onClick={() => { loadSubmissions(); if (activeSubTab === "history") loadHistory(); }}
                    disabled={isCurrentLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                    <RefreshCw className={`w-4 h-4 ${isCurrentLoading ? "animate-spin" : ""}`} />
                    Atualizar
                </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveSubTab("pending")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                        activeSubTab === "pending"
                            ? "bg-white text-purple-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                    <ClipboardCheck className="w-4 h-4" />
                    Pendentes
                    {submissions.length > 0 && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                            {submissions.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveSubTab("history")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                        activeSubTab === "history"
                            ? "bg-white text-green-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                    <History className="w-4 h-4" />
                    Histórico
                    {gradedSubmissions.length > 0 && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                            {gradedSubmissions.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Conteúdo */}
            {isCurrentLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse text-gray-500 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Carregando...
                    </div>
                </div>
            ) : activeSubTab === "pending" ? (
                submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Inbox className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Tudo em dia!</p>
                        <p className="text-sm">Não há atividades pendentes de correção.</p>
                    </div>
                ) : (
                    renderCourseGroups(groupedPending, false)
                )
            ) : (
                gradedSubmissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <History className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nenhuma correção ainda</p>
                        <p className="text-sm">As atividades corrigidas aparecerão aqui.</p>
                    </div>
                ) : (
                    renderCourseGroups(groupedGraded, true)
                )
            )}

            {/* Modal de Correção */}
            {gradingSubmission && (
                <GradingModal
                    submission={gradingSubmission}
                    maxScore={gradingSubmission.assignmentMaxScore}
                    onClose={() => setGradingSubmission(null)}
                    onGraded={handleGraded}
                />
            )}
        </div>
    );
}
