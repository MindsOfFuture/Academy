"use client";

import { useState, useEffect } from "react";
import { type LearningPathSummary, type CourseSummary } from "@/lib/api/types";
import { ArrowLeft, Plus, X, Search, GripVertical } from "lucide-react";
import { Reorder } from "framer-motion";

interface LearningPathCourseManagerProps {
    path: LearningPathSummary;
    availableCourses: CourseSummary[];
    onBack: () => void;
    onUpdate: () => void;
}

export default function LearningPathCourseManager({
    path,
    availableCourses,
    onBack,
    onUpdate,
}: LearningPathCourseManagerProps) {
    const [loading, setLoading] = useState(false);
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [courses, setCourses] = useState<CourseSummary[]>(path.courses);
    const [pathInfo, setPathInfo] = useState({ title: path.title, description: path.description });
    const [searchTerm, setSearchTerm] = useState("");

    // Atualiza cursos quando o path muda
    useEffect(() => {
        setCourses(path.courses);
        setPathInfo({ title: path.title, description: path.description });
    }, [path]);

    // Cursos que ainda não estão na trilha
    const coursesNotInPath = availableCourses.filter(
        (c) => !courses.some((pc) => pc.id === c.id)
    );

    // Filtrar cursos pela pesquisa
    const filteredCoursesNotInPath = coursesNotInPath.filter((course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddCourse = async (courseId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/learning-paths/${path.id}/courses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId }),
            });
            if (res.ok) {
                // Adiciona o curso localmente para atualização imediata
                const addedCourse = availableCourses.find(c => c.id === courseId);
                if (addedCourse) {
                    setCourses(prev => [...prev, addedCourse]);
                }
                setShowAddCourse(false);
                // Também atualiza no pai para manter sincronizado
                onUpdate();
            } else {
                alert("Erro ao adicionar curso");
            }
        } catch (error) {
            console.error("Erro ao adicionar curso:", error);
            alert("Erro ao adicionar curso");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCourse = async (courseId: string) => {
        if (!confirm("Remover este curso da trilha?")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/learning-paths/${path.id}/courses/${courseId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                // Remove localmente para atualização imediata
                setCourses(prev => prev.filter(c => c.id !== courseId));
                onUpdate();
            } else {
                alert("Erro ao remover curso");
            }
        } catch (error) {
            console.error("Erro ao remover curso:", error);
            alert("Erro ao remover curso");
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = (newOrder: CourseSummary[]) => {
        setCourses(newOrder);
    };

    const handleDragEnd = async () => {
        setLoading(true);
        await saveOrder(courses);
        setLoading(false);
    };

    const saveOrder = async (orderedCourses: CourseSummary[]) => {
        try {
            const courseOrders = orderedCourses.map((course, index) => ({
                courseId: course.id,
                order: index + 1,
            }));

            const res = await fetch(`/api/learning-paths/${path.id}/courses/reorder`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseOrders }),
            });

            if (!res.ok) {
                console.error("Erro ao salvar ordem");
                // Reverte em caso de erro
                setCourses(path.courses);
            } else {
                onUpdate();
            }
        } catch (error) {
            console.error("Erro ao salvar ordem:", error);
            setCourses(path.courses);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 relative">
            {/* Overlay de loading */}
            {loading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-600">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="font-medium">Salvando...</span>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-xl font-semibold">{pathInfo.title}</h2>
                    {pathInfo.description && (
                        <p className="text-gray-600 text-sm">{pathInfo.description}</p>
                    )}
                </div>
            </div>

            {/* Seção de cursos */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">
                        Cursos da Trilha ({courses.length})
                    </h3>
                    <button
                        onClick={() => setShowAddCourse(true)}
                        className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm"
                        disabled={loading || coursesNotInPath.length === 0}
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Curso
                    </button>
                </div>

                {/* Modal/Dropdown para adicionar curso */}
                {showAddCourse && (
                    <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-sm">Selecione um curso:</h4>
                            <button
                                onClick={() => {
                                    setShowAddCourse(false);
                                    setSearchTerm("");
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Campo de pesquisa */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Pesquisar cursos..."
                                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            />
                        </div>

                        {coursesNotInPath.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                Todos os cursos disponíveis já estão na trilha.
                            </p>
                        ) : filteredCoursesNotInPath.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                Nenhum curso encontrado para &quot;{searchTerm}&quot;.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {filteredCoursesNotInPath.map((course) => (
                                    <button
                                        key={course.id}
                                        onClick={() => {
                                            handleAddCourse(course.id);
                                            setSearchTerm("");
                                        }}
                                        className="w-full text-left p-2 border rounded hover:bg-purple-50 hover:border-purple-300 transition-colors bg-white"
                                        disabled={loading}
                                    >
                                        <span className="font-medium">{course.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Lista de cursos da trilha */}
                {courses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 border rounded-lg">
                        Nenhum curso adicionado a esta trilha.
                    </p>
                ) : (
                    <Reorder.Group
                        axis="y"
                        values={courses}
                        onReorder={handleReorder}
                        className="space-y-2"
                    >
                        {courses.map((course, index) => (
                            <Reorder.Item
                                key={course.id}
                                value={course}
                                onDragEnd={handleDragEnd}
                                className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 cursor-grab active:cursor-grabbing"
                            >
                                {/* Ícone de arrastar */}
                                <div className="text-gray-400 hover:text-gray-600">
                                    <GripVertical className="w-5 h-5" />
                                </div>

                                <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </div>

                                <div className="flex-1">
                                    <span className="font-medium text-gray-900">
                                        {course.title}
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleRemoveCourse(course.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    disabled={loading}
                                    title="Remover da trilha"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </div>

            {/* Dica */}
            <p className="text-xs text-gray-500 mt-4">
                💡 Arraste os cursos para reordenar. Eles serão exibidos nesta ordem na página de trilhas.
            </p>
        </div>
    );
}
