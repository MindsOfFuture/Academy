"use client";
import { useEffect, useState } from "react";
import {
  listCourseStudents,
  addStudentToCourse,
  removeStudentFromCourse,
} from "@/lib/api/enrollments";
import { listUsersClient } from "@/lib/api/profiles";

export default function useStudents(courseId: string) {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlunos = async () => {
    setLoading(true);
    const [lista, listaUsers] = await Promise.all([
      listCourseStudents(courseId),
      listUsersClient(),
    ]);
    setAlunos(lista);
    setAlunosDisponiveis(listaUsers);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlunos();
  }, [courseId]);

  const addAluno = async (aluno: any) => {
    const novo = await addStudentToCourse(courseId, aluno.id);
    if (novo) setAlunos((prev) => [...prev, novo]);
    return novo;
  };

  const removeAluno = async (matriculaId: string) => {
    const ok = await removeStudentFromCourse(matriculaId);
    if (ok) setAlunos((prev) => prev.filter((a) => a.id !== matriculaId));
    return ok;
  };

  return {
    alunos,
    alunosDisponiveis,
    loading,
    fetchAlunos,
    addAluno,
    removeAluno,
  };
}
