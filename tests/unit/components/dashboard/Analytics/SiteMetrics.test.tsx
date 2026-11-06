import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { SiteMetrics, SiteMetricsPanel } from "@/components/dashboard/Analytics/SiteMetrics";
import type { SiteMetrics as Dados } from "@/lib/api/site-metrics";

const EXEMPLO: Dados = {
  novosCadastros: 27,
  acessosPorProduto: [
    { rota: "/protected/modulos/educacao-financeira", usuarios: 30, acessos: 45 },
    { rota: "/protected/modulos/educacao-financeira/financity", usuarios: 2, acessos: 2 },
    { rota: "/protected/modulos/educacao-financeira/cidadania-financeira", usuarios: 1, acessos: 1 },
    { rota: "/protected/modulos/laboratorio-de-gestao", usuarios: 88, acessos: 542 },
    { rota: "/lg2", usuarios: 41, acessos: 1234 },
  ],
  lg2: {
    usuarios: 41,
    porModulo: Array.from({ length: 10 }, (_, i) => ({ modulo: i + 1, abriram: 40 - i * 2, concluiram: 30 - i * 3 })),
    jornadaConcluida: 6,
  },
};

describe("Números do site e do Laboratório de Gestão", () => {
  it("mostra cadastros, acessos por produto, os 10 módulos e a jornada", () => {
    render(<SiteMetricsPanel data={EXEMPLO} />);
    expect(screen.getByText("Novos cadastros no período").parentElement?.parentElement).toHaveTextContent("27");
    expect(screen.getByText("Jornada do Laboratório de Gestão concluída").parentElement?.parentElement).toHaveTextContent("6");
    const produto = screen.getByText("Laboratório de Gestão (página de entrada)").closest("tr")!;
    expect(within(produto).getByText("88")).toBeInTheDocument();
    expect(within(produto).getByText("542")).toBeInTheDocument();
    expect(screen.getByText("Laboratório de Gestão (módulos do app)").closest("tr")).toHaveTextContent("1.234");
    for (let n = 1; n <= 10; n += 1) expect(screen.getByText(`Módulo ${n}`)).toBeInTheDocument();
    const ultimo = within(screen.getByText("Módulo 10").closest("tr")!).getAllByRole("cell").map((c) => c.textContent);
    expect(ultimo).toEqual(["Módulo 10", "22", "3"]);
    expect(screen.getByText("Os números do Laboratório de Gestão começam a contar a partir de 06/11/2026.")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/@|[0-9a-f]{8}-[0-9a-f]{4}/);
  });

  describe("busca no período do filtro", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-11-06T12:00:00.000Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it("chama a rota com os últimos 30 dias e mostra o bloco", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => EXEMPLO });
      vi.stubGlobal("fetch", fetchMock);
      render(<SiteMetrics filter="30d" />);
      expect(await screen.findByText("Novos cadastros no período")).toBeInTheDocument();
      const url = new URL(fetchMock.mock.calls[0][0], "http://local");
      expect(url.pathname).toBe("/api/analytics/site");
      expect(url.searchParams.get("from")).toBe("2026-10-07T12:00:00.000Z");
      expect(url.searchParams.get("to")).toBe("2026-11-06T12:00:00.000Z");
    });

    it("avisa quando a rota nega", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Acesso negado." }) }));
      render(<SiteMetrics filter="7d" />);
      await waitFor(() => expect(screen.getByText("Não foi possível carregar os números do site.")).toBeInTheDocument());
    });
  });
});
