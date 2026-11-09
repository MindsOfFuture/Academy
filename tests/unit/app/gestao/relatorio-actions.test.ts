import { beforeEach, describe, expect, it, vi } from "vitest";

/** Editar e apagar atividade do relatório: mês fechado é recusado antes do banco, que confere de novo. */

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember: async () => "bolsista" }));

const { editarAtividade, apagarAtividade } = vi.hoisted(() => ({
  editarAtividade: vi.fn(async () => {}),
  apagarAtividade: vi.fn(async () => {}),
}));
vi.mock("@/lib/api/gestao/relatorio", async (original) => ({
  ...(await original<typeof import("@/lib/api/gestao/relatorio")>()),
  editarAtividade,
  apagarAtividade,
}));

import { apagarAtividadeAction, editarAtividadeAction } from "@/app/gestao/relatorio/actions";
import { mesCorrente } from "@/app/gestao/alocacao/rotulos";

function form(campos: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

beforeEach(() => {
  editarAtividade.mockClear();
  apagarAtividade.mockReset();
});

describe("ações das atividades do relatório", () => {
  it("edita com data do mês aberto", async () => {
    const data = `${mesCorrente()}-01`;
    expect(await editarAtividadeAction(null, form({ id: "a1", nome: "Reunião", data }))).toEqual({ ok: true, mensagem: "Atividade atualizada." });
    expect(editarAtividade).toHaveBeenCalledWith("a1", { nome: "Reunião", data, comprovacao: null });
  });

  it("recusa levar a atividade para um mês que já terminou, sem ir ao banco", async () => {
    const estado = await editarAtividadeAction(null, form({ id: "a1", nome: "Reunião", data: "2020-01-10" }));
    expect(estado.ok).toBe(false);
    expect(editarAtividade).not.toHaveBeenCalled();
  });

  it("traduz a recusa do banco ao apagar atividade de mês fechado", async () => {
    apagarAtividade.mockRejectedValueOnce(new Error("gestao: atividade não encontrada ou de mês já encerrado"));
    expect(await apagarAtividadeAction(null, form({ id: "a1" }))).toEqual({
      ok: false,
      mensagem: "Atividade não encontrada ou de mês já encerrado.",
    });
  });
});
