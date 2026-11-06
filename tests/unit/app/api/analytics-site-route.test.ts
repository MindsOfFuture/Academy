import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSiteMetrics } = vi.hoisted(() => ({ getSiteMetrics: vi.fn() }));
vi.mock("@/lib/api/site-metrics", () => ({ getSiteMetrics }));

import { GET } from "@/app/api/analytics/site/route";

describe("GET /api/analytics/site", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSiteMetrics.mockResolvedValue({ novosCadastros: 27 });
  });

  it("devolve os números para administrador", async () => {
    const response = await GET(new Request("http://local/api/analytics/site?from=2026-10-01T00:00:00.000Z&to=2026-11-01T00:00:00.000Z"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ novosCadastros: 27 });
    expect(getSiteMetrics).toHaveBeenCalledWith({ from: "2026-10-01T00:00:00.000Z", to: "2026-11-01T00:00:00.000Z" });
  });

  it("responde 401 sem sessão e 403 para quem não é administrador", async () => {
    getSiteMetrics.mockRejectedValueOnce(new Error("Usuário não autenticado."));
    expect((await GET(new Request("http://local/api/analytics/site"))).status).toBe(401);
    getSiteMetrics.mockRejectedValueOnce(new Error("Acesso negado. Permissões de administrador necessárias."));
    const negado = await GET(new Request("http://local/api/analytics/site"));
    expect(negado.status).toBe(403);
    expect(await negado.json()).toEqual({ error: "Acesso negado. Permissões de administrador necessárias." });
  });

  it("rejeita período inválido", async () => {
    expect((await GET(new Request("http://local/api/analytics/site?from=ontem"))).status).toBe(400);
    expect((await GET(new Request("http://local/api/analytics/site?from=2026-11-02T00:00:00Z&to=2026-11-01T00:00:00Z"))).status).toBe(400);
    expect(getSiteMetrics).not.toHaveBeenCalled();
  });
});
