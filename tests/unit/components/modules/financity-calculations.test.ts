import { describe, expect, it } from "vitest";
import { calcIRRF, descontosCLT } from "@/components/modules/financity/calculations";

describe("Tabelas de 2026", () => {
  it.each([[4000, 0, 0], [5000, 0, 0], [6000, 649.60, 382.88], [7607.20, 0, 1016.27]])(
    "calcula IR sobre salário de %s", (bruto, inss, esperado) => {
      expect(calcIRRF(bruto, inss)).toBeCloseTo(esperado, 2);
    },
  );
  it("limita o INSS ao teto", () => {
    expect(descontosCLT(20000).inss).toBe(988.09);
  });
});
