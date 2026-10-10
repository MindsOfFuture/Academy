import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), obter: vi.fn(), escolas: vi.fn(), listar: vi.fn() }));
vi.mock("@/app/gestao/guard", () => ({ exigirMembro: mocks.guard }));
vi.mock("@/lib/api/gestao/turmas", () => ({ obterTurma: mocks.obter, listarTurmas: mocks.listar }));
vi.mock("@/lib/api/gestao/entities", () => ({ listEscolas: mocks.escolas, listReservas: vi.fn().mockResolvedValue([]) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/app/gestao/turmas/actions", () => ({ executarTurmasAction: vi.fn() }));
import TurmasPage from "@/app/gestao/turmas/page";
import PrintPage from "@/app/gestao/turmas/[id]/imprimir/[encontroId]/page";
import { ChamadaForm } from "@/app/gestao/turmas/forms";
const id = "00000000-0000-4000-8000-000000000001";
const encontro = { id, data: "2026-10-08", inicio: "08:00:00", fim: "10:00:00", titulo: "Sensores", professor: "Professor fictício", aulaId: null, realizadaEm: null };
const matricula = { id, alunoId: id, nome: "Aluno fictício", inicio: "2026-01-01", fim: null, termoStatus: "pendente" as const, certificadoEntregueEm: null };
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue("bolsista"); mocks.escolas.mockResolvedValue([{ id, nome: "Escola fictícia" }]); mocks.obter.mockResolvedValue({ nome: "Turma fictícia", semestre: "2026/2", escolaId: id, encontros: [encontro], matriculas: [matricula], equipe: [{ id, nome: "Bolsista fictício" }] }); });
describe("chamada móvel e impressão M1", () => {
  it("filtra turmas por modalidade, semestre, escola e situação sem mostrar ações de coordenação ao bolsista", async () => {
    mocks.listar.mockResolvedValue([{ id, nome: "Turma A", escolaId: id, modalidade: "LEGO", semestre: "2026/2", status: "planejada" }, { id: id.slice(0,-1)+"2", nome: "Turma B", escolaId: id, modalidade: "Python", semestre: "2026/2", status: "planejada" }]);
    render(await TurmasPage({ searchParams: Promise.resolve({ modalidade: "LEGO", semestre: "2026/2", escola: id, situacao: "planejada" }) }));
    expect(screen.getByRole("heading", { name: "Turma A" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Turma B" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar turma" })).not.toBeInTheDocument();
  });
  it("não marca ninguém presente nem confirma realização por padrão", () => {
    render(<ChamadaForm turmaId={id} encontro={encontro} matriculas={[matricula]} presencas={[]} />);
    expect(screen.getByLabelText("Presença de Aluno fictício")).toHaveValue("nao_informado");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Salvar chamada" })).toBeEnabled();
  });
  it("lista impressa contém cabeçalho e assinaturas, sem arquivos nem dados documentais", async () => {
    render(await PrintPage({ params: Promise.resolve({ id, encontroId: id }) }));
    expect(screen.getByText("Aluno fictício")).toBeInTheDocument();
    expect(screen.getByText(/Escola fictícia/)).toBeInTheDocument();
    expect(screen.getByText("Assinatura")).toBeInTheDocument();
    expect(screen.getByText(/Bolsista fictício/)).toBeInTheDocument();
    expect(screen.queryByText(/arquivo_path|conferido_por|CPF|email|\.pdf/)).not.toBeInTheDocument();
    expect(mocks.guard).toHaveBeenCalledWith(`/gestao/turmas/${id}/imprimir/${id}`);
  });
  it("não imprime encontro de outra turma por acesso direto", async () => {
    await expect(PrintPage({ params: Promise.resolve({ id, encontroId: id.slice(0,-1)+"2" }) })).rejects.toThrow("NOT_FOUND");
  });
});
