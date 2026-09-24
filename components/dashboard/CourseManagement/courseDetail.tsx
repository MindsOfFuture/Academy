"use client";
import { useEffect, useState } from "react";
import useCourse from "@/components/dashboard/CourseManagement/hooks/useCourse";
import useStudents from "@/components/dashboard/CourseManagement/hooks/useStudents";

import CourseEditor from "@/components/dashboard/CourseManagement/CourseEditor";
import ModuleManager from "./ModuleManager";
import StudentsManager from "./StudentsManager";
import HistoryTab from "./HistoryTab";

type Props = {
  courseId: string;
  onBack: () => void;
  onCourseDeleted?: () => void;
};

export default function CourseDetail({ courseId, onBack, onCourseDeleted }: Props) {
  const { course, loading, refreshCourse, updateCurso, deleteCurso, insertModule, insertLesson, deleteModule, deleteLesson } =
    useCourse(courseId);
  const { alunos, alunosDisponiveis, loading: loadingAlunos, certificates, progress, addAluno, removeAluno, emitCertificate } =
    useStudents(courseId);

  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", status: "", audience: "" });
  const [activeTab, setActiveTab] = useState<"content" | "history">("content");

  // Preenche formulário com dados atuais do curso
  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || "",
        description: course.description || "",
        imageUrl: course.thumbUrl || "",
        status: course.status || "draft",
        audience: course.audience || "student",
      });
    }
  }, [course]);

  if (loading) return <p>Carregando curso...</p>;
  if (!course) return <p>Curso não encontrado.</p>;

  const handleSave = async () => {
    await updateCurso(courseId, form);
    await refreshCourse();
    alert("Curso atualizado!");
  };

  const handleDelete = async () => {
    if (!confirm("Deseja realmente deletar este curso?")) return;
    const success = await deleteCurso(courseId);
    if (success) {
      alert("Curso deletado com sucesso!");
      onCourseDeleted?.();
      onBack();
    }
  };

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-gray-200" role="tablist" aria-label="Seções do curso">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "content"}
          onClick={() => setActiveTab("content")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "content"
              ? "border-[#684A97] text-[#684A97]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Conteúdo e alunos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "history"}
          onClick={() => setActiveTab("history")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "border-[#684A97] text-[#684A97]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Histórico
        </button>
      </div>

      {activeTab === "history" ? (
        <HistoryTab courseId={courseId} modules={course.modules || []} />
      ) : (
        <>
          <CourseEditor
            title={form.title}
            description={form.description}
            imageUrl={form.imageUrl}
            status={form.status}
            audience={form.audience}
            onChange={(f, v) => setForm((p) => ({ ...p, [f]: v }))}
            onSave={handleSave}
            onDelete={handleDelete}
          />

          <ModuleManager
            modules={course.modules || []}
            onAddModule={async (t) => {
              await insertModule(courseId, t);
              refreshCourse();
            }}
            onDeleteModule={async (id) => {
              await deleteModule(id);
              refreshCourse();
            }}
            onAddLesson={async (moduleId, title, description, durationMinutes, contentUrl) => {
              await insertLesson(courseId, moduleId, { title, description, durationMinutes, contentUrl });
              refreshCourse();
            }}
            onDeleteLesson={async (id) => {
              await deleteLesson(id);
              refreshCourse();
            }}
          />

          <StudentsManager
            alunos={alunos}
            alunosDisponiveis={alunosDisponiveis}
            loading={loadingAlunos}
            onAdd={addAluno}
            onRemove={removeAluno}
            certificates={certificates}
            progress={progress}
            onIssueCertificate={emitCertificate}
          />
        </>
      )}
    </div>
  );
}
