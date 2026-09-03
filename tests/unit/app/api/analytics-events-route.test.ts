import { beforeEach, describe, expect, it, vi } from "vitest";

const { getLearningAnalytics } = vi.hoisted(() => ({ getLearningAnalytics: vi.fn() }));
vi.mock("@/lib/api/learning-analytics", () => ({ getLearningAnalytics }));

import { GET } from "@/app/api/analytics/events/route";

describe("GET /api/analytics/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLearningAnalytics.mockResolvedValue({ hasData: true, totalInteractions: 3 });
  });

  it("retorna agregados para administrador", async () => {
    const response = await GET(new Request("http://local/api/analytics/events?scope=global&from=2026-09-01T00:00:00.000Z&to=2026-09-02T00:00:00.000Z"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ totalInteractions: 3 });
    expect(getLearningAnalytics).toHaveBeenCalledWith(expect.objectContaining({ scope: "global" }));
  });

  it("nega aluno quando createAdminClient rejeita", async () => {
    getLearningAnalytics.mockRejectedValue(new Error("Acesso negado. Permissões de administrador necessárias."));
    const response = await GET(new Request("http://local/api/analytics/events?scope=global"));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Acesso negado. Permissões de administrador necessárias." });
  });

  it("responde 401 em JSON quando a requisição não está autenticada", async () => {
    // O middleware libera esta rota; o guard próprio é quem nega.
    getLearningAnalytics.mockRejectedValue(new Error("Usuário não autenticado."));

    const response = await GET(new Request("http://local/api/analytics/events?scope=global"));

    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ error: "Usuário não autenticado." });
  });

  it("rejeita escopo ou período inválido", async () => {
    const response = await GET(new Request("http://local/api/analytics/events?scope=teacher&from=ontem"));
    expect(response.status).toBe(400);
    expect(getLearningAnalytics).not.toHaveBeenCalled();
  });
});
