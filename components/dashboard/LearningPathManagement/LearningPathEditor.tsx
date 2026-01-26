"use client";

import { useState } from "react";

interface LearningPathEditorProps {
    initialTitle?: string;
    initialDescription?: string;
    initialAudience?: string;
    onSave: (title: string, description: string, audience: string) => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function LearningPathEditor({
    initialTitle = "",
    initialDescription = "",
    initialAudience = "student",
    onSave,
    onCancel,
    loading = false,
}: LearningPathEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [audience, setAudience] = useState(initialAudience);

    const isTeacherOnly = audience === "teacher";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Título é obrigatório");
            return;
        }
        onSave(title.trim(), description.trim(), audience);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Nome da trilha"
                    disabled={loading}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Descrição da trilha (opcional)"
                    rows={3}
                    disabled={loading}
                />
            </div>

            {/* Switch de Público-alvo */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <label className="font-medium text-gray-700">Apenas para professores</label>
                    <p className="text-sm text-gray-500">
                        {isTeacherOnly
                            ? "Esta trilha é visível apenas para professores e administradores"
                            : "Esta trilha é visível para todos os usuários"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setAudience(isTeacherOnly ? "student" : "teacher")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTeacherOnly ? "bg-purple-500" : "bg-gray-300"
                        }`}
                    disabled={loading}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTeacherOnly ? "translate-x-6" : "translate-x-1"
                            }`}
                    />
                </button>
            </div>

            <div className="flex gap-3">
                <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? "Salvando..." : "Salvar"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    disabled={loading}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}
