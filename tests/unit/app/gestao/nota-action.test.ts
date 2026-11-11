import { beforeEach, describe, expect, it, vi } from "vitest";

/** Nota de encerramento com link de comprovação opcional: link inválido é recusado antes do banco. */

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember: async () => "bolsista" }));

const { escreverNotaEncerramento } = vi.hoisted(() => ({ escreverNotaEncerramento: vi.fn(async () => false) }));
vi.mock("@/lib/api/gestao/alocacao", async (original) => ({
  ...(await original<typeof import("@/lib/api/gestao/alocacao")>()),
  escreverNotaEncerramento,
}));

import { escreverNotaAction } from "@/app/gestao/alocacao/actions";

const NOTA = "Turma animada, 18 alunos.";

function form(campos: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

beforeEach(() => {
  escreverNotaEncerramento.mockClear();
});

describe("escreverNotaAction — link de comprovação", () => {
  it("recusa link sem http(s), com espaço ou longo demais, sem ir ao banco", async () => {
    for (const link of ["drive.google.com/x", "https://a.org/com espaço", `https://a.org/${"x".repeat(500)}`]) {
      expect((await escreverNotaAction(null, form({ encontroId: "e1", nota: NOTA, link }))).ok).toBe(false);
    }
    expect(escreverNotaEncerramento).not.toHaveBeenCalled();
  });

  it("sem link manda null; com link manda o link sem as bordas", async () => {
    expect(await escreverNotaAction(null, form({ encontroId: "e1", nota: NOTA, link: "  " }))).toEqual({ ok: true, mensagem: "Nota salva." });
    expect(escreverNotaEncerramento).toHaveBeenLastCalledWith("e1", NOTA, null);

    await escreverNotaAction(null, form({ encontroId: "e1", nota: NOTA, link: " https://drive.google.com/x " }));
    expect(escreverNotaEncerramento).toHaveBeenLastCalledWith("e1", NOTA, "https://drive.google.com/x");
  });
});
