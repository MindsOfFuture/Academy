"use client";
import { useEffect, useState } from "react";

type StudentsManagerProps = {
  alunos: any[];
  alunosDisponiveis: any[];
  loading: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function StudentsManager({
  alunos,
  alunosDisponiveis,
  loading,
  onAdd,
  onRemove,
}: StudentsManagerProps) {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<any[]>([]);

  useEffect(() => {
    if (!search) return setFiltered([]);
    const result = alunosDisponiveis.filter((u) =>
      (u.display_name || u.email).toLowerCase().includes(search.toLowerCase())
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
                <span>{a.User?.display_name || a.User}</span>
                <button
                  onClick={() => onRemove(a.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>

          <input
            type="text"
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-2 py-1 w-full mb-2"
          />

          {filtered.length > 0 && (
            <ul className="border rounded p-2 max-h-40 overflow-y-auto bg-white shadow">
              {filtered.map((u) => (
                <li
                  key={u.id}
                  onClick={() => {
                    onAdd(u.id);
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
        </>
      )}
    </div>
  );
}
