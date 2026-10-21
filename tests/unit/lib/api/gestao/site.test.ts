import { describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const schema = vi.fn((nome: string) => {
  if (nome !== "gestao") throw new Error(`schema inesperado: ${nome}`);
  return { rpc };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ schema })) }));

import { definirNumerosDoSite } from "@/lib/api/gestao/site";

describe("definirNumerosDoSite (spec 019)", () => {
  it("chama a função do banco com os dois números", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null });
    await definirNumerosDoSite(36, 1520);
    expect(rpc).toHaveBeenCalledWith("definir_numeros_do_site", { p_escolas: 36, p_alunos: 1520 });
  });

  it("repassa a recusa do banco", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "gestao: só a coordenação muda os números do site" } });
    await expect(definirNumerosDoSite(1, 1)).rejects.toThrow(/só a coordenação/);
  });
});
