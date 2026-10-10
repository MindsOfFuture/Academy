/**
 * Spec 014, decisão 6 — ao lançar um encontro, quem já está em outro no mesmo
 * horário aparece numa janela; "Revisar" volta ao formulário sem lançar e
 * "Lançar mesmo assim" lança.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const criar = vi.fn(async () => ({ ok: true, mensagem: "Encontro lançado com 1 pessoa." }));
const conferir = vi.fn(async () => [
  { bolsistaId: "bia", bolsistaNome: "Bia", encontroId: "e-1", horario: "13h às 17h", modalidade: "Lego", turmaNome: "Lego segunda" },
]);

vi.mock("@/app/gestao/alocacao/actions", () => {
  const acao = async () => ({ ok: true, mensagem: "" });
  return {
    criarEncontroAction: (...args: unknown[]) => criar(...(args as [])),
    conflitosEncontroAction: () => conferir(),
    afastamentoAction: acao,
    alocarAction: acao,
    atualizarAlocacaoAction: acao,
    cadastrarEscolaAction: acao,
    cadastrarTurmaAction: acao,
    cancelarEncontroAction: acao,
    situacaoTurmaAction: acao,
    substituirAction: acao,
  };
});

import { FormEncontro } from "@/app/gestao/alocacao/forms";

beforeAll(() => {
  // jsdom não implementa a janela nativa.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

afterEach(() => cleanup());

function preencher() {
  render(
    <FormEncontro turmas={[]} escolas={[]} pessoas={[{ id: "bia", nome: "Bia" }]} equipes={{}} dataPadrao="2026-10-05" />,
  );
  fireEvent.change(screen.getByLabelText("Início"), { target: { value: "14:00" } });
  fireEvent.change(screen.getByLabelText("Fim"), { target: { value: "16:00" } });
  fireEvent.change(screen.getByLabelText("Atividade"), { target: { value: "Lego" } });
  fireEvent.click(screen.getByLabelText("Bia"));
}

async function enviar() {
  await act(async () => {
    fireEvent.submit(screen.getByRole("button", { name: "Lançar encontro" }).closest("form")!);
  });
}

describe("aviso de horário sobreposto", () => {
  it("mostra quem e onde; Revisar não lança", async () => {
    preencher();
    await enviar();

    const janela = screen.getByRole("dialog", { hidden: true });
    expect(janela).toHaveAttribute("open");
    expect(janela).toHaveTextContent("Bia");
    expect(janela).toHaveTextContent("13h às 17h · Lego · Lego segunda");

    fireEvent.click(screen.getByRole("button", { name: "Revisar", hidden: true }));
    expect(janela).not.toHaveAttribute("open");
    expect(criar).not.toHaveBeenCalled();
  });

  it("Lançar mesmo assim lança o encontro", async () => {
    preencher();
    await enviar();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Lançar mesmo assim", hidden: true }));
    });
    expect(criar).toHaveBeenCalledTimes(1);
  });
});
