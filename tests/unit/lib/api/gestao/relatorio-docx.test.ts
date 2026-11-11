// @vitest-environment node

import { readFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { formatarCpf, preencherRelatorio } from "@/lib/api/gestao/relatorio-docx";
import type { EncontroDoRelatorio } from "@/lib/api/gestao/types";

/** Gera a partir do modelo de verdade: se alguém trocar o .docx, o teste mostra o que quebrou. */
const MODELO = readFileSync("lib/api/gestao/modelos/relatorio-mensal.docx");

function documento(arquivo: Uint8Array): string {
  return strFromU8(unzipSync(arquivo)["word/document.xml"]);
}

/** Texto visível, célula por célula da tabela. */
function celulas(doc: string): string[][] {
  const tabela = doc.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)![0];
  return tabela.match(/<w:tr>[\s\S]*?<\/w:tr>/g)!.map((tr) =>
    tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g)!.map((tc) => (tc.match(/<w:t[^>]*>[^<]*<\/w:t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, "")).join("")),
  );
}

const ENCONTRO: EncontroDoRelatorio = {
  encontroId: "e1",
  data: "2026-11-10",
  horario: "8h às 12h",
  descricao: "Lego",
  escolaNome: "E.E. Antônio Carlos",
  turmaNome: "Turma A",
  situacao: "cumprida",
  horas: 4,
  links: [],
  inicio: null,
  meuLink: null,
};

describe("relatório no modelo .docx", () => {
  it("troca todos os campos XX e monta a tabela com encontros e atividades em ordem de data", () => {
    const doc = documento(
      preencherRelatorio(MODELO, {
        mes: "2026-11",
        nome: "Bia & Cia <Bolsista>",
        cpf: "12345678901",
        encontros: [ENCONTRO, { ...ENCONTRO, encontroId: "e2", data: "2026-11-03", escolaNome: null, turmaNome: null, situacao: "cobertura" }],
        atividades: [{ id: "a1", nome: "Preparei o material", data: "2026-11-05", comprovacao: "https://drive.google.com/x" }],
      }),
    );

    expect(doc).not.toMatch(/XX/);
    expect(doc).not.toContain("Leandro Fortunato Moreira");
    expect(doc).toContain("Período 01/11/2026 a 30/11/2026");
    expect(doc).toContain("CPF do Bolsista: 123.456.789-01");
    expect(doc).toContain("Nome do Bolsista: Bia &amp; Cia &lt;Bolsista&gt;"); // escapado: o XML continua válido
    expect(doc).toContain("o bolsista Bia &amp; Cia &lt;Bolsista&gt;, obteve");
    expect(doc).toContain("no mês 11/2026");
    expect(doc).not.toMatch(/w14:paraId="[^"]*"[\s\S]*w14:paraId="\1"/);

    expect(celulas(doc)).toEqual([
      ["Atividades desenvolvidas no mês", "Data", "Fonte de comprovação (caso houver)"],
      ["Lego (8h às 12h, cobrindo outro bolsista)", "03/11/2026", ""],
      ["Preparei o material", "05/11/2026", "https://drive.google.com/x"],
      ["Lego — E.E. Antônio Carlos, Turma A (8h às 12h)", "10/11/2026", ""],
    ]);
  });

  it("links de comprovação do encontro vão juntos, separados por espaço, escapados no XML", () => {
    const doc = documento(
      preencherRelatorio(MODELO, {
        mes: "2026-11",
        nome: "Bia",
        cpf: null,
        encontros: [{ ...ENCONTRO, links: ["https://a.org/x?y=1&z=2", "https://b.org"] }],
        atividades: [],
      }),
    );
    expect(doc).toContain("https://a.org/x?y=1&amp;z=2 https://b.org");
    expect(celulas(doc)[1][2]).toBe("https://a.org/x?y=1&amp;z=2 https://b.org");
  });

  it("mês sem nada mantém a linha vazia do modelo", () => {
    const doc = documento(preencherRelatorio(MODELO, { mes: "2026-02", nome: "Bia", cpf: null, encontros: [], atividades: [] }));
    expect(doc).toContain("Período 01/02/2026 a 28/02/2026");
    expect(celulas(doc)).toHaveLength(2);
  });

  it("CPF fora do formato fica em branco em vez de sair errado", () => {
    expect(formatarCpf("123.456.789-01")).toBe("123.456.789-01");
    expect(formatarCpf("123")).toBe("");
    expect(formatarCpf(null)).toBe("");
  });
});
