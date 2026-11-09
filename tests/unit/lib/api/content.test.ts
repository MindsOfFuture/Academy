import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * Números da página inicial (migration 20261108): o site mostra a base do
 * system_config mais os cadastros da gestão; o formulário da coordenação edita
 * só a base — senão cada "Salvar" somaria os cadastros de novo.
 */

const CONFIG = [
  { key: "escolas_atendidas", value: "35" },
  { key: "alunos_atendidos", value: "1499" },
  { key: "hero1", value: "Projeto da UFJF" },
];
let rpcResposta: { data: unknown; error: unknown };

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({ select: () => ({ in: async () => ({ data: CONFIG, error: null }) }) }),
    rpc: (nome: string) => {
      expect(nome).toBe("numeros_da_home");
      return { maybeSingle: async () => rpcResposta };
    },
  }),
}));

import { getHero } from "@/lib/api/content";

describe("getHero", () => {
  it("mostra o total do banco e guarda a base à parte", async () => {
    rpcResposta = { data: { escolas: 36, alunos: 1524 }, error: null };
    expect(await getHero()).toEqual({
      n_escolas: 36,
      n_alunos: 1524,
      subtitulo: "Projeto da UFJF",
      base: { escolas: 35, alunos: 1499 },
    });
  });

  it("se o banco não calcular, mostra só a base", async () => {
    rpcResposta = { data: null, error: { message: "function does not exist" } };
    expect(await getHero()).toMatchObject({ n_escolas: 35, n_alunos: 1499 });
  });
});
