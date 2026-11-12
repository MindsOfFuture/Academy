import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, mockQueryResponse, type MockSupabaseClient } from "@/tests/mocks/supabase";

let mockClient: MockSupabaseClient;
vi.mock("server-only", () => ({}));
// Exige schema("gestao"): esquecer o schema quebra o teste em vez de cair no `public`.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    schema: (nome: string) => {
      if (nome !== "gestao") throw new Error(`schema inesperado: ${nome}`);
      return { from: mockClient.from };
    },
  }),
}));

import { apagarProducao, editarReuniao, listarProducoes, listarReunioes } from "@/lib/api/gestao/pesquisa";

const reuniao = { data: "2026-11-10", participantes: "Bia", feito: "Leitura", desdobramentos: null };

describe("pesquisa da gestão", () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  it("listarProducoes filtra pelo tipo e mapeia criado_por", async () => {
    mockQueryResponse(mockClient, [
      { id: "p-1", tipo: "ebook", titulo: "T", autores: "A", data: "2026-11-01", onde: null, link: null, criado_por: "u-1" },
    ]);
    const producoes = await listarProducoes("ebook");
    expect(mockClient.from).toHaveBeenCalledWith("producao_pesquisa");
    expect(mockClient.chain.eq).toHaveBeenCalledWith("tipo", "ebook");
    expect(producoes).toEqual([
      { id: "p-1", tipo: "ebook", titulo: "T", autores: "A", data: "2026-11-01", onde: null, link: null, criadoPor: "u-1" },
    ]);
  });

  it("listarProducoes sem tipo não filtra", async () => {
    mockQueryResponse(mockClient, []);
    await listarProducoes();
    expect(mockClient.chain.eq).not.toHaveBeenCalled();
  });

  it("editarReuniao devolve false quando a RLS não deixa tocar em nenhuma linha", async () => {
    mockQueryResponse(mockClient, []);
    expect(await editarReuniao("r-1", reuniao)).toBe(false);
    expect(mockClient.chain.update).toHaveBeenCalledWith(reuniao);
    mockQueryResponse(mockClient, [{ id: "r-1" }]);
    expect(await editarReuniao("r-1", reuniao)).toBe(true);
  });

  it("apagarProducao devolve false com 0 linhas", async () => {
    mockQueryResponse(mockClient, []);
    expect(await apagarProducao("p-1")).toBe(false);
  });

  it("erro do Supabase vira exceção", async () => {
    mockQueryResponse(mockClient, null, { message: "permission denied for table reuniao_pesquisa" });
    await expect(listarReunioes()).rejects.toThrow("permission denied");
  });
});
