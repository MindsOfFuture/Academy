/**
 * Guard da rota /gestao — feature flag + autenticação + autorização.
 *
 * Ordem de defesa em profundidade:
 *   1. flag desligada  -> notFound (404)
 *   2. anônimo         -> redirect /auth?next=/gestao
 *   3. sem papel       -> notFound (404, não vaza existência)
 *   4. membro          -> renderiza indicadores vindos da fronteira lib/api/gestao
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
vi.mock("@/components/navbar/navbar", () => ({ default: () => <nav /> }));

import GestaoPage from "@/app/gestao/page";

beforeEach(() => {
  flagLigada = false;
  papelMembro = null;
  autenticado = true;
  redirectMock.mockClear();
  notFoundMock.mockClear();
  window.localStorage.clear();
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

  it("nega 404 a usuário autenticado sem papel de membro", async () => {
    flagLigada = true;
    autenticado = true;
    papelMembro = null;
    await expect(GestaoPage()).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFoundMock).toHaveBeenCalled();
  });

  it.each(["coordenacao", "bolsista"])(
    "renderiza os indicadores para o membro %s",
    async (papel) => {
      flagLigada = true;
      autenticado = true;
      papelMembro = papel as "coordenacao" | "bolsista";

      render(await GestaoPage());

      expect(screen.getByRole("heading", { name: "Gestão do projeto" })).toBeInTheDocument();
      expect(screen.getByText("Alunos participantes")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("Reservas de ônibus")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("Aulas realizadas")).toBeInTheDocument();
      expect(redirectMock).not.toHaveBeenCalled();
      expect(notFoundMock).not.toHaveBeenCalled();
    },
  );
});