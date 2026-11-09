/**
 * Troca de mês da gestão: anterior/próximo, pular pela lista, "Este mês" e as
 * setas do teclado — sempre mantendo os outros parâmetros do endereço.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { SeletorMes } from "@/app/gestao/seletor-mes";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-15T12:00:00-03:00"));
  push.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("SeletorMes", () => {
  it("anterior e próximo mantêm os outros parâmetros; 'Este mês' só fora do mês corrente", () => {
    render(<SeletorMes mes="2026-01" titulo="Relatório de" parametros={{ registro: "bia" }} />);
    expect(screen.getByRole("link", { name: "Mês anterior" })).toHaveAttribute("href", "?registro=bia&mes=2025-12");
    expect(screen.getByRole("link", { name: "Próximo mês" })).toHaveAttribute("href", "?registro=bia&mes=2026-02");
    expect(screen.getByRole("link", { name: "Este mês" })).toHaveAttribute("href", "?registro=bia&mes=2026-11");
    cleanup();

    render(<SeletorMes mes="2026-11" />);
    expect(screen.queryByRole("link", { name: "Este mês" })).toBeNull();
  });

  it("a lista pula direto para o mês escolhido e inclui um mês fora do alcance quando é ele que está aberto", () => {
    render(<SeletorMes mes="2020-03" />);
    const lista = screen.getByRole("combobox", { name: "Mês" }) as HTMLSelectElement;
    expect(lista.value).toBe("2020-03");
    expect([...lista.options].map((o) => o.value)).toContain("2027-11");
    fireEvent.change(lista, { target: { value: "2026-07" } });
    expect(push).toHaveBeenLastCalledWith("?mes=2026-07", { scroll: false });
  });

  it("as setas do teclado trocam o mês, mas não enquanto se digita num campo", () => {
    render(
      <>
        <SeletorMes mes="2026-11" />
        <input aria-label="campo" />
      </>,
    );
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(push).toHaveBeenLastCalledWith("?mes=2026-10", { scroll: false });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(push).toHaveBeenLastCalledWith("?mes=2026-12", { scroll: false });

    push.mockClear();
    fireEvent.keyDown(screen.getByLabelText("campo"), { key: "ArrowLeft" });
    expect(push).not.toHaveBeenCalled();
  });
});
