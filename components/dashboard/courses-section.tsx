"use client";

import { useEffect, useState } from "react";
import { insertCurso, getCursos, CourseProps } from "@/components/api/courseApi";

export default function CoursesSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [courses, setCourses] = useState<CourseProps[]>([]);

  // Buscar cursos ao carregar
  useEffect(() => {
    const fetchCursos = async () => {
      const data = await getCursos();
      setCourses(data);
    };
    fetchCursos();
  }, []);

  const handleCreateCourse = async () => {
    if (!title || !description) {
      alert("Preencha título e descrição!");
      return;
    }

    const newCourse = await insertCurso({
      title,
      description,
      imageUrl,
    });

    if (newCourse) {
      alert("Curso criado com sucesso!");
      setIsOpen(false);
      setTitle("");
      setDescription("");
      setImageUrl("");
      setCourses((prev) => [...prev, newCourse]); // atualiza a listagem sem recarregar
    } else {
      alert("Erro ao criar curso.");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-semibold">Seus Cursos</h2>
          <p className="text-gray-600 text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mx-auto sm:mx-0"
        >
          Criar novo curso
        </button>
      </div>

      {/* LISTAGEM REAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow border overflow-hidden w-full max-w-sm"
          >
            <div className="h-40 bg-gray-100 flex items-center justify-center">
              {course.imageUrl ? (
                <img
                  src={course.imageUrl}
                  alt={course.title}
                  className="h-full w-full object-cover"
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
              <button className="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">
                Editar curso
              </button>
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <p className="text-gray-500">Nenhum curso encontrado.</p>
        )}
      </div>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Novo Curso</h2>

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
                placeholder="URL da imagem"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCourse}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
