import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("não encontrada"); } }));
vi.mock("@/lib/api/gestao/alocacao", () => ({ listarTurmas: async () => [{ id: "t1", nome: "Turma A", escolaNome: "Escola Azul", modalidade: "Lego", inicio: "2026-01-02", fim: "2026-03-04" }] }));
vi.mock("@/lib/api/gestao/alunos-turma", () => ({ listarMatriculasTurma: async () => [
  { id: "m1", turmaId: "t1", alunoId: "a1", nome: "Ana", idade: 12, anoEscolar: "7º ano", situacao: "ativa", finalizadaEm: null, motivo: null },
  { id: "m2", turmaId: "t1", alunoId: "a2", nome: "Bia", idade: 13, anoEscolar: "8º ano", situacao: "finalizada", finalizadaEm: "2026-02-01T00:00:00Z", motivo: "Mudou de escola" },
] }));
vi.mock("@/app/gestao/guard", () => ({ exigirMembro: vi.fn() }));
vi.mock("@/app/gestao/alocacao/forms", () => ({
  AcaoFinalizarMatricula: () => <button>Finalizar matrícula</button>,
  FormAdicionarAluno: () => <div>Adicionar aluno</div>, FormColarLista: () => <div>Colar lista</div>,
}));

import AlunosTurmaPage from "@/app/gestao/alocacao/turmas/[id]/page";

describe("página de alunos da turma", () => {
  it("mostra os dados da turma, alunos ativos e histórico finalizado recolhido", async () => {
    const markup = renderToStaticMarkup(await AlunosTurmaPage({ params: Promise.resolve({ id: "t1" }) }));
    expect(markup).toContain("Turma A");
    expect(markup).toContain("Escola Azul · Lego · 02/01/2026 até 04/03/2026");
    expect(markup).toContain("1 aluno ativo");
    expect(markup).toContain("Ana");
    expect(markup).toContain("Matrículas finalizadas (1)");
    expect(markup).toContain("Adicionar aluno");
    expect(markup).toContain("Colar lista");
    expect(markup).toContain("<details");
  });
});
