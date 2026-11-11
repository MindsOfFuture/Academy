import { describe, expect, it } from "vitest";
import { cpfValido, mascararCpf, normalizarCpf } from "@/lib/cpf";

describe("CPF do teste", () => {
  it("aceita máscara, normaliza e confere os dígitos", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(normalizarCpf("529.982.247-25")).toBe("52998224725");
    expect(mascararCpf("52998224725")).toBe("***.982.247-**");
  });

  it("recusa dígito errado e sequência repetida", () => {
    expect(cpfValido("52998224724")).toBe(false);
    expect(cpfValido("000.000.000-00")).toBe(false);
  });
});
