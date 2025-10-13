"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  insertCurso,
  getCursos,
  updateCurso,
  CourseProps,
} from "@/components/api/courseApi";
import CourseDetail from "@/components/dashboard/CourseManagement/courseDetail";

export default function CoursesSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseProps | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [courses, setCourses] = useState<CourseProps[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // 🔄 Atualiza lista de cursos
  const refreshCourses = async () => {
    const data = await getCursos();
    setCourses(data);
  };

  useEffect(() => {
    refreshCourses();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setEditingCourse(null);
  };

  const handleCourseUpdated = (updatedCourse: CourseProps) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
    );
  };

  // Criar ou atualizar curso
  const handleSaveCourse = async () => {
    if (!title || !description) {
      alert("Preencha título e descrição!");
      return;
    }

    if (editingCourse) {
      const updated = await updateCurso(editingCourse.id, {
        title,
        description,
        imageUrl,
      });
      if (updated) handleCourseUpdated(updated);
      else alert("Erro ao atualizar curso.");
    } else {
      const newCourse = await insertCurso({ title, description, imageUrl });
      if (newCourse) setCourses((prev) => [...prev, newCourse]);
      else alert("Erro ao criar curso.");
    }

    resetForm();
    setIsOpen(false);
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-semibold">Gerenciamento</h2>
          <p className="text-gray-600 text-sm">
            Gerencie seus cursos e módulos abaixo.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mx-auto sm:mx-0"
        >
          Criar novo curso
        </button>
      </div>

      {/* LISTAGEM DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow border overflow-hidden w-full max-w-sm"
          >
            <div className="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
              {course.imageUrl ? (
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-500">
                  {course.title[0]}
                </span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {course.description}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCourseId(course.id)}
                  className="flex-auto bg-gray-100 rounded hover:bg-gray-200 py-2"
                >
                  Gerenciar
                </button>


              </div>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <p className="text-gray-500">Nenhum curso encontrado.</p>
        )}
      </div>

      {/* MODAL DE CRIAR / EDITAR CURSO */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingCourse ? "Editar Curso" : "Novo Curso"}
            </h2>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Título do curso"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border p-2 rounded w-full"
              />
              <textarea
                placeholder="Descrição do curso"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="URL da imagem (opcional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  resetForm();
                  setIsOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCourse}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                {editingCourse ? "Salvar alterações" : "Criar Curso"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHE DO CURSO */}
      {selectedCourseId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-5xl p-6 overflow-auto max-h-[90vh]">
            <button
              onClick={async () => {
                await refreshCourses();
                setSelectedCourseId(null);
              }}
              className="mb-4 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Fechar
            </button>

            <CourseDetail
              courseId={selectedCourseId}
              onBack={async () => {
                await refreshCourses();
                setSelectedCourseId(null);
              }}
              onCourseUpdated={handleCourseUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
}
