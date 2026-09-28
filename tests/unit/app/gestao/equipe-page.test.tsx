/**
 * Tela de equipe com papéis acumulados (spec 012): cada pessoa mostra todos os
 * papéis que tem, só aparecem os botões que fazem sentido para ela e quem é
 * bolsista — inclusive da coordenação — entra na lista de bolsa.
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
}));
vi.mock("@/lib/api/gestao/feature-flags", () => ({ gestaoHabilitada: () => true }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember: async () => "coordenacao" }));
vi.mock("@/app/gestao/equipe/actions", () => {
  const acao = async () => ({ ok: true, mensagem: "" });
  return {
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

const EQUIPE = [
  membro("cris", "Cris Coordenação e Bolsa", true, true),
  membro("dani", "Dani Só Coordenação", true, false),
  membro("bia", "Bia Só Bolsista", false, true),
];
vi.mock("@/lib/api/gestao/equipe", () => ({ listarEquipe: async () => EQUIPE }));

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
    render(await EquipePage());

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
    render(await EquipePage());
    const lista = screen.getByRole("combobox", { name: "Bolsista" });
    const nomes = within(lista)
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(nomes).toEqual(["Escolha…", "Cris Coordenação e Bolsa", "Bia Só Bolsista"]);
  });

  it("oferece adicionar alguém com os dois papéis de uma vez", async () => {
    render(await EquipePage());
    const papel = screen.getByRole("combobox", { name: "Papel" });
    expect(within(papel).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Bolsista",
      "Coordenação",
      "Coordenação e bolsista",
    ]);
  });
});
