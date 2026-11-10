import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, mockQueryResponse, type MockSupabaseClient } from "@/tests/mocks/supabase";

let mockClient: MockSupabaseClient;
vi.mock("@/lib/supabase/client", () => ({ createClient: () => mockClient }));
vi.mock("@/lib/api/profiles", () => ({
  getCurrentUserAndRole: vi.fn().mockResolvedValue({ userId: "prof", role: "admin" }),
}));

import { fetchAllActiveChats } from "@/lib/api/activity-chat";

describe("fetchAllActiveChats", () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  it("consulta as mensagens uma vez e usa a mais recente de cada par", async () => {
    // Já vem ordenado do mais novo para o mais antigo
    mockQueryResponse(mockClient, [
      { assignment_id: "a1", student_id: "s1", content: "nova", created_at: "2026-02-01", sender_id: "s1" },
      { assignment_id: "a1", student_id: "s1", content: "velha", created_at: "2026-01-01", sender_id: "prof" },
    ]);
    mockQueryResponse(mockClient, [
      { id: "a1", title: "Ativ", lesson: { title: "Aula", course: { id: "c1", title: "Curso" } } },
    ]);
    mockQueryResponse(mockClient, [{ id: "s1", full_name: "Aluno", avatar_url: null }]);

    const grupos = await fetchAllActiveChats();

    const chamadas = mockClient.from.mock.calls.filter(([t]) => t === "activity_chat_message");
    expect(chamadas).toHaveLength(1);
    expect(grupos[0].assignments[0].students[0]).toMatchObject({
      lastMessage: "nova",
      lastMessageAt: "2026-02-01",
    });
  });
});
