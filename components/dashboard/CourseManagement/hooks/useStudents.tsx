"use client";
import { useEffect, useState, useCallback } from "react";
import {
  listCourseStudents,
  addStudentToCourse,
  removeStudentFromCourse,
} from "@/lib/api/enrollments";
import { listUsersClient } from "@/lib/api/profiles";

interface UserInfo {
  id?: string;
  full_name?: string;
  email?: string;
}

interface Aluno {
  id: string;
  status?: string | null;
  user?: UserInfo | null;
}

export default function useStudents(courseId: string) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlunos = useCallback(async () => {
    setLoading(true);
    const [lista, listaUsers] = await Promise.all([
      listCourseStudents(courseId),
      listUsersClient(),
    ]);
    setAlunos(lista);
    setAlunosDisponiveis(listaUsers);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchAlunos();
  }, [fetchAlunos]);

  const addAluno = async (aluno: UserInfo) => {
    if (!aluno.id) return null;
    const novo = await addStudentToCourse(courseId, aluno.id);
    if (novo) setAlunos((prev) => [...prev, novo as Aluno]);
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
