"use client";
import { useState } from "react";
import { ModuleProps, LessonProps } from "@/components/api/courseApi";

type ModuleManagerProps = {
  modules: ModuleProps[];
  onAddModule: (title: string) => void;
  onDeleteModule: (id: string) => void;
  onDeleteLesson: (id: string) => void;
};

export default function ModuleManager({
  modules,
  onAddModule,
  onDeleteModule,
  onDeleteLesson,
}: ModuleManagerProps) {
  const [newModule, setNewModule] = useState("");

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h3 className="text-xl font-semibold mb-2">Módulos</h3>

      {modules?.map((mod) => (
        <div key={mod.id} className="border rounded p-4 bg-white shadow mb-2">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">{mod.title}</h4>
            <button
              onClick={() => onDeleteModule(mod.id)}
              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Deletar módulo
            </button>
          </div>

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
        </div>
      ))}

      <div className="mt-4 flex gap-2">
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
