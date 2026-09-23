/**
 * Guard e conteúdo da rota /gestao — feature flag + autenticação + papel.
 *
 * Ordem de defesa em profundidade:
 *   1. flag desligada  -> notFound (404)
 *   2. anônimo         -> redirect /auth?next=/gestao
 *   3. sem papel       -> notFound (404, não vaza existência)
 *   4. membro          -> tela "Hoje"; indicadores do convênio só para a coordenação
 *   5. tela restrita   -> bolsista recebe 404 na equipe
 */
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const notFoundMock = vi.fn(() => {
  throw new Error(`NEXT_NOT_FOUND`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
  notFound: () => notFoundMock(),
}));

let flagLigada = false;
let papelMembro: "coordenacao" | "bolsista" | null = null;
let autenticado = true;

vi.mock("@/lib/api/gestao/feature-flags", () => ({
  gestaoHabilitada: () => flagLigada,
}));
vi.mock("@/lib/api/gestao/auth", () => ({
  ensureGestaoMember: async () => {
    if (!autenticado) throw new Error("Usuário não autenticado.");
    if (!papelMembro) throw new Error("Acesso negado. Apenas membros do projeto podem acessar a gestão.");
    return papelMembro;
  },
}));
vi.mock("@/lib/api/gestao/indicators", () => ({
  getIndicadores: async () => ({
    alunos: { total: 12 },
    reservasOnibus: { total: 3 },
    termos: { pendentes: 2, arquivados: 10 },
    presenca: { presentes: 5, ausentes: 1 },
    aulas: { total: 4 },
    cargaBolsistas: { items: [], totalAlocacoes: 2 },
  }),
}));
vi.mock("@/lib/api/gestao/pendencias", () => ({
  listarPendencias: async () => [
    { tipo: "aula_sem_registro", titulo: "Aula de 01/10 sem registro", detalhe: "Escola A", href: "/gestao", urgente: true },
    { tipo: "proxima_aula", titulo: "05/10 · Escola A", detalhe: "lego · 08h", href: "/gestao" },
  ],
}));
vi.mock("@/lib/api/gestao/equipe", () => ({ listarEquipe: async () => [] }));
vi.mock("@/app/gestao/equipe/forms", () => ({
  FormConcederPapel: () => <div />,
  FormBolsa: () => <div />,
  AcoesMembro: () => <div />,
}));

import GestaoPage from "@/app/gestao/page";
import EquipePage from "@/app/gestao/equipe/page";
import { abasDoPapel } from "@/app/gestao/abas";

beforeEach(() => {
  flagLigada = false;
  papelMembro = null;
  autenticado = true;
  redirectMock.mockClear();
  notFoundMock.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("rota /gestao", () => {
  it("responde 404 com a flag desligada, sem checar autenticação", async () => {
    flagLigada = false;
    await expect(GestaoPage()).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFoundMock).toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redireciona anônimo para /auth?next=/gestao quando a flag está ligada", async () => {
    flagLigada = true;
    autenticado = false;
    await expect(GestaoPage()).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith("/auth?next=%2Fgestao");
  });

  it("nega 404 a usuário autenticado sem papel de membro (ou desligado)", async () => {
    flagLigada = true;
    papelMembro = null;
    await expect(GestaoPage()).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFoundMock).toHaveBeenCalled();
  });

  it("mostra pendências e indicadores do convênio à coordenação", async () => {
    flagLigada = true;
    papelMembro = "coordenacao";
    render(await GestaoPage());
    expect(screen.getByText("Aula de 01/10 sem registro")).toBeInTheDocument();
    expect(screen.getByText("05/10 · Escola A")).toBeInTheDocument();
    expect(screen.getByText("Alunos participantes")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("mostra ao bolsista só as pendências, sem os indicadores do convênio", async () => {
    flagLigada = true;
    papelMembro = "bolsista";
    render(await GestaoPage());
    expect(screen.getByText("Aula de 01/10 sem registro")).toBeInTheDocument();
    expect(screen.queryByText("Alunos participantes")).not.toBeInTheDocument();
  });

  it("devolve 404 ao bolsista na tela de equipe", async () => {
    flagLigada = true;
    papelMembro = "bolsista";
    await expect(EquipePage()).rejects.toThrow(/NEXT_NOT_FOUND/);
  });

  it("dá a aba Equipe só à coordenação e Melhorias aos dois", () => {
    expect(abasDoPapel("coordenacao").map((a) => a.rotulo)).toEqual(["Hoje", "Equipe", "Melhorias"]);
    expect(abasDoPapel("bolsista").map((a) => a.rotulo)).toEqual(["Hoje", "Melhorias"]);
  });
});
