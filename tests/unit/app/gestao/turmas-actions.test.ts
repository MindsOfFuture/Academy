import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ guard: vi.fn(), criarEscola: vi.fn(), cadastrarAlunoNaTurma: vi.fn(), salvarChamada: vi.fn(), encerrarTurma: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember: mock.guard }));
vi.mock("@/lib/api/gestao/turmas", () => mock);
import { executarTurmasAction } from "@/app/gestao/turmas/actions";
const id = "00000000-0000-4000-8000-000000000001";
const form = (values: Record<string,string>) => { const f = new FormData(); for (const [k,v] of Object.entries(values)) f.set(k,v); return f; };
describe("ações M1", () => {
  beforeEach(() => { vi.clearAllMocks(); mock.guard.mockResolvedValue("coordenacao"); });
  it("bolsista não cria escola nem qualquer cadastro, mesmo chamando a ação diretamente", async () => {
    mock.guard.mockResolvedValue("bolsista");
    expect((await executarTurmasAction(null, form({ acao: "escola", nome: "Escola", categoria: "estadual", cidade: "Cidade" }))).ok).toBe(false);
    expect(mock.criarEscola).not.toHaveBeenCalled();
  });
  it("bolsista registra presente, ausente e não informado em uma chamada sem presumir realização", async () => {
    mock.guard.mockResolvedValue("bolsista");
    const id2 = id.slice(0,-1)+"2", id3 = id.slice(0,-1)+"3";
    const result = await executarTurmasAction(null, form({ acao: "chamada", agendaId: id, turmaId: id, [`aluno:${id}`]: "presente", [`aluno:${id2}`]: "ausente", [`aluno:${id3}`]: "nao_informado" }));
    expect(result.ok).toBe(true);
    expect(mock.salvarChamada).toHaveBeenCalledWith(id, [{ alunoId: id, presente: true },{ alunoId: id2, presente: false },{ alunoId: id3, presente: null }], false);
  });
  it("cadastro na turma não deixa duas operações separadas de aluno/matrícula", async () => {
    const result = await executarTurmasAction(null, form({ acao: "aluno", turmaId: id, nome: "Aluno", idade: "14", anoEscolar: "9º", inicio: "2026-01-01" }));
    expect(result.ok).toBe(true); expect(mock.cadastrarAlunoNaTurma).toHaveBeenCalledWith(id, { nome: "Aluno", idade: 14, anoEscolar: "9º", inicio: "2026-01-01" });
  });
  it("ação não inventa confirmação de encerramento e devolve erro recuperável", async () => {
    mock.encerrarTurma.mockRejectedValueOnce(new Error("Revise e confirme"));
    expect((await executarTurmasAction(null, form({ acao: "encerrar", turmaId: id }))).mensagem).toBe("Revise e confirme");
    expect(mock.encerrarTurma).toHaveBeenCalledWith(id, false);
  });
});
