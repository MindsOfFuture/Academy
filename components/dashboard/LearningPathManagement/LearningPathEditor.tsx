"use client";

import { useState } from "react";

interface LearningPathEditorProps {
    initialTitle?: string;
    initialDescription?: string;
    onSave: (title: string, description: string) => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function LearningPathEditor({
    initialTitle = "",
    initialDescription = "",
    onSave,
    onCancel,
    loading = false,
}: LearningPathEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Título é obrigatório");
            return;
        }
        onSave(title.trim(), description.trim());
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
