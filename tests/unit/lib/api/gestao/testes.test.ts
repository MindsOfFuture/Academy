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

  it("mostra traço quando a conta não tem CPF", () => {
    const csv = csvTestes([{ userId: "2", nome: "Bruna", cpf: null, acessos: 1, ultimoAcessoEm: "2026-11-12T12:00:00Z", modulosAbertos: 1, modulosConcluidos: 0, jornadaConcluida: false }]);
    expect(csv.split("\r\n")[1]).toBe('"Bruna";"—";"1";"2026-11-12T12:00:00Z";"1";"0 de 10";"não"');
  });
});
