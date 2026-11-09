/**
 * Tela de equipe com papéis acumulados (spec 012): cada pessoa mostra todos os
 * papéis que tem, só aparecem os botões que fazem sentido para ela e quem é
 * bolsista — inclusive da coordenação — entra na lista de bolsa. A bolsa aparece
 * sem valor em dinheiro (spec 003, alterada em 28/09/2026).
 */
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MembroEquipe } from "@/lib/api/gestao/types";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/api/gestao/feature-flags", () => ({ gestaoHabilitada: () => true }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember: async () => "coordenacao" }));
vi.mock("@/app/gestao/equipe/actions", () => {
  const acao = async () => ({ ok: true, mensagem: "" });
  return {
    buscarPessoasAction: async () => [],
    cadastrarBolsaAction: acao,
    concederPapelAction: acao,
    definirPapelAction: acao,
    desligamentoAction: acao,
    removerMembroAction: acao,
  };
});

function membro(id: string, nome: string, coordenacao: boolean, bolsista: boolean): MembroEquipe {
  return {
    userProfileId: id,
    nome,
    email: `${id}@ufjf.br`,
    coordenacao,
    bolsista,
    desligadoEm: null,
    membroDesde: "2026-09-24T00:00:00Z",
    bolsaVigente: null,
    temAlocacao: true,
  };
}

const COM_BOLSA: MembroEquipe = {
  ...membro("edu", "Edu Com Bolsa", false, true),
  bolsaVigente: { id: "b-1", modalidade: "mestrado", cargaSemanalHoras: 20, inicio: "2026-03-01", fim: "2027-02-28" },
};

const EQUIPE = [
  membro("cris", "Cris Coordenação e Bolsa", true, true),
  COM_BOLSA,
  membro("dani", "Dani Só Coordenação", true, false),
  membro("bia", "Bia Só Bolsista", false, true),
];
vi.mock("@/lib/api/gestao/equipe", () => ({ listarEquipe: async () => EQUIPE }));

const { encontrosDoMes, atividadesDoMes } = vi.hoisted(() => ({
  encontrosDoMes: vi.fn(async (_mes: string, _pessoa?: string) => [
    { encontroId: "e1", data: "2026-10-06", horario: "8h às 12h", descricao: "Lego", escolaNome: "EE A", turmaNome: null, situacao: "cumprida", horas: 4 },
  ]),
  atividadesDoMes: vi.fn(async (_mes: string, _pessoa?: string) => [{ id: "a1", nome: "Preparei o material", data: "2026-10-08" }]),
}));
vi.mock("@/lib/api/gestao/relatorio", () => ({ encontrosDoMes, atividadesDoMes }));

const SEM_PARAMS = { searchParams: Promise.resolve({}) };

import EquipePage from "@/app/gestao/equipe/page";

afterEach(() => cleanup());

function linhaDe(nome: string): HTMLElement {
  const lista = screen.getByRole("heading", { name: /Equipe ativa/ }).closest("section") as HTMLElement;
  return within(lista).getByText(nome, { exact: false }).closest("li") as HTMLElement;
}

function botoes(linha: HTMLElement): string[] {
  return within(linha)
    .getAllByRole("button")
    .map((b) => b.textContent ?? "");
}

describe("tela de equipe com papéis acumulados", () => {
  it("mostra os dois selos e oferece tirar um papel só a quem tem os dois", async () => {
    render(await EquipePage(SEM_PARAMS));

    const cris = linhaDe("Cris Coordenação e Bolsa");
    expect(within(cris).getByText("Coordenação")).toBeInTheDocument();
    expect(within(cris).getByText("Bolsista")).toBeInTheDocument();
    expect(within(cris).getByText("Sem bolsa vigente")).toBeInTheDocument();
    expect(botoes(cris)).toEqual(["Tirar papel de coordenação", "Tirar papel de bolsista", "Desligar"]);

    const dani = linhaDe("Dani Só Coordenação");
    expect(within(dani).queryByText("Bolsista")).not.toBeInTheDocument();
    expect(botoes(dani)).toEqual(["Dar papel de bolsista", "Desligar"]);

    const bia = linhaDe("Bia Só Bolsista");
    expect(botoes(bia)).toEqual(["Dar papel de coordenação", "Desligar"]);
  });

  it("põe na lista de bolsa quem é bolsista, inclusive da coordenação", async () => {
    render(await EquipePage(SEM_PARAMS));
    const lista = screen.getByRole("combobox", { name: "Bolsista" });
    const nomes = within(lista)
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(nomes).toEqual(["Escolha…", "Cris Coordenação e Bolsa", "Edu Com Bolsa", "Bia Só Bolsista"]);
  });

  it("não mostra nem pede valor em dinheiro", async () => {
    const { container } = render(await EquipePage(SEM_PARAMS));
    expect(within(linhaDe("Edu Com Bolsa")).getByText("Mestrado · 20 h/semana · até 28/02/2027")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/R\$|valor/i);
    expect(container.querySelector('[name="valorMensal"]')).toBeNull();
  });

  it("oferece adicionar alguém com os dois papéis de uma vez", async () => {
    render(await EquipePage(SEM_PARAMS));
    const papel = screen.getByRole("combobox", { name: "Papel" });
    expect(within(papel).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Bolsista",
      "Coordenação",
      "Coordenação e bolsista",
    ]);
  });

  it("só bolsista tem o link do registro; o link abre a janela do mês com encontros e atividades dele", async () => {
    // jsdom não implementa showModal.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    render(await EquipePage(SEM_PARAMS));
    expect(within(linhaDe("Bia Só Bolsista")).getByRole("link", { name: "Registro de atividades" })).toHaveAttribute("href", "?registro=bia");
    expect(within(linhaDe("Dani Só Coordenação")).queryByRole("link", { name: "Registro de atividades" })).toBeNull();
    cleanup();

    render(await EquipePage({ searchParams: Promise.resolve({ registro: "bia", mes: "2026-10" }) }));
    expect(encontrosDoMes).toHaveBeenLastCalledWith("2026-10", "bia");
    expect(atividadesDoMes).toHaveBeenLastCalledWith("2026-10", "bia");
    const janela = screen.getByRole("dialog", { name: "Registro de atividades · Bia Só Bolsista" });
    expect(within(janela).getByText(/Preparei o material/)).toBeInTheDocument();
    expect(within(janela).getByRole("link", { name: /Lego/ })).toBeInTheDocument();
    expect(within(janela).getByRole("link", { name: "Mês anterior" })).toHaveAttribute("href", "?registro=bia&mes=2026-09");
    expect(within(janela).getByRole("link", { name: "Próximo mês" })).toHaveAttribute("href", "?registro=bia&mes=2026-11");
  });

  it("não abre registro de quem não é bolsista da equipe", async () => {
    encontrosDoMes.mockClear();
    render(await EquipePage({ searchParams: Promise.resolve({ registro: "dani" }) }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(encontrosDoMes).not.toHaveBeenCalled();
  });
});
