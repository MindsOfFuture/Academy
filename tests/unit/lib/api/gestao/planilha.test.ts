// @vitest-environment node

import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import {
  EXEMPLO_DO_MODELO,
  chaveEscola,
  escolaSugerida,
  gerarModelo,
  inferirPrimeiroDia,
  interpretarCalendario,
  lerGrade,
  modalidadeCanonica,
  montarPrevia,
  montarXlsx,
  nomeCanonicoEscola,
  validarEventos,
  type EventoPlanilha,
} from "@/lib/api/gestao/planilha";

/**
 * Leitura da planilha de calendário. As planilhas de teste são montadas com
 * `montarXlsx` (nada de binário no repositório) e imitam o arquivo real da
 * coordenação: outubro a dezembro de 2026, começando na segunda 28/09.
 */

const CABECALHO = { A2: "Segunda ", B2: "Terça", C2: "Quarta ", D2: "Quinta", E2: "Sexta ", F2: "Sábado ", G2: "Domingo" };

/** Semana de números na linha `linha`: dias a partir de `primeiro`, virando o mês depois de `ultimoDoMes`. */
function semana(linha: number, primeiro: number, ultimoDoMes: number): Record<string, number> {
  const celulas: Record<string, number> = {};
  "ABCDEFG".split("").forEach((col, i) => {
    const dia = primeiro + i;
    celulas[`${col}${linha}`] = dia > ultimoDoMes ? dia - ultimoDoMes : dia;
  });
  return celulas;
}

function planilha(celulas: Record<string, string | number>) {
  return lerGrade(montarXlsx({ A1: ",", ...CABECALHO, H3: "Outubro", ...celulas }, { mesclas: ["A1:G1", "H3:H12"] }));
}

describe("lerGrade", () => {
  it("lê texto compartilhado com vários trechos, entidades, número e texto inline", () => {
    const sheet =
      '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>28</v></c>' +
      '<c r="C1" t="inlineStr"><is><t>x &amp; &#10;y</t></is></c><c r="D1" t="str"><v>3</v></c><c r="E1" s="2"/></row></sheetData></worksheet>';
    const strings = '<sst><si><r><t xml:space="preserve">E.M. </t></r><r><t>Ana &lt;1&gt;</t></r><rPh><t>fon</t></rPh></si></sst>';
    const grade = lerGrade(
      zipSync({ "xl/worksheets/sheet1.xml": strToU8(sheet), "xl/sharedStrings.xml": strToU8(strings) }),
    );
    expect(Object.fromEntries(grade)).toEqual({ A1: "E.M. Ana <1>", B1: 28, C1: "x & \ny", D1: "3" });
  });

  it("recusa o que não é .xlsx", () => {
    expect(() => lerGrade(strToU8("isto não é zip"))).toThrow("Este arquivo não é uma planilha .xlsx.");
    expect(() => lerGrade(zipSync({ "a.txt": strToU8("oi") }))).toThrow("Este arquivo não é uma planilha .xlsx.");
  });
});

