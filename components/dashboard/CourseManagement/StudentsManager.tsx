"use client";
import { useEffect, useRef, useState } from "react";
import {
  UserCursoProps,
  UserSummary,
} from "@/components/api/students";

type StudentsManagerProps = {
  alunos: UserCursoProps[];
  alunosDisponiveis: UserSummary[];
  loading: boolean;
  onAdd: (aluno: UserSummary) => Promise<UserCursoProps | null>;
  onRemove: (id: string) => Promise<boolean>;
};

export default function StudentsManager({
  alunos,
  alunosDisponiveis,
  loading,
  onAdd,
  onRemove,
}: StudentsManagerProps) {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<UserSummary[]>([]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Fecha a lista ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setFiltered([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Atualiza a lista conforme o texto digitado
  useEffect(() => {
    if (!search) return;
    const result = alunosDisponiveis.filter((u) =>
      (u.display_name || u.email || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, alunosDisponiveis]);

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h3 className="text-xl font-semibold mb-2">Gerenciar Alunos</h3>

      {loading ? (
        <p>Carregando alunos...</p>
      ) : (
        <>
          <ul className="divide-y mb-4">
            {alunos.map((a) => (
              <li key={a.id} className="flex justify-between py-2">
                <span>{a.User?.display_name || a.User?.email}</span>
                <button
                  onClick={() => onRemove(a.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>

          <div ref={wrapperRef} className="relative">
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={() => setFiltered(alunosDisponiveis)} // mostra todos ao clicar
              className="border rounded px-2 py-1 w-full mb-2"
            />

            {filtered.length > 0 && (
              <ul className="absolute z-10 w-full border rounded p-2 max-h-40 overflow-y-auto bg-white shadow">
                {filtered.map((u) => (
                  <li
                    key={u.id}
                    onClick={() => {
                      void onAdd(u);
                      setSearch("");
                      setFiltered([]);
                    }}
                    className="py-1 px-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {u.display_name || u.email}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
