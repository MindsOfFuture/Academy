import { beforeEach, describe, expect, it, vi } from "vitest";

/** Link de comprovação pelo relatório: só o link, validado antes do banco. */

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember: async () => "bolsista" }));

const { escreverLinkComprovacao } = vi.hoisted(() => ({ escreverLinkComprovacao: vi.fn(async () => {}) }));
vi.mock("@/lib/api/gestao/relatorio", () => ({
  escreverLinkComprovacao,
  apagarAtividade: vi.fn(),
  cadastrarAtividade: vi.fn(),
  editarAtividade: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { salvarLinkEncontroAction } from "@/app/gestao/relatorio/actions";

function form(campos: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

beforeEach(() => {
  escreverLinkComprovacao.mockReset();
});

describe("salvarLinkEncontroAction", () => {
  it("recusa sem encontro e link inválido, sem ir ao banco", async () => {
    expect((await salvarLinkEncontroAction(null, form({ link: "https://a.org" }))).ok).toBe(false);
    for (const link of ["drive.google.com/x", "https://a.org/com espaço", `https://a.org/${"x".repeat(500)}`]) {
      expect((await salvarLinkEncontroAction(null, form({ encontroId: "e1", link }))).ok).toBe(false);
    }
    expect(escreverLinkComprovacao).not.toHaveBeenCalled();
  });

  it("manda o link sem as bordas; vazio vira null e apaga", async () => {
    expect(await salvarLinkEncontroAction(null, form({ encontroId: "e1", link: " https://drive.google.com/x " }))).toEqual({
      ok: true,
      mensagem: "Comprovação salva.",
    });
    expect(escreverLinkComprovacao).toHaveBeenLastCalledWith("e1", "https://drive.google.com/x", null);
    expect(revalidatePath).toHaveBeenCalledWith("/gestao/relatorio");

    await salvarLinkEncontroAction(null, form({ encontroId: "e1", link: "  " }));
    expect(escreverLinkComprovacao).toHaveBeenLastCalledWith("e1", null, null);
  });

  it("manda a foto da própria pasta e recusa caminho fora do formato", async () => {
    await salvarLinkEncontroAction(null, form({ encontroId: "e1", link: "", foto: "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg" }));
    expect(escreverLinkComprovacao).toHaveBeenLastCalledWith("e1", null, "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg");
    escreverLinkComprovacao.mockClear();
    for (const foto of ["../outro/arquivo.jpg", "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg".replace(".jpg", ".exe")]) {
      expect((await salvarLinkEncontroAction(null, form({ encontroId: "e1", foto }))).ok).toBe(false);
    }
    expect(escreverLinkComprovacao).not.toHaveBeenCalled();
  });

  it("repassa a recusa do banco", async () => {
    escreverLinkComprovacao.mockRejectedValueOnce(new Error("gestao: só quem esteve no encontro informa o link de comprovação"));
    expect(await salvarLinkEncontroAction(null, form({ encontroId: "e1", link: "https://a.org" }))).toEqual({
      ok: false,
      mensagem: "Só quem esteve no encontro informa o link de comprovação.",
    });
  });
});
