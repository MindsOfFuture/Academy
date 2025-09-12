"use client";

import { useEffect, useState } from "react";
import {
  getCursoCompleto,
  insertModule,
  insertLesson,
  ModuleProps,
  LessonProps,
  deleteLesson,
  deleteModule
} from "@/components/api/courseApi";

type Props = {
  courseId: string;
  onBack: () => void;
};

export default function CourseDetail({ courseId, onBack }: Props) {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States para novo módulo
  const [moduleTitle, setModuleTitle] = useState("");

  // States para nova lição
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState(""); // agora string
  const [lessonLink, setLessonLink] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getCursoCompleto(courseId);
      setCourse(data);
      setLoading(false);
    };
    fetchData();
  }, [courseId]);

  const handleAddModule = async () => {
    if (!moduleTitle.trim()) return alert("Digite um título para o módulo!");

    const newModule = await insertModule({ Curso: courseId, title: moduleTitle });
    if (newModule) {
      setCourse((prev: any) => ({
        ...prev,
        modules: [...prev.modules, { ...newModule, lessons: [] }],
      }));
      setModuleTitle("");
    }
  };

  const handleAddLesson = async () => {
    if (!selectedModule) return alert("Selecione um módulo!");
    if (!lessonTitle.trim()) return alert("Digite um título para a lição!");

    const newLesson = await insertLesson({
      modulo: selectedModule,
      title: lessonTitle,
      duration: lessonDuration, // agora string
      link: lessonLink,
    });

    if (newLesson) {
      setCourse((prev: any) => ({
        ...prev,
        modules: prev.modules.map((m: ModuleProps) =>
          m.id === selectedModule
            ? { ...m, lessons: [...(m.lessons || []), newLesson] }
            : m
        ),
      }));
      setLessonTitle("");
      setLessonDuration("");
      setLessonLink("");
    }
  };

  if (loading) return <p>Carregando curso...</p>;
  if (!course) return <p>Curso não encontrado.</p>;

  return (
    <div>

      <h2 className="text-2xl font-bold">{course.title}</h2>
      <p className="text-gray-600 mb-6">{course.description}</p>

      {/* Módulos */}
{course.modules?.map((mod: any) => (
  <div key={mod.id} className="border rounded p-4 bg-white shadow">
    <div className="flex justify-between items-center">
      <h4 className="font-semibold">{mod.title}</h4>
      <button
        onClick={async () => {
          if (!confirm("Deseja realmente deletar este módulo?")) return;
          const success = await deleteModule(mod.id);
          if (success) {
            setCourse((prev: any) => ({
              ...prev,
              modules: prev.modules.filter((m: any) => m.id !== mod.id),
            }));
          }
        }}
        className="text-red-600 hover:underline text-sm"
      >
        Deletar módulo
      </button>
    </div>

    {/* Lições */}
    <ul className="list-disc pl-6 text-sm text-gray-600 mt-2">
      {mod.lessons?.map((lesson: LessonProps) => (
        <li key={lesson.id} className="flex justify-between items-center">
          <span>{lesson.title} – {lesson.duration}</span>
          <button
            onClick={async () => {
              if (!confirm("Deseja realmente deletar esta lição?")) return;
              const success = await deleteLesson(lesson.id);
              if (success) {
                setCourse((prev: any) => ({
                  ...prev,
                  modules: prev.modules.map((m: any) =>
                    m.id === mod.id
                      ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== lesson.id) }
                      : m
                  ),
                }));
              }
            }}
            className="text-red-500 hover:underline text-xs"
          >
            Deletar
          </button>
        </li>
      ))}
      {(!mod.lessons || mod.lessons.length === 0) && (
        <li className="text-gray-400">Nenhuma lição ainda</li>
      )}
    </ul>
  </div>
))}


      {/* Adicionar módulo */}
      <div className="mt-6 flex gap-2">
        <input
          type="text"
          placeholder="Novo módulo"
          value={moduleTitle}
          onChange={(e) => setModuleTitle(e.target.value)}
          className="border rounded px-2 py-1 w-full"
        />
        <button
          onClick={handleAddModule}
          className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
        >
          Adicionar
        </button>
      </div>

      {/* Adicionar lição */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Adicionar Lição</h3>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="border rounded px-2 py-1 w-full mb-2"
        >
          <option value="">Selecione um módulo</option>
          {course.modules?.map((m: ModuleProps) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Título da lição"
          value={lessonTitle}
          onChange={(e) => setLessonTitle(e.target.value)}
          className="border rounded px-2 py-1 w-full mb-2"
        />
        <input
          type="text"
          placeholder="Duração (ex: 15 min)"
          value={lessonDuration}
          onChange={(e) => setLessonDuration(e.target.value)}
          className="border rounded px-2 py-1 w-full mb-2"
        />
        <input
          type="text"
          placeholder="Link da lição (YouTube, etc.)"
          value={lessonLink}
          onChange={(e) => setLessonLink(e.target.value)}
          className="border rounded px-2 py-1 w-full mb-2"
        />
        <button
          onClick={handleAddLesson}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          Adicionar Lição
        </button>
      </div>
    </div>
  );
}
