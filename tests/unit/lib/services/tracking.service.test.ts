import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
  },
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => mockSupabase }));

import { TrackingService } from "@/lib/services/tracking.service";

const COURSE_ID = "123e4567-e89b-42d3-a456-426614174000";

function response(ok: boolean) {
  return Promise.resolve({ ok } as Response);
}

describe("TrackingService semântico", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    vi.stubGlobal("fetch", vi.fn(() => response(true)));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("não envia evento para usuário anônimo", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const service = new TrackingService();
    await service.trackLearningEvent("course_opened", { courseId: COURSE_ID });
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("envia em lote e não inclui user_id", async () => {
    const service = new TrackingService();
    await Promise.all(Array.from({ length: 10 }, () =>
      service.trackLearningEvent("course_opened", { courseId: COURSE_ID }),
    ));
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(options.body));
    expect(body.events).toHaveLength(10);
    expect(String(options.body)).not.toContain("user_id");
  });

  it("usa keepalive ao descarregar a página", async () => {
    const service = new TrackingService();
    service.init();
    await service.trackLearningEvent("course_opened", { courseId: COURSE_ID });
    window.dispatchEvent(new Event("beforeunload"));
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledWith("/api/telemetry/events", expect.objectContaining({ keepalive: true }));
    service.destroy();
  });

  it("limita retry a duas novas tentativas", async () => {
    vi.stubGlobal("fetch", vi.fn(() => response(false)));
    const service = new TrackingService();
    await service.trackLearningEvent("course_opened", { courseId: COURSE_ID });
    await vi.advanceTimersByTimeAsync(10000);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
