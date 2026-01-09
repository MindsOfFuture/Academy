"use client";

import { useState } from "react";
import { type AssignmentSummary } from "@/lib/api/types";
import { 
    createAssignment, 
    updateAssignment, 
    deleteAssignment 
} from "@/lib/api/assignments";
import { Plus, Trash2, Edit2, Save, X, FileText } from "lucide-react";

interface AssignmentManagerProps {
    lessonId: string;
    lessonTitle: string;
    assignments: AssignmentSummary[];
    onUpdate: () => void;
}

export default function AssignmentManager({
    lessonId,
    lessonTitle,
    assignments,
    onUpdate,
}: AssignmentManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [maxScore, setMaxScore] = useState<number | "">("");

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDueDate("");
        setMaxScore("");
        setIsAdding(false);
        setEditingId(null);
    };

    const handleAdd = async () => {
        if (!title.trim()) {
            alert("Título é obrigatório!");
            return;
        }

        setLoading(true);
        try {
            await createAssignment({
                lessonId,
                title: title.trim(),
                description: description.trim() || undefined,
                dueDate: dueDate || undefined,
                maxScore: maxScore ? Number(maxScore) : undefined,
            });
            resetForm();
            onUpdate();
        } catch (error) {
            console.error("Erro ao criar atividade:", error);
            alert("Erro ao criar atividade.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (assignmentId: string) => {
        if (!title.trim()) {
            alert("Título é obrigatório!");
            return;
        }

        setLoading(true);
        try {
            await updateAssignment(assignmentId, {
                title: title.trim(),
                description: description.trim() || null,
                dueDate: dueDate || null,
                maxScore: maxScore ? Number(maxScore) : null,
            });
            resetForm();
            onUpdate();
        } catch (error) {
            console.error("Erro ao atualizar atividade:", error);
            alert("Erro ao atualizar atividade.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (assignmentId: string) => {
        if (!confirm("Deseja realmente excluir esta atividade?")) return;

        setLoading(true);
        try {
            await deleteAssignment(assignmentId);
            onUpdate();
        } catch (error) {
            console.error("Erro ao excluir atividade:", error);
            alert("Erro ao excluir atividade.");
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (assignment: AssignmentSummary) => {
        setEditingId(assignment.id);
        setTitle(assignment.title);
        setDescription(assignment.description || "");
        setDueDate(assignment.dueDate ? assignment.dueDate.split("T")[0] : "");
        setMaxScore(assignment.maxScore ?? "");
        setIsAdding(false);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Sem prazo";
        const date = new Date(dateStr);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    return (
        <div className="mt-4 ml-6 border-l-2 border-gray-200 pl-4">
            <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-gray-700">
                    Atividades da aula: {lessonTitle}
                </h4>
            </div>

            {/* Lista de atividades existentes */}
            {assignments.length > 0 && (
                <ul className="space-y-2 mb-3">
                    {assignments.map((assignment) => (
                        <li
                            key={assignment.id}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                            {editingId === assignment.id ? (
                                // Form de edição
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Título da atividade"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-sm"
                                    />
                                    <textarea
                                        placeholder="Descrição (opcional)"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-sm"
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="border rounded px-2 py-1 text-sm"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Pontuação máx."
                                            value={maxScore}
                                            onChange={(e) => setMaxScore(e.target.value ? Number(e.target.value) : "")}
                                            className="w-32 border rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdate(assignment.id)}
                                            disabled={loading}
                                            className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                                        >
                                            <Save className="w-3 h-3" />
                                            Salvar
                                        </button>
                                        <button
                                            onClick={resetForm}
                                            className="flex items-center gap-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                                        >
                                            <X className="w-3 h-3" />
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Visualização
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{assignment.title}</p>
                                        {assignment.description && (
                                            <p className="text-xs text-gray-600 mt-1">{assignment.description}</p>
                                        )}
                                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                            <span>Prazo: {formatDate(assignment.dueDate)}</span>
                                            {assignment.maxScore && (
                                                <span>Pontos: {assignment.maxScore}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => startEdit(assignment)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(assignment.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {/* Formulário de adicionar */}
            {isAdding ? (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 space-y-2">
                    <input
                        type="text"
                        placeholder="Título da atividade *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        autoFocus
                    />
                    <textarea
                        placeholder="Descrição (opcional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        rows={2}
                    />
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            placeholder="Prazo de entrega"
                        />
                        <input
                            type="number"
                            placeholder="Pontuação máxima"
                            value={maxScore}
                            onChange={(e) => setMaxScore(e.target.value ? Number(e.target.value) : "")}
                            className="w-32 border rounded px-2 py-1 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            disabled={loading}
                            className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                        >
                            <Save className="w-3 h-3" />
                            {loading ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                            onClick={resetForm}
                            className="flex items-center gap-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                        >
                            <X className="w-3 h-3" />
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar atividade
                </button>
            )}
        </div>
    );
}
