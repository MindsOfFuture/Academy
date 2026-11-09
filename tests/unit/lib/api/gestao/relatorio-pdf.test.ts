// @vitest-environment node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { preencherRelatorio } from "@/lib/api/gestao/relatorio-docx";
import { docxParaPdf } from "@/lib/api/gestao/relatorio-pdf";

const temSoffice = (() => {
  try {
    execFileSync(process.env.SOFFICE_PATH || "soffice", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

describe("relatório em PDF", () => {
  // Precisa do LibreOffice (servidor e CI do Playwright têm; máquina de dev pode não ter).
  it.skipIf(!temSoffice)("converte o .docx preenchido em PDF", async () => {
    const docx = preencherRelatorio(readFileSync("lib/api/gestao/modelos/relatorio-mensal.docx"), {
      mes: "2026-11", nome: "Maria Souza", cpf: "12345678901", encontros: [], atividades: [],
    });
    const pdf = await docxParaPdf(docx);
    expect(Buffer.from(pdf.subarray(0, 5)).toString("latin1")).toBe("%PDF-");
  }, 60_000);

  it("sem LibreOffice, falha em vez de devolver arquivo vazio", async () => {
    vi.stubEnv("SOFFICE_PATH", "soffice-que-nao-existe");
    await expect(docxParaPdf(new Uint8Array([1]))).rejects.toThrow();
    vi.unstubAllEnvs();
  });
});
