import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * Spec 014, decisão 7 — turma e escola se editam, não se apagam. Editar a turma
 * não pode mudar a escola dela: os encontros já lançados guardam a escola da
 * turma, e os dois ficariam desencontrados.
 */

const eq = vi.fn(async () => ({ error: null }));
const update = vi.fn(() => ({ eq }));
const insert = vi.fn(async () => ({ error: null }));
const from = vi.fn(() => ({ update, insert }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ schema: (nome: string) => (nome === "gestao" ? { from } : null) }),
}));

import { adicionarCurso, editarCurso, editarEscola, editarTurma } from "@/lib/api/gestao/alocacao";

describe("edição de turma e escola", () => {
  it("editar a turma muda só o nome: nem escola nem curso", async () => {
    await editarTurma("t1", "Lego tarde");
    expect(from).toHaveBeenLastCalledWith("turma");
    expect(update).toHaveBeenLastCalledWith({ nome: "Lego tarde" });
    expect(eq).toHaveBeenLastCalledWith("id", "t1");
  });

  it("curso novo vai para a turma; editar o curso não troca a turma", async () => {
    const curso = { modalidade: "Python", inicio: "2027-02-01", fim: null, nAlunos: 25 };
    await adicionarCurso("t1", curso);
    expect(from).toHaveBeenLastCalledWith("turma_curso");
    expect(insert).toHaveBeenLastCalledWith({ turma_id: "t1", modalidade: "Python", inicio: "2027-02-01", fim: null, n_alunos: 25 });
    await editarCurso("c1", { ...curso, nAlunos: 30 });
    expect(update).toHaveBeenLastCalledWith({ modalidade: "Python", inicio: "2027-02-01", fim: null, n_alunos: 30 });
    expect(eq).toHaveBeenLastCalledWith("id", "c1");
  });

  it("editar a escola atualiza nome, rede e cidade", async () => {
    await editarEscola("e1", { nome: "EE Nova", categoria: "estadual", cidade: "Juiz de Fora" });
    expect(from).toHaveBeenLastCalledWith("escola");
    expect(update).toHaveBeenLastCalledWith({ nome: "EE Nova", categoria: "estadual", cidade: "Juiz de Fora" });
  });
});
