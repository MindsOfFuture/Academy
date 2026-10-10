import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * Spec 016 — aviso por e-mail. Cancelamento vai para quem ainda está no
 * encontro (não para substituído nem retirado), com o motivo; aviso que falha
 * não derruba a ação.
 */

const enviar = vi.fn(async () => {});
vi.mock("@/lib/email/resend", () => ({ sendNotificationEmail: (...a: unknown[]) => enviar(...(a as [])) }));

const encontro = {
  id: "e1",
  data: "2026-10-05",
  horario: "13h às 17h",
  modalidade: "Lego",
  turmaNome: "Lego segunda",
  escolaNome: "EE Teste",
  motivoCancelamento: "chuva <forte>",
  alocacoes: [
    { bolsistaId: "bia", situacao: "prevista" },
    { bolsistaId: "caio", situacao: "substituida" },
    { bolsistaId: "duda", situacao: "cumprida" },
  ],
};
const obterEncontro = vi.fn(async () => encontro);
vi.mock("@/lib/api/gestao/alocacao", () => ({ obterEncontro: () => obterEncontro() }));
vi.mock("@/lib/api/gestao/equipe", () => ({
  listarEquipe: async () => [
    { userProfileId: "bia", email: "bia@ufjf.br" },
    { userProfileId: "caio", email: "caio@ufjf.br" },
    { userProfileId: "duda", email: "" },
  ],
}));

import { avisar } from "@/lib/api/gestao/avisos";

describe("avisos por e-mail", () => {
  beforeEach(() => enviar.mockClear());

  it("cancelamento vai para quem está no encontro e tem e-mail, com o motivo escapado", async () => {
    await avisar("cancelado", "e1", "equipe");
    expect(enviar).toHaveBeenCalledTimes(1);
    const [para, assunto, html] = enviar.mock.calls[0] as unknown as [string, string, string];
    expect(para).toBe("bia@ufjf.br");
    expect(assunto).toBe("Encontro cancelado: 05/10 · 13h às 17h · Lego · Lego segunda · EE Teste");
    expect(html).toContain("Motivo: chuva &#60;forte&#62;");
    expect(html).toContain("/gestao/encontro/e1");
  });

  it("falha ao montar o aviso não lança", async () => {
    obterEncontro.mockRejectedValueOnce(new Error("sem rede"));
    await expect(avisar("alocado", "e1", ["bia"])).resolves.toBeUndefined();
    expect(enviar).not.toHaveBeenCalled();
  });
});
