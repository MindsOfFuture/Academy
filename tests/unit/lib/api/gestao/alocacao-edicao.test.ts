import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * Spec 014, decisão 7 — turma e escola se editam, não se apagam. Editar a turma
 * não pode mudar a escola dela: os encontros já lançados guardam a escola da
 * turma, e os dois ficariam desencontrados.
 */

const eq = vi.fn(async () => ({ error: null }));
const update = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ update }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ schema: (nome: string) => (nome === "gestao" ? { from } : null) }),
}));

import { editarEscola, editarTurma } from "@/lib/api/gestao/alocacao";

describe("edição de turma e escola", () => {
  it("editar a turma não manda a escola, mesmo que venha junto", async () => {
    const dados = { nome: "Lego tarde", modalidade: "Lego", inicio: "2026-09-01", fim: null, escolaId: "outra" };
    await editarTurma("t1", dados);
    expect(from).toHaveBeenLastCalledWith("turma");
    expect(update).toHaveBeenLastCalledWith({ nome: "Lego tarde", modalidade: "Lego", inicio: "2026-09-01", fim: null });
    expect(eq).toHaveBeenLastCalledWith("id", "t1");
  });

  it("editar a escola atualiza nome, rede e cidade", async () => {
    await editarEscola("e1", { nome: "EE Nova", categoria: "estadual", cidade: "Juiz de Fora" });
    expect(from).toHaveBeenLastCalledWith("escola");
    expect(update).toHaveBeenLastCalledWith({ nome: "EE Nova", categoria: "estadual", cidade: "Juiz de Fora" });
  });
});
