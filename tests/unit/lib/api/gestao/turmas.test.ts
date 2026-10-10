import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ papel: vi.fn(), schema: vi.fn(), from: vi.fn(), rpc: vi.fn(), chain: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/lib/api/gestao/auth", () => ({ ensureGestaoMember: mocks.papel }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ schema: mocks.schema }) }));
import { abrirTermoPrivado, criarEscola, criarTurma, cadastrarAlunoNaTurma, matricularAluno, salvarChamada, listarTurmas, obterTurma, importarMatriculas, mapTurma } from "@/lib/api/gestao/turmas";
const id = "00000000-0000-4000-8000-000000000001";
beforeEach(() => {
  vi.clearAllMocks(); mocks.papel.mockResolvedValue("coordenacao");
  mocks.chain = Object.fromEntries(["select","insert","upsert","update","eq","order","single","maybeSingle"].map((name) => [name, vi.fn()]));
  for (const fn of Object.values(mocks.chain)) fn.mockReturnValue(mocks.chain);
  mocks.chain.single.mockResolvedValue({ data: { id }, error: null });
  mocks.from.mockReturnValue(mocks.chain); mocks.rpc.mockResolvedValue({ data: id, error: null });
  mocks.schema.mockReturnValue({ from: mocks.from, rpc: mocks.rpc });
});
describe("fronteira autenticada M1", () => {
  it("usa SSR e schema explícito, coordenação antes de escrever", async () => {
    await criarEscola({ nome: "Escola fictícia", cidade: "Cidade", categoria: "estadual" });
    expect(mocks.schema).toHaveBeenCalledWith("gestao");
    mocks.papel.mockResolvedValue("bolsista");
    await expect(criarTurma({ escolaId: id, nome: "Turma", modalidade: "LEGO", semestre: "2026/2" })).rejects.toThrow(/coordenação/);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
  it("não exige conta nem email do aluno e usa cadastro/matrícula atômicos", async () => {
    await cadastrarAlunoNaTurma(id, { nome: "Aluno fictício", idade: 15, anoEscolar: "9º", inicio: "2026-10-08" });
    expect(mocks.rpc).toHaveBeenCalledWith("cadastrar_aluno_turma", { p_turma: id, p_nome: "Aluno fictício", p_idade: 15, p_ano: "9º", p_inicio: "2026-10-08" });
  });
  it("reenviar matrícula preserva datas/termos já corrigidos", async () => {
    mocks.chain.upsert.mockResolvedValue({ data: null, error: null });
    await matricularAluno(id, id, "2026-10-08");
    expect(mocks.chain.upsert).toHaveBeenCalledWith(expect.anything(), { onConflict: "turma_id,aluno_id", ignoreDuplicates: true });
  });
  it("membro chama RPC com marcas explícitas e desconhecido sem virar falta", async () => {
    mocks.papel.mockResolvedValue("bolsista");
    await salvarChamada(id, [{ alunoId: id, presente: null }], false);
    expect(mocks.rpc).toHaveBeenCalledWith("salvar_chamada", { p_agenda: id, p_itens: [{ alunoId: id, presente: null }], p_realizada: false });
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "Acesso negado" } });
    await expect(salvarChamada(id, [], true)).rejects.toThrow(/negado/);
  });
  it("nega documento mesmo à coordenação antes da retenção e não toca storage", async () => {
    await expect(abrirTermoPrivado(id)).rejects.toThrow(/retenção/);
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("não grava lote sem revisão e mapeia turma sem perder autoria de encerramento", async () => {
    await expect(importarMatriculas({ turmaId: id, origem: "fictícia", periodo: "2026", lote: "1", json: JSON.stringify([{ origemLinha: "A1", alunoId: id }]), revisado: false })).rejects.toThrow(/revisão/);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mapTurma({ id, escola_id: id, reserva_id: null, nome: "Turma", modalidade: "LEGO", semestre: "2026/2", status: "encerrada", encerrada_em: "2026-10-08", encerrada_por: id })).toMatchObject({ escolaId: id, encerradaPor: id });
  });
  it("detalhe mapeia joins de aluno e aulas e autoria sob o mesmo cliente RLS", async () => {
    const dados: Record<string, unknown> = {
      turma: { id, escola_id: id, reserva_id: null, nome: "Turma", modalidade: "LEGO", semestre: "2026/2", status: "planejada", encerrada_em: null, encerrada_por: null },
      matricula: [{ id, aluno_id: id, inicio: "2026-01-01", fim: null, termo_status: "pendente", certificado_entregue_em: null, aluno: [{ nome: "Aluno fictício" }] }],
      agenda: [{ id, data: "2026-10-08", aulas: "Sensores", inicio: "08:00", fim: "10:00", professor: null, aula: [{ id, m1: true, realizada_em: "2026-10-08" }] }],
      turma_indicadores: { matriculas: 1, presentes: 1, ausentes: 0, nao_informados: 0, frequencia: "100.00", cobertura: "100.00" },
      presenca: [{ aula_id: id, aluno_id: id, presente: true, atualizado_por: id, atualizado_em: "2026-10-08T15:00:00Z" }],
    };
    mocks.from.mockImplementation((t: string) => {
      const resultado = { data: dados[t], error: null };
      const chain: Record<string, unknown> = { then: (resolve: (r: unknown) => unknown) => Promise.resolve(resultado).then(resolve) };
      for (const method of ["select","eq","order","in"]) chain[method] = vi.fn(() => chain);
      chain.single = vi.fn(async () => resultado); chain.maybeSingle = vi.fn(async () => resultado);
      return chain;
    });
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "chamada_autores" ? [{ id, nome: "Responsável fictício" }] : [{ id, nome: "Bolsista fictício" }], error: null }));
    const turma = await obterTurma(id);
    expect(turma?.matriculas[0]).toMatchObject({ alunoId: id, nome: "Aluno fictício", termoStatus: "pendente" });
    expect(turma?.encontros[0]).toMatchObject({ aulaId: id, realizadaEm: "2026-10-08" });
    expect(turma?.presencas[0]).toMatchObject({ presente: true, autorNome: "Responsável fictício" });
    expect(turma?.indicadores).toMatchObject({ frequencia: 100, cobertura: 100 });
    expect(mocks.rpc).toHaveBeenCalledWith("chamada_autores", { p_turma: id });
  });
  it("erro de autorização impede inclusive a lista", async () => {
    mocks.papel.mockRejectedValue(new Error("Acesso negado"));
    await expect(listarTurmas()).rejects.toThrow(/negado/); expect(mocks.from).not.toHaveBeenCalled();
  });
});
