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
    
    const enrolledIds = new Set(lista.map(a => a.user?.id));
    const available = listaUsers.filter(u => u.id && !enrolledIds.has(u.id));
    setAlunosDisponiveis(available);
    
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchAlunos();
  }, [fetchAlunos]);

  const addAluno = async (aluno: UserInfo) => {
    if (!aluno.id) return null;
    if (alunos.some(a => a.user?.id === aluno.id)) return null;

    const novo = await addStudentToCourse(courseId, aluno.id);
    if (novo) {
      setAlunos((prev) => [...prev, novo as Aluno]);
      setAlunosDisponiveis((prev) => prev.filter(u => u.id !== aluno.id));
      // Sinalizar atualização para outras páginas via localStorage
      localStorage.setItem("courses-updated", Date.now().toString());
      window.dispatchEvent(new CustomEvent("enrollment-changed"));
    }
    return novo;
  };

  const removeAluno = async (matriculaId: string) => {
    const ok = await removeStudentFromCourse(matriculaId);
    if (ok) {
      const removedAluno = alunos.find((a) => a.id === matriculaId);
      setAlunos((prev) => prev.filter((a) => a.id !== matriculaId));
      if (removedAluno?.user) {
        setAlunosDisponiveis((prev) => [...prev, removedAluno.user!]);
      }
      // Sinalizar atualização para outras páginas via localStorage
      localStorage.setItem("courses-updated", Date.now().toString());
      window.dispatchEvent(new CustomEvent("enrollment-changed"));
    }
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
