import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(), usuarioDaRequisicao: vi.fn() }));

import { calendarioIcs, estaNoEncontro } from "@/lib/api/gestao/calendario";
import type { Encontro } from "@/lib/api/gestao/types";

/** Encontros em .ics para o Google Agenda: fuso de Brasília, UID estável, só o que acontece. */

function encontro(campos: Partial<Encontro>): Encontro {
  return {
    id: "e1",
    data: "2026-11-20",
    inicio: "14:00",
    fim: "17:30",
    horario: "14:00 – 17:30",
    modalidade: "Lego",
    descricao: "Lego",
    escolaId: "s1",
    escolaNome: "EE Delfim, Moreira",
    turmaId: "t1",
    turmaNome: "9º A",
    turmaStatus: "em_andamento",
    canceladoEm: null,
    motivoCancelamento: null,
    concluidoEm: null,
    relatorio: null,
    numeroAula: 3,
    presentes: null,
    tipo: "aula",
    espacoId: null,
    espacoNome: null,
    alocacoes: [
      { bolsistaNome: "Ana", situacao: "prevista" },
      { bolsistaNome: "Rui", situacao: "substituida" },
    ] as Encontro["alocacoes"],
    ...campos,
  };
}

describe("calendarioIcs", () => {
  const ics = calendarioIcs(
    [
      encontro({}),
      encontro({ id: "e2", inicio: null, fim: null, data: "2026-11-30", tipo: "reuniao", turmaNome: null, numeroAula: null }),
      encontro({ id: "cancelado", canceladoEm: "2026-11-10T00:00:00Z" }),
      encontro({ id: "fechou", turmaStatus: "nao_abriu" }),
    ],
    new Date("2026-11-14T12:00:00.000Z"),
  );
  const linhas = ics.split("\r\n");

  it("evento com horário no fuso de Brasília, título, local e equipe sem quem saiu", () => {
    expect(linhas).toContain("UID:e1@gestao.minds");
    expect(linhas).toContain("DTSTAMP:20261114T120000Z");
    expect(linhas).toContain("DTSTART;TZID=America/Sao_Paulo:20261120T140000");
    expect(linhas).toContain("DTEND;TZID=America/Sao_Paulo:20261120T173000");
    expect(linhas).toContain("SUMMARY:Lego · Aula 3 · 9º A");
    expect(linhas).toContain("LOCATION:EE Delfim\\, Moreira");
    expect(linhas).toContain("DESCRIPTION:Equipe: Ana");
  });

  it("sem horário vira dia inteiro; cancelado e turma que não abriu vão como cancelados", () => {
    expect(linhas).toContain("DTSTART;VALUE=DATE:20261130");
    expect(linhas).toContain("DTEND;VALUE=DATE:20261201");
    const bloco = (uid: string) => ics.slice(ics.indexOf(`UID:${uid}`), ics.indexOf("END:VEVENT", ics.indexOf(`UID:${uid}`)));
    expect(bloco("cancelado")).toContain("STATUS:CANCELLED");
    expect(bloco("fechou")).toContain("STATUS:CANCELLED");
    expect(bloco("e1")).not.toContain("STATUS:CANCELLED");
  });

  it("meus encontros: alocada ou cobrindo; não quem faltou, foi substituída ou coberta inteira", () => {
    const a = (campos: object) => ({ bolsistaId: "ana", situacao: "prevista", cobertoPor: null, inicio: null, ...campos }) as Encontro["alocacoes"][number];
    expect(estaNoEncontro(a({}), "ana")).toBe(true);
    expect(estaNoEncontro(a({ situacao: "cumprida", cobertoPor: "rui", inicio: "09:00" }), "ana")).toBe(true);
    expect(estaNoEncontro(a({ cobertoPor: "rui" }), "ana")).toBe(false);
    expect(estaNoEncontro(a({ situacao: "faltou_avisou" }), "ana")).toBe(false);
    expect(estaNoEncontro(a({ situacao: "substituida" }), "ana")).toBe(false);
    expect(estaNoEncontro(a({ situacao: "faltou_avisou", cobertoPor: "rui" }), "rui")).toBe(true);
    expect(estaNoEncontro(a({ situacao: "substituida", cobertoPor: "rui" }), "rui")).toBe(false);
    expect(estaNoEncontro(a({}), "rui")).toBe(false);
  });

  it("linha longa dobra em até 75 bytes", () => {
    const longo = calendarioIcs([encontro({ modalidade: "Educação Financeira ".repeat(10).trim() })]);
    for (const l of longo.split("\r\n")) expect(Buffer.byteLength(l)).toBeLessThanOrEqual(75);
    expect(longo).toContain("\r\n ");
  });
});
