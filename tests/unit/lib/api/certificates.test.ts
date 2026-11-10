import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, mockAuthenticatedUser, mockQueryResponse, type MockSupabaseClient } from "@/tests/mocks/supabase";

let mockClient: MockSupabaseClient;
vi.mock("@/lib/supabase/client", () => ({ createClient: () => mockClient }));

import { checkCourseCompletion } from "@/lib/api/certificates";

const MENSAGEM = "Não foi possível verificar a conclusão do curso.";

describe("checkCourseCompletion", () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    mockAuthenticatedUser(mockClient);
    mockQueryResponse(mockClient, { id: "e1" }); // matrícula
    mockQueryResponse(mockClient, [{ id: "l1" }]); // aulas
    mockQueryResponse(mockClient, [{ lesson_id: "l1" }]); // progresso
  });

  it("sem atividades, concluir as aulas basta", async () => {
    mockQueryResponse(mockClient, []);
    expect((await checkCourseCompletion("c1")).isCompleted).toBe(true);
  });

  it("erro na consulta de atividades rejeita em vez de liberar o certificado", async () => {
    mockQueryResponse(mockClient, null, new Error("db"));
    await expect(checkCourseCompletion("c1")).rejects.toThrow(MENSAGEM);
  });

  it("erro na matrícula não vira 'não matriculado'", async () => {
    mockClient.queryResponses.length = 0;
    mockQueryResponse(mockClient, null, new Error("db"));
    await expect(checkCourseCompletion("c1")).rejects.toThrow(MENSAGEM);
  });
});
