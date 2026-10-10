/**
 * Spec 015 — adicionar pessoa à equipe escolhendo numa lista, não digitando o
 * e-mail. Prova o caminho da caixa: digitar busca, escolher preenche a pessoa
 * que vai no formulário, e voltar a digitar desfaz a escolha.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const buscar = vi.fn(async (termo: string) =>
  termo.toLowerCase().startsWith("lea")
    ? [{ id: "u-leandro", nome: "Leandro Fortunato", emailParcial: "le***@gmail.com", naEquipe: false }]
    : [],
);

vi.mock("@/app/gestao/equipe/actions", () => {
  const acao = async () => ({ ok: true, mensagem: "" });
  return {
    buscarPessoasAction: (termo: string) => buscar(termo),
    cadastrarBolsaAction: acao,
    concederPapelAction: acao,
    definirPapelAction: acao,
    desligamentoAction: acao,
    removerMembroAction: acao,
  };
});

import { FormConcederPapel } from "@/app/gestao/equipe/forms";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function pessoaEscolhida(): string {
  return (document.querySelector('input[name="userProfileId"]') as HTMLInputElement).value;
}

describe("caixa de busca de pessoa", () => {
  it("digitar mostra a lista, escolher preenche a pessoa, e redigitar desfaz", async () => {
    vi.useFakeTimers();
    render(<FormConcederPapel />);
    const campo = screen.getByRole("combobox", { name: "Pessoa" });

    fireEvent.change(campo, { target: { value: "Le" } });
    expect(screen.getByText("Digite pelo menos 3 letras.")).toBeInTheDocument();

    fireEvent.change(campo, { target: { value: "Lean" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(buscar).toHaveBeenCalledWith("Lean");

    fireEvent.keyDown(campo, { key: "Enter" });
    expect(pessoaEscolhida()).toBe("u-leandro");
    expect(campo).toHaveValue("Leandro Fortunato");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.change(campo, { target: { value: "Leandro F" } });
    expect(pessoaEscolhida()).toBe("");
  });
});
