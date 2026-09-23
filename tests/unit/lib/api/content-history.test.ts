import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/tests/mocks/supabase";

let mockClient: MockSupabaseClient;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

import {
  buildContentHistorySentence,
  listContentHistory,
} from "@/lib/api/content-history";

describe("API do histórico de conteúdo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
  });

  it("mapeia a linha e descreve em português a renomeação do módulo", async () => {
    mockClient.chain.order.mockResolvedValueOnce({
      data: [{
        id: 41,
        tabela: "course_module",
        registro_id: "723e4567-e89b-42d3-a456-426614174000",
        curso_id: "523e4567-e89b-42d3-a456-426614174000",
        acao: "update",
        autor: "123e4567-e89b-42d3-a456-426614174000",
        ocorrido_em: "2026-09-23T17:02:00.000Z",
        antes: { title: "Sensores antigos", order: 1 },
        depois: { title: "Sensores", order: 1 },
        campos_alterados: ["title"],
      }],
      error: null,
    });
    mockClient.chain.in.mockResolvedValueOnce({
      data: [{
        id: "123e4567-e89b-42d3-a456-426614174000",
        full_name: "Maria",
      }],
      error: null,
    });

    const result = await listContentHistory("523e4567-e89b-42d3-a456-426614174000");

    expect(mockClient.from).toHaveBeenNthCalledWith(1, "historico_conteudo");
    expect(mockClient.from).toHaveBeenNthCalledWith(2, "user_profile");
    expect(result[0]).toMatchObject({
      id: 41,
      table: "course_module",
      recordId: "723e4567-e89b-42d3-a456-426614174000",
      authorName: "Maria",
      changedFields: ["title"],
      before: { title: "Sensores antigos" },
      after: { title: "Sensores" },
    });
    expect(buildContentHistorySentence(result[0])).toBe(
      'Maria alterou o título do módulo "Sensores" de "Sensores antigos" para "Sensores".',
    );
  });
});
