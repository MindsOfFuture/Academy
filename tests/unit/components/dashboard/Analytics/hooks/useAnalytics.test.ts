import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ rpc }) }));

import { useGlobalAnalytics, type DateFilter } from "@/components/dashboard/Analytics/hooks/useAnalytics";

describe("filtros temporais da telemetria global", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-02T12:00:00.000Z"));
    vi.clearAllMocks();
    rpc.mockResolvedValue({ data: { active_users: 1 }, error: null });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hasData: true, totalInteractions: 1 }),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each<[DateFilter, string]>([
    ["7d", "2026-08-26"],
    ["30d", "2026-08-03"],
    ["90d", "2026-06-04"],
    ["all", "2000-09-02"],
  ])("aplica %s aos KPIs legados e semânticos", async (filter, expectedFrom) => {
    const { result } = renderHook(() => useGlobalAnalytics(filter));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const legacyRange = rpc.mock.calls[0][1];
    expect(legacyRange.p_date_from).toContain(expectedFrom);
    expect(legacyRange.p_date_to).toContain("2026-09-02");

    const requestUrl = new URL(String(vi.mocked(fetch).mock.calls[0][0]), "http://local");
    expect(requestUrl.searchParams.get("from")).toBe(legacyRange.p_date_from);
    expect(requestUrl.searchParams.get("to")).toBe(legacyRange.p_date_to);
  });
});
