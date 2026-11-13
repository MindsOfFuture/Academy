// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const usuarioMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn((destino: string) => { throw new Error(`REDIRECT:${destino}`); }));

vi.mock("@/lib/supabase/server", () => ({ usuarioDaRequisicao: usuarioMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import TestePage from "@/app/teste/page";

describe("/teste usa a conta normal do site", () => {
  beforeEach(() => vi.clearAllMocks());

  it("quem já entrou vai direto para a jornada", async () => {
    usuarioMock.mockResolvedValue("user-1");
    await expect(TestePage()).rejects.toThrow("REDIRECT:/lg2/jornada/index.html");
  });

  it("quem não entrou vai para o cadastro e volta para a jornada", async () => {
    usuarioMock.mockResolvedValue(null);
    await expect(TestePage()).rejects.toThrow("REDIRECT:/auth?next=%2Flg2%2Fjornada%2Findex.html&modo=cadastro");
  });
});
