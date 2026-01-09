"use client";
import { useState, useCallback } from "react";
import { type ModuleSummary, type LessonSummary, type AssignmentSummary } from "@/lib/api/types";
import { listLessonAssignments } from "@/lib/api/assignments";
import AssignmentManager from "./AssignmentManager";
import { ChevronDown, ChevronRight, ClipboardList } from "lucide-react";

type ModuleManagerProps = {
  modules: ModuleSummary[];
  onAddModule: (title: string) => void;
  onDeleteModule: (id: string) => void;
  onAddLesson: (moduleId: string, title: string, description?: string, durationMinutes?: number, contentUrl?: string) => void;
  onDeleteLesson: (id: string) => void;
};

export default function ModuleManager({
  modules,
  onAddModule,
  onDeleteModule,
  onAddLesson,
  onDeleteLesson,
}: ModuleManagerProps) {
  const [newModule, setNewModule] = useState("");
  // Estado para formulário de nova lição por módulo
  const [lessonForms, setLessonForms] = useState<Record<string, { title: string; description: string; duration: string; contentUrl: string }>>({});
  // Estado para expandir/colapsar atividades de cada lição
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  // Estado para armazenar atividades por lição
  const [assignmentsByLesson, setAssignmentsByLesson] = useState<Record<string, AssignmentSummary[]>>({});

  const getLessonForm = (moduleId: string) => lessonForms[moduleId] || { title: "", description: "", duration: "", contentUrl: "" };

  // Carrega atividades de uma lição específica
  const loadAssignments = useCallback(async (lessonId: string) => {
    const assignments = await listLessonAssignments(lessonId);
    setAssignmentsByLesson(prev => ({ ...prev, [lessonId]: assignments }));
  }, []);

  // Toggle expandir/colapsar atividades
  const toggleLessonExpanded = useCallback((lessonId: string) => {
    setExpandedLessons(prev => {
      const newExpanded = !prev[lessonId];
      if (newExpanded && !assignmentsByLesson[lessonId]) {
        loadAssignments(lessonId);
      }
      return { ...prev, [lessonId]: newExpanded };
    });
  }, [assignmentsByLesson, loadAssignments]);

  const updateLessonForm = (moduleId: string, field: "title" | "description" | "duration" | "contentUrl", value: string) => {
    setLessonForms((prev) => ({
      ...prev,
      [moduleId]: { ...getLessonForm(moduleId), [field]: value },
    }));
  };

  const handleAddLesson = (moduleId: string) => {
    const form = getLessonForm(moduleId);
    if (!form.title.trim()) return;
    const duration = form.duration ? parseInt(form.duration, 10) : undefined;
    const description = form.description.trim() || undefined;
    const contentUrl = form.contentUrl.trim() || undefined;
    onAddLesson(moduleId, form.title.trim(), description, duration, contentUrl);
    setLessonForms((prev) => ({ ...prev, [moduleId]: { title: "", description: "", duration: "", contentUrl: "" } }));
  };

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

          <ul className="pl-2 mt-2 space-y-2">
            {mod.lessons?.map((lesson: LessonSummary) => (
              <li key={lesson.id} className="border-l-2 border-gray-200 pl-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {lesson.title} – {lesson.durationMinutes ?? 0} min
                      </span>
                      <button
                        onClick={() => toggleLessonExpanded(lesson.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${expandedLessons[lesson.id]
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        title="Gerenciar atividades desta lição"
                      >
                        <ClipboardList className="w-3 h-3" />
                        <span>Atividades</span>
                        {expandedLessons[lesson.id] ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    {lesson.description && (
                      <span className="text-sm text-gray-500 ml-6 block">{lesson.description}</span>
                    )}
                    {lesson.contentUrl && (
                      <a
                        href={lesson.contentUrl.startsWith('http') ? lesson.contentUrl : `https://${lesson.contentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-800 ml-6 block"
                      >
                        {lesson.contentUrl}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteLesson(lesson.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                  >
                    X
                  </button>
                </div>

                {/* Gerenciador de Atividades */}
                {expandedLessons[lesson.id] && (
                  <AssignmentManager
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    assignments={assignmentsByLesson[lesson.id] || []}
                    onUpdate={() => loadAssignments(lesson.id)}
                  />
                )}
              </li>
            ))}
            {(!mod.lessons || mod.lessons.length === 0) && (
              <li className="text-gray-400 ml-6">Nenhuma lição ainda</li>
            )}
          </ul>

          {/* Formulário para adicionar lição */}
          <div className="mt-3 flex flex-col gap-2 border-t pt-3">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Título da lição"
                value={getLessonForm(mod.id).title}
                onChange={(e) => updateLessonForm(mod.id, "title", e.target.value)}
                className="border rounded px-2 py-1 flex-1"
              />
              <input
                type="number"
                placeholder="Min"
                value={getLessonForm(mod.id).duration}
                onChange={(e) => updateLessonForm(mod.id, "duration", e.target.value)}
                className="border rounded px-2 py-1 w-16"
                min={0}
              />
            </div>
            <input
              type="text"
              placeholder="Descrição da lição"
              value={getLessonForm(mod.id).description}
              onChange={(e) => updateLessonForm(mod.id, "description", e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
            <input
              type="text"
              placeholder="URL do conteúdo (vídeo, documento, etc.)"
              value={getLessonForm(mod.id).contentUrl}
              onChange={(e) => updateLessonForm(mod.id, "contentUrl", e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
            <button
              onClick={() => handleAddLesson(mod.id)}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
            >
              + Lição
            </button>
          </div>
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
