"use client";
import { useEffect, useState } from "react";
import useCourse from "@/components/dashboard/CourseManagement/hooks/useCourse";
import useStudents from "@/components/dashboard/CourseManagement/hooks/useStudents";

import CourseEditor from "@/components/dashboard/CourseManagement/CourseEditor";
import ModuleManager from "./ModuleManager";
import StudentsManager from "./StudentsManager";

type Props = {
  courseId: string;
  onBack: () => void;
  onCourseDeleted?: () => void;
};

export default function CourseDetail({ courseId, onBack, onCourseDeleted }: Props) {
  const { course, loading, refreshCourse, updateCurso, deleteCurso, insertModule, insertLesson, deleteModule, deleteLesson } =
    useCourse(courseId);
  const { alunos, alunosDisponiveis, loading: loadingAlunos, addAluno, removeAluno } =
    useStudents(courseId);

  const [form, setForm] = useState({ title: "", description: "", imageUrl: "" });

  // Preenche formulário com dados atuais do curso
  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || "",
        description: course.description || "",
        imageUrl: course.thumbUrl || "",
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
      <CourseEditor
        title={course.title}
        description={course.description}
        imageUrl={course.thumbUrl || ""}
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
      />
    </div>
  );
}
