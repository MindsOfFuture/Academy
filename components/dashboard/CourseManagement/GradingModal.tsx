"use client";

import { useState } from "react";
import { type SubmissionWithStudent } from "@/lib/api/types";
import { gradeSubmission } from "@/lib/api/assignments";
import { X, User, Link2, MessageSquare, Award, Save, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface GradingModalProps {
    submission: SubmissionWithStudent;
    maxScore: number | null;
    onClose: () => void;
    onGraded: () => void;
}

export default function GradingModal({
    submission,
    maxScore,
    onClose,
    onGraded,
}: GradingModalProps) {
    const [score, setScore] = useState<string>(
        submission.score !== null ? String(submission.score) : ""
    );
    const [feedback, setFeedback] = useState(submission.feedback || "");
    const [loading, setLoading] = useState(false);

    const effectiveMaxScore = maxScore ?? 10;

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

    const handleSubmit = async () => {
        const scoreNum = parseFloat(score);
        
        if (isNaN(scoreNum) || scoreNum < 0) {
            toast.error("Por favor, insira uma nota válida");
            return;
        }

        if (scoreNum > effectiveMaxScore) {
            toast.error(`A nota não pode ser maior que ${effectiveMaxScore}`);
            return;
        }

        if (!feedback.trim()) {
            toast.error("Por favor, insira um feedback para o aluno");
            return;
        }

        setLoading(true);
        try {
            await gradeSubmission(submission.id, {
                score: scoreNum,
                feedback: feedback.trim(),
            });
            toast.success("Correção salva com sucesso!");
            onGraded();
        } catch (error) {
            console.error("Erro ao salvar correção:", error);
            toast.error("Erro ao salvar correção. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Corrigir Atividade
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-500 hover:text-gray-700 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="p-4 space-y-6">
                    {/* Informações do Aluno */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Dados do Aluno
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Nome:</span>
                                <p className="font-medium text-gray-900">
                                    {submission.studentName}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Email:</span>
                                <p className="font-medium text-gray-900">
                                    {submission.studentEmail || "-"}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Enviado em:</span>
                                <p className="font-medium text-gray-900 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(submission.submittedAt)}
                                </p>
                            </div>
                            {submission.gradedAt && (
                                <div>
                                    <span className="text-gray-500">Corrigido em:</span>
                                    <p className="font-medium text-gray-900">
                                        {formatDate(submission.gradedAt)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Link da Entrega */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Link2 className="w-4 h-4" />
                            Entrega do Aluno
                        </h3>
                        {submission.answerUrl || submission.contentUrl ? (
                            <a
                                href={(() => { const u = submission.answerUrl || submission.contentUrl || "#"; return u.startsWith("http") ? u : `https://${u}`; })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                            >
                                {submission.answerUrl || submission.contentUrl}
                            </a>
                        ) : (
                            <p className="text-gray-500 text-sm">Nenhum link fornecido</p>
                        )}

                        {submission.comments && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <span className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                    <MessageSquare className="w-3 h-3" />
                                    Comentários do aluno:
                                </span>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {submission.comments}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Formulário de Correção */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                <Award className="w-4 h-4 text-purple-600" />
                                Nota *
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max={effectiveMaxScore}
                                    step="0.5"
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                    placeholder="0"
                                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                />
                                <span className="text-gray-500">
                                    de {effectiveMaxScore} pontos
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-purple-600" />
                                Feedback para o Aluno *
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Escreva um feedback construtivo para o aluno..."
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? "Salvando..." : "Salvar Correção"}
                    </button>
                </div>
            </div>
        </div>
    );
}
