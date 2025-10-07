"use client";
import { useEffect, useState } from "react";
import {
  getAlunosDoCurso,
  getAllUsers,
  insertAlunoNoCurso,
  removeAlunoDoCurso,
} from "@/components/api/students";

export default function useStudents(courseId: string) {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlunos = async () => {
    setLoading(true);
    const [lista, listaUsers] = await Promise.all([
      getAlunosDoCurso(courseId),
      getAllUsers(),
    ]);
    setAlunos(lista);
    setAlunosDisponiveis(listaUsers);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlunos();
  }, [courseId]);

  const addAluno = async (id: string) => {
    const novo = await insertAlunoNoCurso(courseId, id);
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
