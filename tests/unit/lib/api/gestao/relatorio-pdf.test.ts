// @vitest-environment node

import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { gerarRelatorioPdf } from "@/lib/api/gestao/relatorio-pdf";
import type { EncontroDoRelatorio } from "@/lib/api/gestao/types";

const MODELO = readFileSync("lib/api/gestao/modelos/relatorio-mensal.docx");

const encontro = (dia: number): EncontroDoRelatorio => ({
  encontroId: `e${dia}`,
  data: `2026-11-${String(dia).padStart(2, "0")}`,
  horario: "8h às 12h",
  descricao: "Lego",
  escolaNome: "E.E. Antônio Carlos",
  turmaNome: "Turma A",
  situacao: "cumprida",
  horas: 4,
});

describe("relatório em PDF", () => {
  it("gera um PDF com o formulário, e quebra página quando o mês é cheio", () => {
    const dados = { mes: "2026-11", nome: "Maria Souza", cpf: "12345678901", atividades: [] };
    const curto = gerarRelatorioPdf(MODELO, { ...dados, encontros: [encontro(10)] });
    const texto = Buffer.from(curto).toString("latin1");
    expect(texto.startsWith("%PDF-")).toBe(true);
    expect(texto).toContain("Maria Souza");
    expect(texto).toContain("123.456.789-01");
    expect(texto).toContain("01/11/2026 a 30/11/2026");
    expect(texto).toContain("/Subtype /Image");
    expect(texto.match(/\/Type \/Page\b/g)).toHaveLength(1);

    const cheio = gerarRelatorioPdf(MODELO, { ...dados, encontros: Array.from({ length: 30 }, (_, i) => encontro(i + 1)) });
    expect(Buffer.from(cheio).toString("latin1").match(/\/Type \/Page\b/g)!.length).toBeGreaterThan(1);
    if (process.env.SALVAR_PDF) writeFileSync(process.env.SALVAR_PDF, cheio);
  });

  it("sem nada no mês, sai a tabela com uma linha vazia", () => {
    const pdf = gerarRelatorioPdf(MODELO, { mes: "2026-11", nome: "Maria", cpf: null, encontros: [], atividades: [] });
    expect(Buffer.from(pdf).toString("latin1")).toContain("Atividades desenvolvidas no m");
  });
});
