"use client";
import { useState } from "react";
import useCourse from "@/components/dashboard/CourseManagement/hooks/useCourse";
import useStudents from "@/components/dashboard/CourseManagement/hooks/useStudents";
import { CourseProps,insertLesson } from "@/components/api/courseApi";

import CourseEditor from "@/components/dashboard/CourseManagement/CourseEditor";
import ModuleManager from "./ModuleManager";
import StudentsManager from "./StudentsManager";

type Props = {
  courseId: string;
  onBack: () => void;
  onCourseDeleted?: () => void;
  onCourseUpdated?: (course: CourseProps) => void;
};

export default function CourseDetail({ courseId, onBack, onCourseDeleted, onCourseUpdated }: Props) {
  const { course, loading, refreshCourse, updateCurso, deleteCurso, insertModule, deleteModule, deleteLesson } =
    useCourse(courseId);
  const { alunos, alunosDisponiveis, loading: loadingAlunos, addAluno, removeAluno } =
    useStudents(courseId);

  const [form, setForm] = useState({ title: "", description: "", imageUrl: "" });

  if (loading) return <p>Carregando curso...</p>;
  if (!course) return <p>Curso não encontrado.</p>;

  const handleSave = async () => {
    const updated = await updateCurso(courseId, form);
    if (updated) {
      await refreshCourse();
      onCourseUpdated?.(updated);
      alert("Curso atualizado!");
    }
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
        imageUrl={course.imageUrl}
        onChange={(f, v) => setForm((p) => ({ ...p, [f]: v }))}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <ModuleManager
        modules={course.modules || []}
        onAddModule={async (t) => {
          await insertModule({ Curso: courseId, title: t });
          refreshCourse();
        }}
        onDeleteModule={async (id) => {
          await deleteModule(id);
          refreshCourse();
        }}
        onDeleteLesson={async (id) => {
          await deleteLesson(id);
          refreshCourse();
        }}
        onAddLesson={async (moduleId, lessonData) => {
          // lessonData = { title, duration, link }
          console.log("teste")
          try {
            await insertLesson({
            //  id: moduleId, // ou "modulo" dependendo da coluna usada no banco
              modulo: moduleId,    // use um dos dois conforme o campo no Supabase
              title: lessonData.title,
              duration: lessonData.duration || 0,
              link: lessonData.link || "",
            });

            await refreshCourse();
            alert("Lição adicionada com sucesso!");
          } catch (err) {
            console.error("Erro ao adicionar lição:", err);
            alert("Falha ao adicionar lição!");
          }
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
