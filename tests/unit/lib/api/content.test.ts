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
  { key: "public_aulas_realizadas", value: "120" },
  { key: "hero1", value: "Projeto da UFJF" },
];
let extras: { key: string; value: string }[] = [];
let rpcResposta: { data: unknown; error: unknown };

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => ({
    from: () => ({ select: () => ({ in: async () => ({ data: [...CONFIG, ...extras], error: null }) }) }),
    rpc: (nome: string) => {
      expect(nome).toBe("numeros_da_home");
      return { maybeSingle: async () => rpcResposta };
    },
  }),
}));

import { getHero } from "@/lib/api/content";

describe("getHero", () => {
  it("mostra o total do banco e guarda a base à parte", async () => {
    extras = [];
    rpcResposta = { data: { escolas: 36, alunos: 1524, aulas: 130 }, error: null };
    expect(await getHero()).toEqual({
      subtitulo: "Projeto da UFJF",
      destaques: [
        { chave: "escolas", rotulo: "Escolas atendidas", mostrar: true, total: 36, base: 35 },
        { chave: "alunos", rotulo: "Alunos impactados", mostrar: true, total: 1524, base: 1499 },
        // Spec 028: sem escolha da coordenação, aulas fica fora da home.
        { chave: "aulas", rotulo: "Aulas realizadas", mostrar: false, total: 130, base: 120 },
      ],
    });
  });

  it("se o banco não calcular, mostra só a base", async () => {
    extras = [];
    rpcResposta = { data: null, error: { message: "function does not exist" } };
    expect((await getHero())?.destaques.map((d) => d.total)).toEqual([35, 1499, 120]);
  });

  it("usa o texto e a visibilidade que a coordenação gravou (spec 028)", async () => {
    extras = [
      { key: "public_home_rotulo_escolas", value: "Escolas parceiras" },
      { key: "public_home_mostrar_escolas", value: "false" },
      { key: "public_home_mostrar_aulas", value: "true" },
      { key: "public_home_rotulo_alunos", value: "   " },
    ];
    rpcResposta = { data: { escolas: 36, alunos: 1524, aulas: 130 }, error: null };
    const destaques = (await getHero())?.destaques;
    expect(destaques?.map((d) => [d.rotulo, d.mostrar])).toEqual([
      ["Escolas parceiras", false],
      ["Alunos impactados", true],
      ["Aulas realizadas", true],
    ]);
  });
});