describe("interpretarCalendario", () => {
  const grade = planilha({
    ...semana(3, 28, 30),
    A4: "E.M. Dante Jaime Brochado - aulas 01 e 02\nModalidade: Lego\nHorário: 13h às 17h\nBolsistas: Antônio, Allan ",
    B4: "E.E. Presidente Costa e Silva - aulas 03 e 04\nModalidade: educação financeira\nHorário: 08h às 12h\nBolsistas: Ana, \nJoão, Hanna",
    D4: "E.M. Pedro Marques - aulas 03 e 04\nMódulo: IA\nHorário: 8h às 12h",
    E4: "Escola Saci - apresentação robótica\nHorário: 10h às 12h\nBolsistas: Guilherme",
    ...semana(5, 5, 31),
    A6: "Feriado",
    C6: "Treinamento\n14h às 17h",
    ...semana(7, 12, 31),
    A8:
      "E.M  Prefeito Nilton Bretas  Aulas 01 e 02\nModalidade: lego\nHorário: 08h às 12h\nBolsistas: João \n\n\n\n" +
      "E.E. Antônio Carlos - aula 05e 06\nModalidade: Educação Financeira\nHorário: 13h30 às 17h30\nBolsistas: Allan\n: ",
    B8: "E.E. de Belmiro Braga aulas 01 e 02\nModalidade: IA \nHorário: 08h às 12h\nBolsistas:",
    C8: "E.M Cecília Meireles - aula 01 e 02\nModalidade: Lego\nHorário: 08h às 12h\nBolsistas: ",
  });
  const leitura = interpretarCalendario(grade, "2026-09-28");
  const resumo = leitura.eventos.map((e) => [e.celula, e.data, e.inicio, e.fim, e.escola, e.modalidade, e.descricao]);

  it("lê cada variação de escrita da planilha", () => {
    expect(leitura.erros).toEqual([]);
    expect(resumo).toEqual([
      ["A4", "2026-09-28", "13:00", "17:00", "E.M. Dante Jaime Brochado", "Lego", "Aulas 01 e 02"],
      ["B4", "2026-09-29", "08:00", "12:00", "E.E. Presidente Costa e Silva", "Educação Financeira", "Aulas 03 e 04"],
      ["D4", "2026-10-01", "08:00", "12:00", "E.M. Pedro Marques", "IA", "Aulas 03 e 04"],
      ["E4", "2026-10-02", "10:00", "12:00", "Escola Saci", "Apresentação robótica", ""],
      ["C6", "2026-10-07", "14:00", "17:00", null, "Treinamento", ""],
      ["A8", "2026-10-12", "08:00", "12:00", "E.M. Prefeito Nilton Bretas", "Lego", "Aulas 01 e 02"],
      ["A8", "2026-10-12", "13:30", "17:30", "E.E. Antônio Carlos", "Educação Financeira", "Aulas 05 e 06"],
      ["B8", "2026-10-13", "08:00", "12:00", "E.E. de Belmiro Braga", "IA", "Aulas 01 e 02"],
      ["C8", "2026-10-14", "08:00", "12:00", "E.M. Cecília Meireles", "Lego", "Aulas 01 e 02"],
    ]);
  });

  it("o número da aula é o primeiro número depois de \"aula\"; sem aulas, nulo", () => {
    expect(leitura.eventos.map((e) => e.numeroAula)).toEqual([1, 3, 3, null, null, 1, 5, 1, 1]);
  });

  it("bloco sem horário vai para os ignorados", () => {
    expect(leitura.ignorados).toEqual([{ celula: "A6", data: "2026-10-05", texto: "Feriado" }]);
  });

  it("número que não bate com a conta vira erro, e lixo na linha de números é ignorado", () => {
    const errada = planilha({ ...semana(3, 28, 30), ...semana(5, 5, 31), A5: ",", B5: 7 });
    const { erros } = interpretarCalendario(errada, "2026-09-28");
    expect(erros).toEqual([
      "A célula B5 diz 7, mas a conta dá 6 (06/10/2026). Confira o primeiro dia da planilha.",
    ]);
  });

  it("horário com fim antes do início vira erro", () => {
    const { erros, eventos } = interpretarCalendario(planilha({ ...semana(3, 28, 30), A4: "Reunião\n17h às 13h" }), "2026-09-28");
    expect(eventos).toEqual([]);
    expect(erros[0]).toContain("A4");
  });

  it("primeiro dia que não é segunda é recusado", () => {
    expect(interpretarCalendario(grade, "2026-09-29").erros).toEqual(["A primeira semana precisa começar numa segunda-feira."]);
  });
});

describe("inferirPrimeiroDia", () => {
  it("acha a segunda 28/09/2026 pelo dia 1 de outubro numa quinta", () => {
    expect(inferirPrimeiroDia(planilha({ ...semana(3, 28, 30), A13: "," }), "2026-11-11")).toBe("2026-09-28");
  });

  it("sem o dia 1 na semana, a segunda é o dia da coluna A no mês rotulado", () => {
    expect(inferirPrimeiroDia(planilha(semana(3, 5, 31)), "2026-11-11")).toBe("2026-10-05");
  });

  it("sem cabeçalho ou sem mês, não adivinha", () => {
    expect(inferirPrimeiroDia(lerGrade(montarXlsx(semana(3, 28, 30))), "2026-11-11")).toBeNull();
    expect(inferirPrimeiroDia(lerGrade(montarXlsx({ ...CABECALHO, ...semana(3, 28, 30) })), "2026-11-11")).toBeNull();
  });
});

