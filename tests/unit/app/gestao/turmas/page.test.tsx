import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), obter: vi.fn(), escolas: vi.fn(), alunos: vi.fn(), equipe: vi.fn() }));
vi.mock("@/app/gestao/guard", () => ({ exigirMembro: mocks.guard }));
vi.mock("@/lib/api/gestao/turmas", () => ({ obterTurma: mocks.obter }));
vi.mock("@/lib/api/gestao/entities", () => ({ listEscolas: mocks.escolas, listAlunos: mocks.alunos }));
vi.mock("@/lib/api/gestao/equipe", () => ({ listarEquipe: mocks.equipe }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/app/gestao/turmas/actions", () => ({ executarTurmasAction: vi.fn() }));
import Page from "@/app/gestao/turmas/[id]/page";
const id = "00000000-0000-4000-8000-000000000001";
beforeEach(() => {
  vi.clearAllMocks(); mocks.guard.mockResolvedValue("bolsista"); mocks.escolas.mockResolvedValue([{ id, nome: "Escola fictícia" }]); mocks.alunos.mockResolvedValue([]); mocks.equipe.mockResolvedValue([]);
  mocks.obter.mockResolvedValue({ id, nome: "Turma fictícia", escolaId: id, modalidade: "LEGO", semestre: "2026/2", status: "encerrada", encerradaEm: "2026-10-08T15:00:00Z", encerradaPor: id,
    indicadores: { matriculas: 1, encontrosRealizados: 0, encontrosPrevistos: 1, horasAula: 0, presentes: 0, ausentes: 0, naoInformados: 1, frequencia: null, cobertura: 0, termosPendentes: 1, termosArquivados: 0, termosLegadosSemArquivo: 0, certificadosEntregues: 0 },
    matriculas: [{ id, alunoId: id, nome: "Aluno fictício", inicio: "2026-01-01", fim: null, termoStatus: "pendente" }], encontros: [{ id, data: "2026-10-08", titulo: "Sensores", inicio: "08:00", fim: "10:00", aulaId: null, realizadaEm: null, professor: null }], equipe: [], presencas: [] });
});
describe("detalhe da turma", () => {
  it("bolsista vê própria chamada e pendências sem acesso a cadastros ou documentos", async () => {
    render(await Page({ params: Promise.resolve({ id }) }));
    expect(screen.getByRole("heading", { name: "Turma fictícia" })).toBeInTheDocument();
    expect(screen.getByText(/Indisponível: sem chamadas confirmadas/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pendências de encerramento (3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar chamada" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar encerramento" })).not.toBeInTheDocument();
    expect(mocks.alunos).not.toHaveBeenCalled(); expect(mocks.equipe).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Identificador do termo legado revisado" })).not.toBeInTheDocument();
  });
  it("coordenação tem cadastro manual e alocação em turma específica", async () => {
    mocks.guard.mockResolvedValue("coordenacao");
    render(await Page({ params: Promise.resolve({ id }) }));
    expect(screen.getByText("Cadastrar aluno novo e matricular nesta turma")).toBeInTheDocument();
    expect(screen.getByText("Alocar bolsista ativo")).toBeInTheDocument();
    expect(mocks.alunos).toHaveBeenCalledWith(id);
    expect(screen.getByText(/Envio, conferência e abertura de documentos reais estão bloqueados/)).toBeInTheDocument();
  });
  it("acesso direto a turma invisível não consulta alunos/equipe", async () => {
    mocks.obter.mockResolvedValue(null);
    await expect(Page({ params: Promise.resolve({ id }) })).rejects.toThrow("NOT_FOUND");
    expect(mocks.alunos).not.toHaveBeenCalled(); expect(mocks.equipe).not.toHaveBeenCalled();
  });
});
