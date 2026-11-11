import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, mockQueryResponse, type MockSupabaseClient } from "@/tests/mocks/supabase";

let mockClient: MockSupabaseClient;
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mockClient,
  usuarioDaRequisicao: async () => "u-1",
}));

import { atualizarArtigo, criarArtigo } from "@/lib/api/gestao/artigos";

const dados = { titulo: "X", slug: "x", resumo: null, conteudo: "c", status: "draft" as const };
const duplicado = { code: "23505", message: 'duplicate key value violates unique constraint "article_slug_key"' };

describe("artigos da gestão", () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  it("criarArtigo tenta x-2 quando o endereço já existe", async () => {
    mockClient.queryResponses.push({ data: null, error: duplicado }, { data: null, error: null });
    await criarArtigo(dados, null);
    const slugs = mockClient.chain.insert.mock.calls.map((c) => c[0].slug);
    expect(slugs).toEqual(["x", "x-2"]);
  });

  it("criarArtigo lança outro erro sem repetir", async () => {
    mockClient.queryResponses.push({ data: null, error: { code: "42501", message: "row-level security" } });
    await expect(criarArtigo(dados, null)).rejects.toThrow("row-level security");
    expect(mockClient.chain.insert).toHaveBeenCalledTimes(1);
  });

  it("atualizarArtigo não envia o slug", async () => {
    mockQueryResponse(mockClient, [{ id: "a-1" }]);
    await atualizarArtigo("a-1", dados, null);
    expect(mockClient.chain.update.mock.calls[0][0]).not.toHaveProperty("slug");
  });
});
