import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ papel: vi.fn(), criarTurma: vi.fn(), salvarChamada: vi.fn(), cadastrarAlunoNaTurma: vi.fn(), encerrarTurma: vi.fn(), refresh: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.refresh }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember: mocks.papel }));
vi.mock("@/lib/api/gestao/turmas", () => ({ ...mocks }));
import { executarTurmasAction } from "@/app/gestao/turmas/actions";
const id = "00000000-0000-4000-8000-000000000001";
const form = (values: Record<string,string>) => { const f = new FormData(); for (const [k,v] of Object.entries(values)) f.set(k,v); return f; };
beforeEach(() => { vi.clearAllMocks(); mocks.papel.mockResolvedValue("coordenacao"); mocks.criarTurma.mockResolvedValue(id); });
describe("ações M1", () => {
  it("não membro e bolsista não gerenciam cadastros por chamada direta", async () => {
    mocks.papel.mockResolvedValue("bolsista");
    expect((await executarTurmasAction(null, form({ acao: "turma" }))).ok).toBe(false);
    expect(mocks.criarTurma).not.toHaveBeenCalled();
    mocks.papel.mockRejectedValue(new Error("Acesso negado"));
    expect((await executarTurmasAction(null, form({ acao: "chamada" }))).ok).toBe(false);
  });
  it("cria turma com seleção explícita da escola e retorna link", async () => {
    const estado = await executarTurmasAction(null, form({ acao: "turma", escolaId: id, nome: "Turma", modalidade: "LEGO", semestre: "2026/2" }));
    expect(estado).toMatchObject({ ok: true, href: `/gestao/turmas/${id}` });
    expect(mocks.refresh).toHaveBeenCalledWith("/gestao/turmas");
  });
  it("chamada distingue marcas, desconhecido e confirmação de realização", async () => {
    mocks.papel.mockResolvedValue("bolsista");
    const estado = await executarTurmasAction(null, form({ acao: "chamada", agendaId: id, turmaId: id, [`aluno:${id}`]: "nao_informado" }));
    expect(estado.ok).toBe(true);
    expect(mocks.salvarChamada).toHaveBeenCalledWith(id, [{ alunoId: id, presente: null }], false);
    expect((await executarTurmasAction(null, form({ acao: "chamada", agendaId: id, [`aluno:${id}`]: "???" }))).ok).toBe(false);
  });
  it("aluno novo na turma é operação atômica sem email", async () => {
    const estado = await executarTurmasAction(null, form({ acao: "aluno", turmaId: id, nome: "Aluno fictício", idade: "14", anoEscolar: "9º", inicio: "2026-10-08" }));
    expect(estado.ok).toBe(true);
    expect(mocks.cadastrarAlunoNaTurma).toHaveBeenCalledWith(id, { nome: "Aluno fictício", idade: 14, anoEscolar: "9º", inicio: "2026-10-08" });
  });
  it("encerramento transmite confirmação, nunca fabrica registros", async () => {
    await executarTurmasAction(null, form({ acao: "encerrar", turmaId: id, confirmado: "on" }));
    expect(mocks.encerrarTurma).toHaveBeenCalledWith(id,true); expect(mocks.salvarChamada).not.toHaveBeenCalled();
  });
});
