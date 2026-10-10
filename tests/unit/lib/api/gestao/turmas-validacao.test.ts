import { describe, expect, it } from "vitest";
import { alunosDoEncontro, pendenciasDaTurma, revisarImportacao, validarData, validarHorario, validarId, validarSemestre } from "@/lib/api/gestao/turmas-validacao";
import { mapIndicadores } from "@/lib/api/gestao/turmas";
import type { TurmaDetail } from "@/lib/api/gestao/turmas-types";
const alunoId = "00000000-0000-4000-8000-000000000030";
describe("validação e pendências M1", () => {
  it("recusa horário invertido, data inexistente e identificador malformado", () => {
    expect(() => validarHorario("08:00", "08:00")).toThrow(/posterior/);
    expect(() => validarHorario("8h", "10h")).toThrow(/posterior/);
    expect(() => validarData("2026-02-30")).toThrow(/válida/);
    expect(validarData("2026-10-08")).toBe("2026-10-08");
    expect(() => validarId("nome parecido")).toThrow();
    expect(() => validarSemestre("2026/3")).toThrow();
  });
  it("importação exige ID explícito, não junta nomes nem ignora campos sem mapeamento", () => {
    expect(() => revisarImportacao('[{"nome":"Aluno"}]')).toThrow(/explicitamente/);
    const revisão = revisarImportacao(JSON.stringify([{ origemLinha: "A1", alunoId, telefone: "não copiar" },{ origemLinha: "A1", alunoId }]));
    expect(revisão.problemas).toHaveLength(3);
    expect(revisão.linhas[0]).toEqual({ origemLinha: "A1", alunoId });
  });
  it("indisponível não vira zero e formatos numéricos do banco são derivados", () => {
    expect(mapIndicadores({ frequencia: null, cobertura: null, horas_aula: "2.5", presentes: 0 })).toMatchObject({ frequencia: null, cobertura: null, horasAula: 2.5 });
  });
  it("encerramento mantém chamada desconhecida, duração e termo legado como pendências", () => {
    const turma = { matriculas: [{ id: "m", alunoId, nome: "Aluno fictício", inicio: "2026-01-01", fim: null, termoStatus: "legado_arquivado" }], encontros: [{ id: "e", data: "2026-10-08", aulaId: null, realizadaEm: null, inicio: "08:00", fim: "10:00" }], presencas: [] } as unknown as TurmaDetail;
    expect(pendenciasDaTurma(turma)).toHaveLength(3);
    turma.encontros[0].realizadaEm = "2026-10-08"; turma.encontros[0].fim = null;
    expect(pendenciasDaTurma(turma).join(" ")).toContain("duração");
    turma.matriculas[0].inicio = "2026-10-09";
    expect(alunosDoEncontro(turma.matriculas, turma.encontros[0])).toHaveLength(0);
  });
});
