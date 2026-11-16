import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, mockQueryResponse, type MockSupabaseClient } from "@/tests/mocks/supabase";

let mockClient: MockSupabaseClient;
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mockClient,
  createPublicClient: () => mockClient,
}));

import { getArticleById, getArticleBySlug, getArticles } from "@/lib/api/articles";

/** Rascunho nunca aparece no site, mesmo para quem a RLS deixa ler. */
describe("artigos do site filtram só os publicados", () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  it("getArticleBySlug", async () => {
    mockQueryResponse(mockClient, { id: "1", title: "A", slug: "a" });
    expect((await getArticleBySlug("a"))?.id).toBe("1");
    expect(mockClient.chain.eq).toHaveBeenCalledWith("status", "published");
  });

  it("getArticleById", async () => {
    mockQueryResponse(mockClient, { id: "1", title: "A" });
    expect((await getArticleById("1"))?.id).toBe("1");
    expect(mockClient.chain.eq).toHaveBeenCalledWith("status", "published");
  });

  it("autor é o dos metadados do artigo, não quem o cadastrou", async () => {
    mockQueryResponse(mockClient, { id: "1", title: "A", content: "Texto do artigo.\n\n**Autores:** Ana Lima, Bia Souza\n\n**DOI:** 10.1/x" });
    expect((await getArticleBySlug("a"))?.authorName).toBe("Ana Lima, Bia Souza");
    mockQueryResponse(mockClient, { id: "2", title: "B", content: "<p>Sem bloco</p>" });
    expect((await getArticleBySlug("b"))?.authorName).toBeNull();
  });

  it("getArticles", async () => {
    mockQueryResponse(mockClient, [{ id: "1", title: "A" }]);
    expect(await getArticles()).toHaveLength(1);
    expect(mockClient.chain.eq).toHaveBeenCalledWith("status", "published");
  });
});