describe("nomes", () => {
  it("chaveEscola iguala as variações de escrita", () => {
    const chaves = ["E.M Cecília Meireles", "E.M.  Cecilia Meireles", "EM Cecília Meireles", " e.m. cecília meireles "].map(chaveEscola);
    expect(new Set(chaves).size).toBe(1);
    expect(nomeCanonicoEscola("E.M  Prefeito Nilton Bretas ")).toBe("E.M. Prefeito Nilton Bretas");
  });

  it("modalidade e escola sugerida", () => {
    expect(["lego", "educação financeira", "ia", "PYTHON", "robótica"].map(modalidadeCanonica)).toEqual([
      "Lego", "Educação Financeira", "IA", "Python", "Robótica",
    ]);
    expect(escolaSugerida("E.M Pedro Marques")).toEqual({ categoria: "municipal", cidade: "Juiz de Fora" });
    expect(escolaSugerida("E.E. Antônio Carlos")).toEqual({ categoria: "estadual", cidade: "Juiz de Fora" });
    expect(escolaSugerida("E.E. de Belmiro Braga")).toEqual({ categoria: "estadual", cidade: "Belmiro Braga" });
    expect(escolaSugerida("Escola Saci")).toEqual({ categoria: "outra", cidade: "Juiz de Fora" });
  });
});

describe("montarPrevia", () => {
  const evento = (data: string, escola: string | null, inicio = "08:00", fim = "12:00"): EventoPlanilha => ({
    celula: "A4", data, inicio, fim, escola, modalidade: "Lego", descricao: "Aulas 01 e 02",
  });

  it("casa escola cadastrada, propõe a nova e marca o repetido no banco e na própria planilha", () => {
    const previa = montarPrevia(
      [
        evento("2026-10-05", "E.M Cecília Meireles"),
        evento("2026-10-06", "E.E. de Belmiro Braga"),
        evento("2026-10-07", "E.E. de  Belmiro Braga"),
        evento("2026-10-07", "E.E. de Belmiro Braga"),
        evento("2026-10-08", null, "14:00", "17:00"),
      ],
      [{ id: "cec", nome: "E.M. Cecília Meireles" }],
      [{ data: "2026-10-05", escola_id: "cec", inicio: "08:00:00", fim: "12:00:00" }],
    );
    expect(previa.encontros.map((e) => [e.escolaId, e.escolaNova, e.duplicado])).toEqual([
      ["cec", null, true],
      [null, "E.E. de Belmiro Braga", false],
      [null, "E.E. de Belmiro Braga", false],
      [null, "E.E. de Belmiro Braga", true],
      [null, null, false],
    ]);
    expect(previa.escolasNovas).toEqual([
      { chave: "ee de belmiro braga", nome: "E.E. de Belmiro Braga", categoria: "estadual", cidade: "Belmiro Braga" },
    ]);
  });
});

describe("validarEventos", () => {
  const bom = { celula: "A4", data: "2026-10-05", inicio: "08:00", fim: "12:00", escola: "E.M. X", modalidade: "Lego", descricao: "" };

  it("aceita evento bom e descarta campos a mais", () => {
    expect(validarEventos([{ ...bom, extra: 1 }])).toEqual({ ok: true, valor: [{ ...bom, numeroAula: null }] });
    expect(validarEventos([{ ...bom, numeroAula: 7 }])).toEqual({ ok: true, valor: [{ ...bom, numeroAula: 7 }] });
  });

  it("recusa lixo", () => {
    for (const lixo of [
      null,
      [],
      "x",
      [null],
      [{ ...bom, data: "2026-02-30" }],
      [{ ...bom, inicio: "25:00" }],
      [{ ...bom, fim: "08:00" }],
      [{ ...bom, modalidade: "L" }],
      [{ ...bom, descricao: "x".repeat(201) }],
      [{ ...bom, escola: "x".repeat(121) }],
      [{ ...bom, celula: "A4'; drop" }],
      [{ ...bom, numeroAula: 0 }],
      [{ ...bom, numeroAula: 1000 }],
      [{ ...bom, numeroAula: 1.5 }],
      [{ ...bom, numeroAula: "3" }],
      Array.from({ length: 401 }, () => bom),
    ]) {
      expect(validarEventos(lixo).ok).toBe(false);
    }
  });
});

