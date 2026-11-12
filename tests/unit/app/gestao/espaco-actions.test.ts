import { beforeEach, describe, expect, it, vi } from "vitest";

/** Editar um encontro já lançado, e o aviso de espaço ocupado ao lançar. */

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember: async () => "coordenacao" }));

const { editarEncontro, obterEncontro, conflitosDeEspaco, conflitosDeHorario } = vi.hoisted(() => ({
  editarEncontro: vi.fn(async () => undefined),
  obterEncontro: vi.fn(async () => null),
  conflitosDeEspaco: vi.fn(async (data: string) => [
    { bolsistaId: "s1", bolsistaNome: "Sala 1", encontroId: `outro-${data}`, data, horario: "8h", modalidade: "Lego", turmaNome: null },
  ]),
  conflitosDeHorario: vi.fn(async () => []),
}));
vi.mock("@/lib/api/gestao/alocacao", async (original) => ({
  ...(await original<typeof import("@/lib/api/gestao/alocacao")>()),
  editarEncontro,
  obterEncontro,
  conflitosDeEspaco,
  conflitosDeHorario,
}));

import { conflitosEncontroAction, editarEncontroAction } from "@/app/gestao/alocacao/actions";

const ESPACO = "11111111-1111-4111-8111-111111111111";

function form(campos: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

beforeEach(() => {
  editarEncontro.mockClear();
  conflitosDeEspaco.mockClear();
});

describe("editarEncontroAction", () => {
  const encontro = { encontroId: "e1", data: "2099-01-10", inicio: "08:00", fim: "10:00", modalidade: "Lego", numeroAula: "3" };

  it("grava o encontro validado; espaço vazio tira o espaço", async () => {
    expect(await editarEncontroAction(null, form({ ...encontro, tipo: "gravacao", espacoId: ESPACO }))).toEqual({
      ok: true,
      mensagem: "Encontro atualizado.",
    });
    expect(editarEncontro).toHaveBeenLastCalledWith("e1", expect.objectContaining({ data: "2099-01-10", numeroAula: 3, tipo: "gravacao", espacoId: ESPACO }));
    await editarEncontroAction(null, form({ ...encontro, tipo: "aula", espacoId: "" }));
    expect(editarEncontro).toHaveBeenLastCalledWith("e1", expect.objectContaining({ tipo: "aula", espacoId: null }));
  });

  it("recusa tipo fora da lista, espaço que não é UUID, fim antes do início e encontro ausente, sem ir ao banco", async () => {
    const { encontroId: _, ...semId } = encontro;
    for (const campos of [
      { ...encontro, tipo: "festa" },
      { ...encontro, tipo: "aula", espacoId: "sala" },
      { ...encontro, fim: "07:00" },
      semId,
    ]) {
      expect((await editarEncontroAction(null, form(campos))).ok).toBe(false);
    }
    expect(editarEncontro).not.toHaveBeenCalled();
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
