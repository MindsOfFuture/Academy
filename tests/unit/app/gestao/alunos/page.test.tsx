import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), alunos: vi.fn(), escolas: vi.fn() }));
vi.mock("@/app/gestao/guard", () => ({ exigirMembro: mocks.guard }));
vi.mock("@/lib/api/gestao/entities", () => ({ listAlunos: mocks.alunos, listEscolas: mocks.escolas }));
vi.mock("@/app/gestao/turmas/forms", () => ({ FormularioTurmas: () => <div>Cadastro sem conta obrigatória</div> }));
import Page from "@/app/gestao/alunos/page";
describe("alunos", () => {
  it("exige coordenação e não exige conta/email no cadastro manual", async () => {
    mocks.guard.mockResolvedValue("coordenacao"); mocks.alunos.mockResolvedValue([]); mocks.escolas.mockResolvedValue([]);
    render(await Page());
    expect(mocks.guard).toHaveBeenCalledWith("/gestao/alunos","coordenacao");
    expect(screen.getByText(/não precisa ter conta/)).toBeInTheDocument();
  });
  it("não consulta alunos quando a autorização falha", async () => {
    mocks.alunos.mockClear(); mocks.guard.mockRejectedValue(new Error("Negado"));
    await expect(Page()).rejects.toThrow("Negado"); expect(mocks.alunos).not.toHaveBeenCalled();
  });
});
