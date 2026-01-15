"use client";

import { useState, useCallback } from "react";
import { type LearningPathSummary, type CourseSummary } from "@/lib/api/types";
import LearningPathEditor from "./LearningPathEditor";
import LearningPathCourseManager from "./LearningPathCourseManager";
import { Plus, ChevronRight, Trash2, Edit2 } from "lucide-react";

interface LearningPathManagerProps {
    initialPaths: LearningPathSummary[];
    availableCourses: CourseSummary[];
}

export default function LearningPathManager({
    initialPaths,
    availableCourses,
}: LearningPathManagerProps) {
    const [paths, setPaths] = useState<LearningPathSummary[]>(initialPaths);
    const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editingPath, setEditingPath] = useState<LearningPathSummary | null>(null);
    const [loading, setLoading] = useState(false);

    const refreshPaths = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/learning-paths");
            if (res.ok) {
                const data = await res.json();
                setPaths(data);
            }
        } catch (error) {
            console.error("Erro ao atualizar trilhas:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCreate = async (title: string, description: string) => {
        setLoading(true);
        try {
            const res = await fetch("/api/learning-paths", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            });
            if (res.ok) {
                await refreshPaths();
                setIsCreating(false);
            } else {
                alert("Erro ao criar trilha");
            }
        } catch (error) {
            console.error("Erro ao criar trilha:", error);
            alert("Erro ao criar trilha");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (pathId: string, title: string, description: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/learning-paths/${pathId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            });
            if (res.ok) {
                await refreshPaths();
                setEditingPath(null);
            } else {
                alert("Erro ao atualizar trilha");
            }
        } catch (error) {
            console.error("Erro ao atualizar trilha:", error);
            alert("Erro ao atualizar trilha");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pathId: string) => {
        if (!confirm("Deseja realmente excluir esta trilha?")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/learning-paths/${pathId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await refreshPaths();
                if (selectedPathId === pathId) {
                    setSelectedPathId(null);
                }
            } else {
                alert("Erro ao excluir trilha");
            }
        } catch (error) {
            console.error("Erro ao excluir trilha:", error);
            alert("Erro ao excluir trilha");
        } finally {
            setLoading(false);
        }
    };

    const selectedPath = paths.find((p) => p.id === selectedPathId) ?? null;

    // Se uma trilha está selecionada, mostra o gerenciador de cursos
    if (selectedPath) {
        return (
            <LearningPathCourseManager
                path={selectedPath}
                availableCourses={availableCourses}
                onBack={() => setSelectedPathId(null)}
                onUpdate={refreshPaths}
            />
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold">Trilhas de Aprendizagem</h2>
                    <p className="text-gray-600 text-sm">
                        Gerencie trilhas e organize cursos em sequência
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    disabled={loading}
                >
                    <Plus className="w-4 h-4" />
                    Nova Trilha
                </button>
            </div>

            {/* Formulário de criação */}
            {isCreating && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-3">Criar Nova Trilha</h3>
                    <LearningPathEditor
                        onSave={handleCreate}
                        onCancel={() => setIsCreating(false)}
                        loading={loading}
                    />
                </div>
            )}

            {/* Formulário de edição */}
            {editingPath && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-3">Editar Trilha</h3>
                    <LearningPathEditor
                        initialTitle={editingPath.title}
                        initialDescription={editingPath.description ?? ""}
                        onSave={(title: string, description: string) =>
                            handleUpdate(editingPath.id, title, description)
                        }
                        onCancel={() => setEditingPath(null)}
                        loading={loading}
                    />
                </div>
            )}

            {/* Lista de trilhas */}
            {paths.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                    Nenhuma trilha cadastrada. Clique em &quot;Nova Trilha&quot; para começar.
                </p>
            ) : (
                <div className="space-y-3">
                    {paths.map((path) => (
                        <div
                            key={path.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div
                                className="flex-1 cursor-pointer"
                                onClick={() => setSelectedPathId(path.id)}
                            >
                                <h3 className="font-medium text-gray-900">{path.title}</h3>
                                {path.description && (
                                    <p className="text-sm text-gray-500">{path.description}</p>
                                )}
                                <p className="text-xs text-purple-600 mt-1">
                                    {path.courses.length} curso(s) vinculado(s)
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditingPath(path)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Editar trilha"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(path.id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Excluir trilha"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setSelectedPathId(path.id)}
                                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                                    title="Gerenciar cursos"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
