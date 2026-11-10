import { act, cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmar, confirmarEnvio, JanelaConfirmacao } from "@/components/ui/confirmar";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});


// Relógio fixo: o teste não pode depender de quanto a máquina demora entre abrir e clicar.
const T0 = 1_700_000_000_000;
function congelarRelogio() {
  vi.spyOn(Date, "now").mockReturnValue(T0);
}
function passarTempoDeArmar() {
  vi.spyOn(Date, "now").mockReturnValue(T0 + 1000);
}

describe("confirmar", () => {
  it("mostra a mensagem, foca em Voltar e resolve true ao confirmar", async () => {
    congelarRelogio();
    render(<JanelaConfirmacao />);
    let p!: Promise<boolean>;
    act(() => {
      p = confirmar("Apagar tudo?", { rotulo: "Apagar", destrutivo: true });
    });
    const janela = await screen.findByRole("alertdialog", { hidden: true });
    expect(janela).toHaveTextContent("Apagar tudo?");
    expect(screen.getByRole("button", { name: "Voltar", hidden: true })).toHaveFocus();
    // Clique colado na abertura (duplo clique) não confirma.
    fireEvent.click(screen.getByRole("button", { name: "Apagar", hidden: true }));
    expect(screen.getByRole("alertdialog", { hidden: true })).toHaveAttribute("open");
    passarTempoDeArmar();
    fireEvent.click(screen.getByRole("button", { name: "Apagar", hidden: true }));
    expect(await p).toBe(true);
  });

  it("Voltar resolve false", async () => {
    render(<JanelaConfirmacao />);
    let p!: Promise<boolean>;
    act(() => {
      p = confirmar("Certeza?");
    });
    fireEvent.click(await screen.findByRole("button", { name: "Voltar", hidden: true }));
    expect(await p).toBe(false);
  });

  it("fechar sem valor (Esc) resolve false", async () => {
    render(<JanelaConfirmacao />);
    let p!: Promise<boolean>;
    act(() => {
      p = confirmar("Certeza?");
    });
    const janela = await screen.findByRole("alertdialog", { hidden: true });
    (janela as HTMLDialogElement).close();
    expect(await p).toBe(false);
  });

  it("sem host resolve false", async () => {
    expect(await confirmar("Certeza?")).toBe(false);
  });
});

describe("confirmarEnvio", () => {
  function montar() {
    render(
      <>
        <JanelaConfirmacao />
        <form onSubmit={confirmarEnvio("Certeza?")} data-testid="f">
          <button type="submit" name="acao" value="x">
            Ir
          </button>
        </form>
      </>,
    );
    return screen.getByTestId("f") as HTMLFormElement;
  }

  it("barra o primeiro envio e reenvia com o submitter após confirmar", async () => {
    congelarRelogio();
    const form = montar();
    const botao = screen.getByRole("button", { name: "Ir" });
    const reenviar = vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(function (this: HTMLFormElement) {
      const ev = new Event("submit", { cancelable: true, bubbles: true });
      this.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(false); // segunda passada não é barrada
    });
    const primeiro = new Event("submit", { cancelable: true, bubbles: true });
    Object.defineProperty(primeiro, "submitter", { value: botao });
    act(() => {
      form.dispatchEvent(primeiro);
    });
    expect(primeiro.defaultPrevented).toBe(true);
    const confirmarBtn = await screen.findByRole("button", { name: "Confirmar", hidden: true });
    passarTempoDeArmar();
    fireEvent.click(confirmarBtn);
    await waitFor(() => expect(reenviar).toHaveBeenCalledWith(botao));
  });

  it("recusar não reenvia", async () => {
    const form = montar();
    const reenviar = vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(() => {});
    act(() => {
      form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
    fireEvent.click(await screen.findByRole("button", { name: "Voltar", hidden: true }));
    await new Promise((r) => setTimeout(r, 0));
    expect(reenviar).not.toHaveBeenCalled();
  });
});
