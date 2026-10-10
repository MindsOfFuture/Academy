import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/app/gestao/turmas/actions", () => ({ executarTurmasAction: vi.fn() }));
import { ChamadaForm, ImportacaoForm, ImprimirBotao } from "@/app/gestao/turmas/forms";
const id="00000000-0000-4000-8000-000000000001";
describe("formulários de chamada e revisão", () => {
  it("começa com 30 alunos não informados e sem comprovação inventada", () => {
    const matriculas = Array.from({ length: 30 }, (_,i) => ({ id: String(i), alunoId: `00000000-0000-4000-8000-${String(i+10).padStart(12,"0")}`, nome: `Aluno fictício ${i+1}`, inicio: "2026-01-01", fim: null, termoStatus: "pendente" as const, certificadoEntregueEm: null }));
    render(<ChamadaForm turmaId={id} encontro={{ id, data: "2026-10-08", titulo: "Sensores", inicio: "08:00", fim: "10:00", professor: null, aulaId: null, realizadaEm: null }} matriculas={matriculas} presencas={[]} />);
    expect(screen.getAllByRole("combobox")).toHaveLength(30);
    for (const select of screen.getAllByRole("combobox")) expect(select).toHaveValue("nao_informado");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: /Marcar todos como presentes/ }));
    for (const select of screen.getAllByRole("combobox")) expect(select).toHaveValue("presente");
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "ausente" } });
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("ausente");
  });
  it("não disponibiliza confirmação de importação antes da prévia revisada", () => {
    render(<ImportacaoForm turmaId={id} alunos={[{ id, nome: "Aluno fictício" }]} />);
    expect(screen.queryByRole("button", { name: "Confirmar importação" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Vínculos em formato de revisão" }), { target: { value: JSON.stringify([{ origemLinha: "A1", alunoId: id }]) } });
    fireEvent.click(screen.getByRole("button", { name: "Preparar revisão (não grava)" }));
    expect(screen.getByRole("button", { name: "Confirmar importação" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    fireEvent.change(screen.getByRole("textbox", { name: "Vínculos em formato de revisão" }), { target: { value: "[]" } });
    expect(screen.queryByRole("button", { name: "Confirmar importação" })).not.toBeInTheDocument();
  });
  it("impressão usa a função nativa", () => {
    const print = vi.spyOn(window,"print").mockImplementation(() => {});
    render(<ImprimirBotao />); fireEvent.click(screen.getByRole("button",{name:"Imprimir lista"})); expect(print).toHaveBeenCalledOnce();
  });
});
