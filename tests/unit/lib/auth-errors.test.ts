import { describe, it, expect } from "vitest";
import { mensagemDeAuth } from "@/lib/auth-errors";

describe("mensagemDeAuth", () => {
  it("traduz código conhecido", () => {
    const e = Object.assign(new Error("x"), { code: "invalid_credentials" });
    expect(mensagemDeAuth(e, "padrão")).toBe("E-mail ou senha incorretos.");
  });
  it("senha fraca diz o motivo que o Supabase deu", () => {
    const e = Object.assign(new Error("x"), { code: "weak_password", reasons: ["length", "pwned"] });
    expect(mensagemDeAuth(e, "padrão")).toBe("A senha é curta demais. Essa senha já apareceu em vazamentos. Escolha outra.");
    const semMotivo = Object.assign(new Error("x"), { code: "weak_password" });
    expect(mensagemDeAuth(semMotivo, "padrão")).toBe("A senha não atende aos requisitos de segurança.");
  });
  it("traduz mensagem conhecida", () => {
    expect(mensagemDeAuth(new Error("User already registered"), "padrão")).toBe("Este e-mail já tem cadastro.");
  });
  it("mantém erro já em português", () => {
    expect(mensagemDeAuth(new Error("As senhas não conferem."), "padrão")).toBe("As senhas não conferem.");
  });
  it("usa o padrão para não-Error", () => {
    expect(mensagemDeAuth("boom", "padrão")).toBe("padrão");
  });
});
