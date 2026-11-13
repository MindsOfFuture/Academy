import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/gestao/guard", () => ({ exigirMembro: vi.fn() }));
vi.mock("@/lib/api/gestao/testes", () => ({
  resumoTestes: async () => [{ userId: "1", nome: "Ana Silva", cpf: "52998224725", acessos: 3, ultimoAcessoEm: "2026-11-10T12:00:00Z", modulosAbertos: 4, modulosConcluidos: 3, jornadaConcluida: true },
    { userId: "2", nome: "Bruna Costa", cpf: null, acessos: 2, ultimoAcessoEm: "2026-11-12T12:00:00Z", modulosAbertos: 1, modulosConcluidos: 0, jornadaConcluida: false }],
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
    // Conta criada pelo cadastro normal: sem CPF.
    expect(screen.getByText("Bruna Costa")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Pessoas que acessaram").nextSibling).toHaveTextContent("2");
    expect(screen.getByRole("link", { name: "Baixar planilha" })).toHaveAttribute("href", "/gestao/testes/csv");
  });
});
