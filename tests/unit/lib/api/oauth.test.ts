import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuthMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithOAuth: signInWithOAuthMock },
  }),
}));

import { signInWithGoogle } from "@/lib/api/oauth";

describe("signInWithGoogle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithOAuthMock.mockResolvedValue({
      data: { provider: "google", url: "https://accounts.google.test" },
      error: null,
    });
  });

  it("preserva o destino interno no callback OAuth", async () => {
    await signInWithGoogle("/protected/perfil?tab=seguranca");

    const options = signInWithOAuthMock.mock.calls[0][0];
    const callback = new URL(options.options.redirectTo);
    expect(options.provider).toBe("google");
    expect(callback.origin).toBe(window.location.origin);
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("next")).toBe(
      "/protected/perfil?tab=seguranca",
    );
  });

  it("remove destino externo do callback OAuth", async () => {
    await signInWithGoogle("https://evil.example");

    const options = signInWithOAuthMock.mock.calls[0][0];
    const callback = new URL(options.options.redirectTo);
    expect(callback.searchParams.has("next")).toBe(false);
  });
});
