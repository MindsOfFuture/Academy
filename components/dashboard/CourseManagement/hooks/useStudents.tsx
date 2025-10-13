"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getAlunosDoCurso,
  getAllUsers,
  insertAlunoNoCurso,
  removeAlunoDoCurso,
  UserCursoProps,
  UserSummary,
} from "@/components/api/students";

export default function useStudents(courseId: string) {
  const [alunos, setAlunos] = useState<UserCursoProps[]>([]);
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlunos = useCallback(async () => {
    setLoading(true);
    const [lista, listaUsers] = await Promise.all([
      getAlunosDoCurso(courseId),
      getAllUsers(),
    ]);
    setAlunos(lista);
    setAlunosDisponiveis(listaUsers);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchAlunos();
  }, [fetchAlunos]);

  const addAluno = async (aluno: UserSummary) => {
    const novo = await insertAlunoNoCurso(courseId, aluno.id);
    if (novo) setAlunos((prev) => [...prev, novo]);
    return novo;
  };

  const removeAluno = async (matriculaId: string) => {
    const ok = await removeAlunoDoCurso(matriculaId);
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
