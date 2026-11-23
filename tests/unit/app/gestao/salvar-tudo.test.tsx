import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { EstadoAcao } from "@/lib/api/gestao/types";
import { SalvarTudo, useBloco } from "@/app/gestao/alocacao/salvar-tudo";

/** Um botão salva só os blocos que mudaram, em ordem, com um aviso só. */

type Enviar = (dados: FormData) => Promise<EstadoAcao | null>;

function Bloco({ campo, inicial, ordem, nome, enviar }: { campo: string; inicial: string; ordem: number; nome?: string; enviar: Enviar }) {
  const { ref, onSubmit } = useBloco(enviar, { ordem, nome });
  return (
    <form ref={ref} onSubmit={onSubmit}>
      <label>
        {campo}
        <input name={campo} defaultValue={inicial} />
      </label>
    </form>
  );
}

function pagina(enviarA: Enviar, enviarB: Enviar) {
  render(
    <SalvarTudo>
      <Bloco campo="b" inicial="1" ordem={2} nome="Bia" enviar={enviarB} />
      <Bloco campo="a" inicial="x" ordem={1} enviar={enviarA} />
    </SalvarTudo>,
  );
}

describe("SalvarTudo", () => {
  it("sem mudança não envia nada", async () => {
    const a = vi.fn<Enviar>(), b = vi.fn<Enviar>();
    pagina(a, b);
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Nada mudou.");
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it("envia os que mudaram, na ordem, e junta os avisos; não reenvia o que já salvou", async () => {
    const ordem: string[] = [];
    const a = vi.fn<Enviar>(async (d) => (ordem.push(`a=${d.get("a")}`), { ok: true, mensagem: "A salvo." }));
    const b = vi.fn<Enviar>(async (d) => (ordem.push(`b=${d.get("b")}`), { ok: false, mensagem: "Valor inválido." }));
    pagina(a, b);
    fireEvent.change(screen.getByLabelText("b"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("a"), { target: { value: "y" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Bia: Valor inválido."));
    expect(screen.getByRole("status")).toHaveTextContent("A salvo.");
    expect(ordem).toEqual(["a=y", "b=2"]);

    // Enter num campo salva tudo de novo: só o que falhou volta a ir.
    fireEvent.submit(screen.getByLabelText("a").closest("form")!);
    await waitFor(() => expect(b).toHaveBeenCalledTimes(2));
    expect(a).toHaveBeenCalledTimes(1);
  });
});
