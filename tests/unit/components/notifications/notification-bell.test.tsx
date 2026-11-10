import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

const client = vi.hoisted(() => ({
  auth: {
    onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
      cb("SIGNED_IN", { user: { id: "u1" } });
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  },
}));

vi.mock("@/lib/supabase/client", () => ({ createClient: () => client }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { NotificationBell } from "@/components/notifications/notification-bell";

function ocultar(valor: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, value: valor });
}

describe("NotificationBell polling", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ count: 0 }) });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    ocultar(false);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("não consulta com a aba oculta e retoma ao voltar", async () => {
    ocultar(true);
    render(React.createElement(NotificationBell));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(fetchMock).not.toHaveBeenCalled();

    ocultar(false);
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
