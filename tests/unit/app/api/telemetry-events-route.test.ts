import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
  auth: { getUser: vi.fn() },
  rpc: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

import { POST } from "@/app/api/telemetry/events/route";

const payload = {
  events: [{
    eventId: "123e4567-e89b-42d3-a456-426614174000",
    occurredAt: "2026-09-02T12:00:00.000Z",
    sessionId: "223e4567-e89b-42d3-a456-426614174000",
    eventName: "page_viewed",
    route: "/trilhas",
    metadata: {},
  }],
};

function postRequest(body: unknown): Request {
  return new Request("http://local/api/telemetry/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/telemetry/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: "user-real" } } });
    mockClient.rpc.mockResolvedValue({ data: 1, error: null });
  });

  it("responde 401 em JSON quando a requisição não está autenticada", async () => {
    // O middleware libera esta rota; o guard próprio é quem nega.
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(postRequest(payload));

    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ error: "Usuário não autenticado." });
    expect(mockClient.rpc).not.toHaveBeenCalled();
  });

  it("aceita lote válido de sessão autenticada com 200", async () => {
    const response = await POST(postRequest(payload));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ accepted: true, inserted: 1 });
    expect(mockClient.rpc).toHaveBeenCalledTimes(1);
  });
});
