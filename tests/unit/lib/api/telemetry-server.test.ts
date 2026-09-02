import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const mockClient = {
  auth: { getUser: vi.fn() },
  rpc: vi.fn(),
};

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

import { persistLearningEvents } from "@/lib/api/telemetry-server";

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

describe("persistLearningEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: "user-real" } } });
    mockClient.rpc.mockResolvedValue({ data: 1, error: null });
  });

  it("exige sessão autenticada", async () => {
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(persistLearningEvents(payload)).rejects.toMatchObject({ status: 401 });
    expect(mockClient.rpc).not.toHaveBeenCalled();
  });

  it("não envia user_id do cliente e mantém event_id para deduplicação", async () => {
    const spoofed = { events: [{ ...payload.events[0], userId: "user-spoofed" }] };
    await expect(persistLearningEvents(spoofed)).rejects.toThrow(/userId/);

    await persistLearningEvents(payload);
    const rpcPayload = mockClient.rpc.mock.calls[0][1];
    expect(JSON.stringify(rpcPayload)).not.toContain("user-real");
    expect(JSON.stringify(rpcPayload)).not.toContain("user_id");
    expect(JSON.stringify(rpcPayload)).toContain(payload.events[0].eventId);
  });

  it("propaga falha de persistência sem alterar o payload", async () => {
    mockClient.rpc.mockResolvedValue({ data: null, error: { message: "indisponível" } });
    await expect(persistLearningEvents(payload)).rejects.toThrow("indisponível");
  });

  it("deduplica retries por event_id e mantém a tabela append-only por RLS", () => {
    const migration = readFileSync("supabase/migrations/20260902_learning_event_telemetry.sql", "utf8");
    expect(migration).toMatch(/event_id uuid primary key/i);
    expect(migration).toMatch(/on conflict \(event_id\) do nothing/i);
    expect(migration).toMatch(/with check \(user_id = auth\.uid\(\)\)/i);
    expect(migration).toMatch(/revoke all on table public\.telemetry_learning_event from public, anon, authenticated/i);
    expect(migration).toMatch(/grant insert on table public\.telemetry_learning_event to authenticated/i);
  });
});
