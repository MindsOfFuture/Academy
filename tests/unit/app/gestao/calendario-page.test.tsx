import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/** Calendário do bolsista: "Só os meus" por padrão, "Equipe toda" só para ver; exportar leva os próprios. */

vi.mock("server-only", () => ({}));
vi.mock("@/app/gestao/guard", () => ({ exigirMembro: async () => "bolsista" }));
vi.mock("@/app/gestao/seletor-mes", () => ({ SeletorMes: () => <div /> }));

const encontro = (id: string, modalidade: string, minha: boolean) => ({
  id,
  data: "2026-11-18",
  horario: "14h às 17h",
  modalidade,
  tipo: "aula" as const,
  numeroAula: null,
  escolaNome: "Escola Exemplo",
  turmaNome: null,
  espacoNome: null,
  cancelado: false,
  concluido: false,
  equipe: ["Ana Souza", "Caio Lima"],
  minha,
});
vi.mock("@/lib/api/gestao/alocacao", () => ({
  calendarioDaEquipe: async () => [encontro("meu", "Lego", true), encontro("do-caio", "Python", false)],
  listarEspacos: async () => [],
}));
vi.mock("@/lib/api/gestao/relatorio", () => ({ colegasDaEquipe: async () => [] }));
vi.mock("@/app/gestao/calendario/actions", () => ({ criarEncontroDoBolsistaAction: async () => ({ ok: true, mensagem: "" }) }));

import CalendarioPage from "@/app/gestao/calendario/page";

afterEach(cleanup);

describe("calendário do bolsista", () => {
  it("por padrão mostra só os próprios encontros, que abrem a página do encontro", async () => {
    render(await CalendarioPage({ searchParams: Promise.resolve({ mes: "2026-11" }) }));
    expect(screen.getByRole("link", { name: "Só os meus" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText(/Python/)).not.toBeInTheDocument();
    const lego = screen.getAllByRole("link", { name: /Lego/ });
    expect(lego[0]).toHaveAttribute("href", "/gestao/encontro/meu");
    expect(screen.getByRole("link", { name: "Exportar para o Google Agenda" })).toHaveAttribute(
      "href",
      "/gestao/calendario/exportar?mes=2026-11&meus=1",
    );
  });

  it("equipe toda mostra os dos colegas, sem link para abrir", async () => {
    render(await CalendarioPage({ searchParams: Promise.resolve({ mes: "2026-11", ver: "equipe" }) }));
    expect(screen.getByRole("link", { name: "Equipe toda" })).toHaveAttribute("aria-current", "page");
    const python = screen.getAllByText(/Python/)[0];
    expect(python.closest("a")).toBeNull();
    expect(within(python.parentElement as HTMLElement).getByText("Ana, Caio")).toBeInTheDocument();
  });
});
