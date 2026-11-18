import { describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const schema = vi.fn((nome: string) => {
  if (nome !== "gestao") throw new Error(`schema inesperado: ${nome}`);
  return { rpc };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ schema })) }));

import { definirDestaquesDoSite } from "@/lib/api/gestao/site";

const DESTAQUES = {
  escolas: { base: 36, rotulo: "Escolas parceiras", mostrar: true },
  alunos: { base: 1520, rotulo: "Alunos impactados", mostrar: true },
  aulas: { base: 300, rotulo: "Aulas realizadas", mostrar: false },
};

describe("definirDestaquesDoSite (specs 019 e 028)", () => {
  it("chama a função do banco com números, textos e visibilidade numa chamada só", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null });
    await definirDestaquesDoSite(DESTAQUES);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("definir_destaques_do_site", {
      p_escolas: 36,
      p_alunos: 1520,
      p_aulas: 300,
      p_rotulo_escolas: "Escolas parceiras",
      p_rotulo_alunos: "Alunos impactados",
      p_rotulo_aulas: "Aulas realizadas",
      p_mostrar_escolas: true,
      p_mostrar_alunos: true,
      p_mostrar_aulas: false,
    });
  });

  it("repassa a recusa do banco", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "gestao: só a coordenação muda os números do site" } });
    await expect(definirDestaquesDoSite(DESTAQUES)).rejects.toThrow(/só a coordenação/);
  });
});
