import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let caminho = "/gestao/alocacao";
vi.mock("next/navigation", () => ({ usePathname: () => caminho }));

import { Subabas } from "@/app/gestao/subabas";

const ITENS = [
  { href: "/gestao/alocacao", rotulo: "Calendário" },
  { href: "/gestao/alocacao/turmas", rotulo: "Turmas e escolas" },
  { href: "/gestao/alocacao/espacos", rotulo: "Espaços" },
];

function ativa(): string | null {
  return screen.getAllByRole("link").find((l) => l.getAttribute("aria-current") === "page")?.textContent ?? null;
}

describe("Subabas", () => {
  it("marca a subaba do endereço exato", () => {
    caminho = "/gestao/alocacao/espacos";
    render(<Subabas rotulo="Alocação" itens={ITENS} />);
    expect(ativa()).toBe("Espaços");
  });

  it("deixa o encontro aberto dentro do Calendário", () => {
    caminho = "/gestao/alocacao/11111111-1111-4111-8111-111111111111";
    render(<Subabas rotulo="Alocação" itens={ITENS} />);
    expect(ativa()).toBe("Calendário");
  });

  it("não confunde prefixo de texto com subpasta", () => {
    caminho = "/gestao/alocacaoextra";
    render(<Subabas rotulo="Alocação" itens={ITENS} />);
    expect(ativa()).toBeNull();
  });
});