describe("gerarModelo", () => {
  it("ida e volta: o modelo de out/2026 abre na segunda 28/09 e não tem evento nem erro", () => {
    const grade = lerGrade(gerarModelo("2026-10", 3));
    expect(grade.get("A1")).toBe(EXEMPLO_DO_MODELO);
    expect(inferirPrimeiroDia(grade, "2026-11-11")).toBe("2026-09-28");
    const leitura = interpretarCalendario(grade, "2026-09-28");
    expect([leitura.eventos.length, leitura.ignorados.length, leitura.erros]).toEqual([0, 0, []]);
    // 28/09 até a semana de 31/12 (28/12–03/01): 14 semanas.
    expect(grade.get("A29")).toBe(28);
    expect(grade.get("G29")).toBe(3);
    expect(grade.get("A31")).toBeUndefined();
    expect([grade.get("H3"), grade.get("H13"), grade.get("H23")]).toEqual(["Outubro", "Novembro", "Dezembro"]);
  });

  it("mês que começa na segunda e virada de ano", () => {
    const junho = lerGrade(gerarModelo("2026-06", 1));
    expect(junho.get("A3")).toBe(1);
    expect(inferirPrimeiroDia(junho, "2026-05-20")).toBe("2026-06-01");

    const virada = lerGrade(gerarModelo("2026-12", 2));
    expect(inferirPrimeiroDia(virada, "2026-11-11")).toBe("2026-11-30");
    expect(interpretarCalendario(virada, "2026-11-30").erros).toEqual([]);
    expect(virada.get("H3")).toBe("Dezembro");
    expect([...virada.values()]).toContain("Janeiro");
  });

  it("o exemplo do modelo colado numa segunda vira um evento", () => {
    const exemplo = EXEMPLO_DO_MODELO.split("\n").slice(1).join("\n");
    const grade = lerGrade(montarXlsx({ ...Object.fromEntries(lerGrade(gerarModelo("2026-10", 1))), A4: exemplo }));
    expect(interpretarCalendario(grade, "2026-09-28").eventos).toEqual([
      {
        celula: "A4", data: "2026-09-28", inicio: "13:00", fim: "17:00",
        escola: "E.M. Nome da Escola", modalidade: "Lego", descricao: "Aulas 01 e 02", numeroAula: 1,
      },
    ]);
  });

  it("recusa mês ou duração inválidos", () => {
    expect(() => gerarModelo("2026-13", 1)).toThrow();
    expect(() => gerarModelo("2026-10", 7)).toThrow();
  });
});

describe("entrada hostil", () => {
  it("textos enormes e repetitivos não travam a leitura", () => {
    const n = 20_000;
    const hostis = [
      "a".repeat(n),
      "- ".repeat(n) + "x",
      "1h ".repeat(n),
      "aula ".repeat(n),
      "1h" + " ".repeat(n) + "x",
      "E.M" + " ".repeat(n) + "x",
      "Modalidade:" + " ".repeat(n),
      "\n".repeat(n) + "x",
      "Bolsistas:" + ":".repeat(n),
    ];
    const celulas: Record<string, string | number> = { ...semana(3, 28, 30) };
    hostis.forEach((t, i) => (celulas[`${"ABCDEFG"[i % 7]}${4 + 2 * Math.floor(i / 7)}`] = t));
    const grade = planilha(celulas);
    const inicio = performance.now();
    interpretarCalendario(grade, "2026-09-28");
    hostis.forEach((t) => chaveEscola(t));
    lerGrade(zipSync({ "xl/worksheets/sheet1.xml": strToU8("<c ".repeat(n) + '<c r="A1"><v>1'.repeat(1000)) }));
    expect(performance.now() - inicio).toBeLessThan(100);
  });
});
