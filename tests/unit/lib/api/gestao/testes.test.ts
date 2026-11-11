import { describe, expect, it } from "vitest";
import { csvTestes } from "@/lib/api/gestao/testes";

describe("planilha dos testes", () => {
  it("leva BOM, acentos e CPF completo", () => {
    const csv = csvTestes([{ userId: "1", nome: 'João "Joca"', cpf: "52998224725", acessos: 2, ultimoAcessoEm: "2026-11-10T12:00:00Z", modulosAbertos: 5, modulosConcluidos: 4, jornadaConcluida: false }]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"52998224725"');
    expect(csv).toContain('"João ""Joca"""');
    expect(csv).toContain('"Último acesso"');
    expect(csv).toContain('"4 de 10"');
    expect(csv).toContain('"não"');
  });
});
