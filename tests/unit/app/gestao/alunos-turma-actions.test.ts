import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ papel: "coordenacao" as "coordenacao" | "bolsista", cadastrar: vi.fn(), lista: vi.fn(), finalizar: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember: async () => mocks.papel }));
vi.mock("@/lib/api/gestao/alunos-turma", () => ({
  cadastrarAlunoTurma: mocks.cadastrar, cadastrarListaAlunosTurma: mocks.lista, finalizarMatricula: mocks.finalizar,
}));
vi.mock("@/lib/api/gestao/alocacao", () => Object.fromEntries([
  "alocar", "atualizarAlocacao", "cadastrarEscola", "cadastrarTurma", "cancelarEncontro", "concluirEncontro",
  "conflitosDeHorario", "criarEncontro", "definirGestor", "definirSituacaoTurma", "editarEscola", "editarTurma",
  "registrarAfastamento", "removerAlocacao", "substituirAlocacao",
].map((nome) => [nome, vi.fn(async () => undefined)])));
vi.mock("@/lib/api/gestao/avisos", () => ({ avisar: vi.fn() }));

import { cadastrarAlunoTurmaAction, cadastrarListaAlunosTurmaAction, finalizarMatriculaAction } from "@/app/gestao/alocacao/actions";

describe("ações de alunos da turma", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.papel = "coordenacao"; });
  it("exige coordenação e não chama a gravação quando o papel é de bolsista", async () => {
    mocks.papel = "bolsista";
    const form = new FormData(); form.set("turmaId", "t"); form.set("nome", "Ana"); form.set("idade", "12"); form.set("anoEscolar", "7º ano");
    await expect(cadastrarAlunoTurmaAction(null, form)).resolves.toMatchObject({ ok: false });
    expect(mocks.cadastrar).not.toHaveBeenCalled();
  });
  it("só envia lista válida confirmada e finaliza com motivo", async () => {
    const lista = new FormData(); lista.set("turmaId", "t"); lista.set("lista", "Ana; 12; 7º ano\nlinha inválida");
    await expect(cadastrarListaAlunosTurmaAction(null, lista)).resolves.toMatchObject({ ok: false });
    expect(mocks.lista).not.toHaveBeenCalled();
    lista.set("lista", "Ana; 12; 7º ano");
    await expect(cadastrarListaAlunosTurmaAction(null, lista)).resolves.toMatchObject({ ok: true });
    expect(mocks.lista).toHaveBeenCalledWith("t", [{ nome: "Ana", idade: 12, anoEscolar: "7º ano" }]);
    const finalizar = new FormData(); finalizar.set("matriculaId", "m"); finalizar.set("motivo", "Mudou de escola");
    await expect(finalizarMatriculaAction(null, finalizar)).resolves.toMatchObject({ ok: true });
    expect(mocks.finalizar).toHaveBeenCalledWith("m", "Mudou de escola");
  });
});
