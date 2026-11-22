// @vitest-environment node

import { readFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { formatarCpf, linhasDoRelatorio, preencherRelatorio } from "@/lib/api/gestao/relatorio-docx";
import type { AtividadeRelatorio, EncontroDoRelatorio } from "@/lib/api/gestao/types";

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
  tipo: "aula",
  espacoNome: null,
  situacao: "cumprida",
  horas: 4,
  links: [],
  fotos: [],
  inicio: null,
  meuLink: null,
  minhaFoto: null,
};

const ATIVIDADE: AtividadeRelatorio = {
  id: "a1",
  user_profile_id: "u1",
  nome: "Preparei o material",
  data: "2026-11-05",
  inicio: null,
  fim: null,
  comprovacao: "https://drive.google.com/x",
  foto_comprovacao: null,
  participantes: [],
};

describe("relatório no modelo .docx", () => {
  it("troca todos os campos XX e monta a tabela com encontros e atividades em ordem de data", () => {
    const doc = documento(
      preencherRelatorio(MODELO, {
        mes: "2026-11",
        nome: "Bia & Cia <Bolsista>",
        cpf: "12345678901",
        encontros: [ENCONTRO, { ...ENCONTRO, encontroId: "e2", data: "2026-11-03", escolaNome: null, turmaNome: null, situacao: "cobertura" }],
        atividades: [ATIVIDADE],
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

  it("sem escola: tipo que não é aula e espaço entram no onde; aula sem escola não ganha rótulo", () => {
    const [impressao, aula] = linhasDoRelatorio(
      [
        { ...ENCONTRO, escolaNome: null, turmaNome: null, tipo: "impressao", espacoNome: "Sala 3", descricao: "Peças" },
        { ...ENCONTRO, data: "2026-11-11", escolaNome: null, turmaNome: null },
      ],
      [],
    );
    expect(impressao.atividade).toBe("Peças — Impressão, Sala 3 (8h às 12h)");
    expect(aula.atividade).toBe("Lego (8h às 12h)");
  });

  it("atividade com horário mostra início e fim", () => {
    const [linha] = linhasDoRelatorio([], [{ ...ATIVIDADE, inicio: "14:00:00", fim: "16:30:00" }]);
    expect(linha.atividade).toBe("Preparei o material (14:00 às 16:30)");
  });

  it("foto entra na célula da comprovação, reduzida para caber na coluna e numa altura máxima", () => {
    const larga = "u1/11111111-1111-4111-8111-111111111111.jpg";
    const alta = "u1/22222222-2222-4222-8222-222222222222.png";
    const sumiu = "u1/33333333-3333-4333-8333-333333333333.jpg";
    const arquivo = unzipSync(
      preencherRelatorio(MODELO, {
        mes: "2026-11",
        nome: "Bia",
        cpf: null,
        encontros: [{ ...ENCONTRO, links: ["https://a.org"], fotos: [larga, sumiu] }],
        atividades: [{ ...ATIVIDADE, comprovacao: null, foto_comprovacao: alta }],
        fotos: new Map([
          [larga, { bytes: new Uint8Array([1, 2, 3]), largura: 4000, altura: 3000 }],
          [alta, { bytes: new Uint8Array([4, 5]), largura: 900, altura: 1200 }],
        ]),
      }),
    );
    const doc = strFromU8(arquivo["word/document.xml"]);
    const tabela = doc.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)![0];
    const linhas = tabela.match(/<w:tr>[\s\S]*?<\/w:tr>/g)!;
    const extensoes = [...tabela.matchAll(/<wp:extent cx="(\d+)" cy="(\d+)"\/>/g)].map((m) => [Number(m[1]), Number(m[2])]);

    // Uma foto por linha, a que não baixou fica de fora; o texto da célula continua.
    expect(extensoes).toHaveLength(2);
    expect(linhas[1]).toContain("<w:drawing>");
    expect(linhas[2]).toContain("<w:drawing>");
    expect(celulas(doc)[2][2]).toBe("https://a.org");
    // Nenhuma passa da coluna (3685 twips − margens) nem de ~4,5 cm de altura, e a proporção fica.
    for (const [cx, cy] of extensoes) {
      expect(cx).toBeLessThanOrEqual((3685 - 360) * 635);
      expect(cy).toBeLessThanOrEqual(1_620_000);
    }
    // Em ordem de data: a atividade (05/11, foto em pé) vem antes do encontro (10/11, deitada).
    expect(extensoes[0][0] / extensoes[0][1]).toBeCloseTo(3 / 4, 2);
    expect(extensoes[1][0] / extensoes[1][1]).toBeCloseTo(4 / 3, 2);

    expect(arquivo["word/media/foto-1000.jpg"]).toEqual(new Uint8Array([4, 5]));
    expect(arquivo["word/media/foto-1001.jpg"]).toEqual(new Uint8Array([1, 2, 3]));
    expect(Object.keys(arquivo).filter((k) => k.startsWith("word/media/foto-"))).toHaveLength(2);
    const rels = strFromU8(arquivo["word/_rels/document.xml.rels"]);
    expect(rels).toContain('Id="rIdFoto1000"');
    expect(rels).toContain('Id="rIdFoto1001"');
    expect(doc).toContain('r:embed="rIdFoto1000"');
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
