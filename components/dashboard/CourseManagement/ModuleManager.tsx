"use client";
import { useState } from "react";
import { ModuleProps, LessonProps } from "@/components/api/courseApi";

type ModuleManagerProps = {
  modules: ModuleProps[];
  onAddModule: (title: string) => void;
  onDeleteModule: (id: string) => void;
  onDeleteLesson: (id: string) => void;
  onAddLesson: (moduleId: string, lesson: Omit<LessonProps, "id">) => void; // novo
};

export default function ModuleManager({
  modules,
  onAddModule,
  onDeleteModule,
  onDeleteLesson,
  onAddLesson,
}: ModuleManagerProps) {
  const [newModule, setNewModule] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState<{ [key: string]: string }>({});
  const [newLessonDuration, setNewLessonDuration] = useState<{ [key: string]: string }>({});
  const [newLessonLink, setNewLessonLink] = useState<{ [key: string]: string }>({});

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h3 className="text-xl font-semibold mb-2">Módulos</h3>

      {modules?.map((mod) => (
        <div key={mod.id} className="border rounded p-4 bg-white shadow mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">{mod.title}</h4>
            <button
              onClick={() => onDeleteModule(mod.id)}
              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Deletar módulo
            </button>
          </div>

          {/* Lista de lições */}
          <ul className="list-disc pl-6 mt-2">
            {mod.lessons?.map((lesson: LessonProps) => (
              <li key={lesson.id} className="flex justify-between items-center mt-1">
                <span>
                  {lesson.title} – {lesson.duration} min
                </span>
                <button
                  onClick={() => onDeleteLesson(lesson.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                >
                  X
                </button>
              </li>
            ))}
            {(!mod.lessons || mod.lessons.length === 0) && (
              <li className="text-gray-400">Nenhuma lição ainda</li>
            )}
          </ul>

          {/* Adicionar nova lição */}
          <div className="mt-3 flex flex-col gap-2 border-t pt-3">
            <h5 className="text-sm font-semibold">Nova lição</h5>
            <input
              type="text"
              placeholder="Título da lição"
              value={newLessonTitle[mod.id] || ""}
              onChange={(e) =>
                setNewLessonTitle({ ...newLessonTitle, [mod.id]: e.target.value })
              }
              className="border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="Duração (min)"
              value={newLessonDuration[mod.id] || ""}
              onChange={(e) =>
                setNewLessonDuration({ ...newLessonDuration, [mod.id]: e.target.value })
              }
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Link da aula (URL)"
              value={newLessonLink[mod.id] || ""}
              onChange={(e) =>
                setNewLessonLink({ ...newLessonLink, [mod.id]: e.target.value })
              }
              className="border rounded px-2 py-1"
            />
            <button
              onClick={() => {
                const title = newLessonTitle[mod.id]?.trim();
                const duration = parseInt(newLessonDuration[mod.id] || "0");
                const link = newLessonLink[mod.id]?.trim();

                if (!title || !duration || !link) return;

                onAddLesson(mod.id, {
                  module_id: mod.id,
                  modulo: mod.id,
                  title,
                  duration,
                  link,
                });

                // limpa campos
                setNewLessonTitle({ ...newLessonTitle, [mod.id]: "" });
                setNewLessonDuration({ ...newLessonDuration, [mod.id]: "" });
                setNewLessonLink({ ...newLessonLink, [mod.id]: "" });
              }}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Adicionar lição
            </button>
          </div>
        </div>
      ))}

      {/* Adicionar novo módulo */}
      <div className="mt-6 flex gap-2">
        <input
          type="text"
          placeholder="Novo módulo"
          value={newModule}
          onChange={(e) => setNewModule(e.target.value)}
          className="border rounded px-2 py-1 w-full"
        />
        <button
          onClick={() => {
            if (!newModule.trim()) return;
            onAddModule(newModule);
            setNewModule("");
          }}
          className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
