import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/gestao/guard", () => ({ exigirMembro: vi.fn() }));
vi.mock("@/lib/api/gestao/testes", () => ({
  resumoTestes: async () => [{ userId: "1", nome: "Ana Silva", cpf: "52998224725", acessos: 3, ultimoAcessoEm: "2026-11-10T12:00:00Z", modulosAbertos: 4, modulosConcluidos: 3, jornadaConcluida: true }],
}));

import TestesPage from "@/app/gestao/testes/page";

describe("painel de testes", () => {
  it("mostra totais, progresso e CPF mascarado", async () => {
    render(await TestesPage());
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByText("***.982.247-**")).toBeInTheDocument();
    expect(screen.queryByText("52998224725")).not.toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("3 de 10")).toBeInTheDocument();
    expect(screen.getByText("sim")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Baixar planilha" })).toHaveAttribute("href", "/gestao/testes/csv");
  });
});
