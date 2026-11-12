import { beforeEach, describe, expect, it, vi } from "vitest";

/** Tipo e espaço de um encontro já lançado, e o aviso de espaço ocupado ao lançar. */

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember: async () => "coordenacao" }));

const { definirTipoEspaco, conflitosDeEspaco, conflitosDeHorario } = vi.hoisted(() => ({
  definirTipoEspaco: vi.fn(async () => undefined),
  conflitosDeEspaco: vi.fn(async (data: string) => [
    { bolsistaId: "s1", bolsistaNome: "Sala 1", encontroId: `outro-${data}`, data, horario: "8h", modalidade: "Lego", turmaNome: null },
  ]),
  conflitosDeHorario: vi.fn(async () => []),
}));
vi.mock("@/lib/api/gestao/alocacao", async (original) => ({
  ...(await original<typeof import("@/lib/api/gestao/alocacao")>()),
  definirTipoEspaco,
  conflitosDeEspaco,
  conflitosDeHorario,
}));

import { conflitosEncontroAction, tipoEspacoEncontroAction } from "@/app/gestao/alocacao/actions";

const ESPACO = "11111111-1111-4111-8111-111111111111";

function form(campos: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

beforeEach(() => {
  definirTipoEspaco.mockClear();
  conflitosDeEspaco.mockClear();
});

describe("tipoEspacoEncontroAction", () => {
  it("grava tipo e espaço; espaço vazio tira o espaço", async () => {
    expect(await tipoEspacoEncontroAction(null, form({ encontroId: "e1", tipo: "gravacao", espacoId: ESPACO }))).toEqual({
      ok: true,
      mensagem: "Encontro atualizado.",
    });
    expect(definirTipoEspaco).toHaveBeenLastCalledWith("e1", "gravacao", ESPACO);
    await tipoEspacoEncontroAction(null, form({ encontroId: "e1", tipo: "aula", espacoId: "" }));
    expect(definirTipoEspaco).toHaveBeenLastCalledWith("e1", "aula", null);
  });

  it("recusa tipo fora da lista, espaço que não é UUID e encontro ausente, sem ir ao banco", async () => {
    for (const campos of [
      { encontroId: "e1", tipo: "festa", espacoId: "" },
      { encontroId: "e1", tipo: "aula", espacoId: "sala" },
      { tipo: "aula", espacoId: "" },
    ]) {
      expect((await tipoEspacoEncontroAction(null, form(campos))).ok).toBe(false);
    }
    expect(definirTipoEspaco).not.toHaveBeenCalled();
  });
});

describe("conflitosEncontroAction — espaço", () => {
  const base = { data: "2099-01-10", inicio: "08:00", fim: "10:00", modalidade: "Lego" };

  it("com espaço, confere o espaço mesmo sem equipe; sem espaço, não", async () => {
    expect(await conflitosEncontroAction(form({ ...base, espacoId: ESPACO }))).toMatchObject([
      { bolsistaNome: "Sala 1", encontroId: "outro-2099-01-10" },
    ]);
    expect(conflitosDeEspaco).toHaveBeenCalledWith("2099-01-10", "08:00", "10:00", ESPACO);
    conflitosDeEspaco.mockClear();
    expect(await conflitosEncontroAction(form(base))).toEqual([]);
    expect(conflitosDeEspaco).not.toHaveBeenCalled();
  });
});
