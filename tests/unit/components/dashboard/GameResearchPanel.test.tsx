import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GameResearchPanel from "@/components/dashboard/GameResearch/GameResearchPanel";

/**
 * A tela de pesquisa é a única porta pela qual a equipe lê as respostas. Se um
 * botão de período não refizer a consulta, o número na tela fica mentindo sem
 * avisar ninguém.
 */

const RESUMO = [
  {
    game_key: "cidadania-financeira",
    sessions: 12,
    sessions_concluidas: 9,
    students: 7,
    answers: 240,
    media_duracao_segundos: 615,
    media_pontuacao: 178.5,
    ultima_partida: "2026-09-14T12:00:00.000Z",
  },
];

let chamadas: URL[] = [];

function consultasDeResumo() {
  return chamadas.filter((url) => url.searchParams.get("format") === "resumo");
}

function diasPedidos(url: URL): number | null {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) return null;
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

beforeEach(() => {
  chamadas = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    chamadas.push(new URL(String(url), "http://localhost"));
    return {
      ok: true,
      status: 200,
      json: async () => ({ resumo: RESUMO }),
    } as Response;
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Painel de respostas dos jogos", () => {
  it("abre em 30 dias e mostra o período escolhido no panorama", async () => {
    render(<GameResearchPanel />);

    await waitFor(() => expect(consultasDeResumo()).toHaveLength(1));
    expect(diasPedidos(consultasDeResumo()[0])).toBe(30);

    expect(screen.getByRole("button", { name: "30 dias" })).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText(/Panorama · Últimos 30 dias/)).toBeInTheDocument();
  });

  it.each([
    ["7 dias", 7],
    ["90 dias", 90],
  ])("o botão %s refaz a consulta com o recorte certo", async (rotulo, dias) => {
    render(<GameResearchPanel />);
    await waitFor(() => expect(consultasDeResumo()).toHaveLength(1));

    fireEvent.click(screen.getByRole("button", { name: rotulo }));

    await waitFor(() => expect(consultasDeResumo()).toHaveLength(2));
    expect(diasPedidos(consultasDeResumo()[1])).toBe(dias);
    expect(screen.getByRole("button", { name: rotulo })).toHaveAttribute("aria-pressed", "true");
  });

  it("o botão Tudo consulta sem recorte de data", async () => {
    render(<GameResearchPanel />);
    await waitFor(() => expect(consultasDeResumo()).toHaveLength(1));

    fireEvent.click(screen.getByRole("button", { name: "Tudo" }));

    await waitFor(() => expect(consultasDeResumo()).toHaveLength(2));
    const semRecorte = consultasDeResumo()[1];
    expect(semRecorte.searchParams.get("from")).toBeNull();
    expect(semRecorte.searchParams.get("to")).toBeNull();
    expect(await screen.findByText(/Panorama · Todo o período/)).toBeInTheDocument();
  });

  it("marca um período por vez", async () => {
    render(<GameResearchPanel />);
    await waitFor(() => expect(consultasDeResumo()).toHaveLength(1));

    fireEvent.click(screen.getByRole("button", { name: "90 dias" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "90 dias" })).toHaveAttribute("aria-pressed", "true");
    });
    for (const outro of ["7 dias", "30 dias", "Tudo"]) {
      expect(screen.getByRole("button", { name: outro })).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("mostra os números do jogo na tabela do panorama", async () => {
    render(<GameResearchPanel />);

    expect(await screen.findByText("Cidadania Financeira")).toBeInTheDocument();
    expect(screen.getByText("240")).toBeInTheDocument();
    // 615 segundos são lidos como minutos e segundos, não como número cru.
    expect(screen.getByText("10 min 15s")).toBeInTheDocument();
  });

  it("leva o período e o jogo escolhidos para a planilha", async () => {
    render(<GameResearchPanel />);
    await waitFor(() => expect(consultasDeResumo()).toHaveLength(1));

    fireEvent.click(screen.getByRole("button", { name: "7 dias" }));
    await waitFor(() => expect(consultasDeResumo()).toHaveLength(2));

    fireEvent.change(screen.getByLabelText(/Jogo/i), { target: { value: "primeiro-passo" } });
    fireEvent.click(screen.getByRole("button", { name: /Baixar planilha/i }));

    await waitFor(() => {
      expect(chamadas.some((url) => url.searchParams.get("format") === "csv")).toBe(true);
    });
    const csv = chamadas.find((url) => url.searchParams.get("format") === "csv")!;
    expect(csv.searchParams.get("game")).toBe("primeiro-passo");
    expect(diasPedidos(csv)).toBe(7);
  });

  it("avisa quando não há partida no período escolhido", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      chamadas.push(new URL(String(url), "http://localhost"));
      return { ok: true, status: 200, json: async () => ({ resumo: [] }) } as Response;
    }));
    render(<GameResearchPanel />);

    expect(await screen.findByText(/Nenhuma partida registrada neste período/)).toBeInTheDocument();
  });
});
