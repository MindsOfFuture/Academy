import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { montarEncontros, type AgendaDoRelatorio } from "@/lib/api/gestao/relatorio";
import { validarAtividade } from "@/lib/api/gestao/validacao";

function agenda(id: string, data: string, extra: Partial<AgendaDoRelatorio> = {}): AgendaDoRelatorio {
  return { id, data, horario: "8h às 12h", inicio: null, modalidade: "Lego", aulas: null, cancelado_em: null, escola: { nome: "EE A" }, turma: null, agenda_bolsista: [], ...extra };
}

describe("montarEncontros — encontros do relatório", () => {
  it("lista onde a pessoa esteve, em ordem de data, e deixa de fora falta, retirada e cancelado", () => {
    const lista = montarEncontros(
      [
        { agenda_id: "b", situacao: "cumprida", horas: "4.00" },
        { agenda_id: "a", situacao: "cobertura", horas: 2 },
        { agenda_id: "c", situacao: "faltou_avisou", horas: 0 },
        { agenda_id: "d", situacao: "retirada", horas: 0 },
        { agenda_id: "e", situacao: "prevista", horas: 0 },
      ],
      [
        agenda("a", "2026-11-03", { aulas: "Robótica", turma: [{ nome: "Turma 1" }] }),
        agenda("b", "2026-11-05", { escola: null }),
        agenda("c", "2026-11-06"),
        agenda("d", "2026-11-07"),
        agenda("e", "2026-11-08", { cancelado_em: "2026-11-01T00:00:00Z" }),
      ],
    );
    expect(lista).toEqual([
      { encontroId: "a", data: "2026-11-03", horario: "8h às 12h", descricao: "Robótica", escolaNome: "EE A", turmaNome: "Turma 1", situacao: "cobertura", horas: 2, links: [], inicio: null, meuLink: null },
      { encontroId: "b", data: "2026-11-05", horario: "8h às 12h", descricao: "Lego", escolaNome: null, turmaNome: null, situacao: "cumprida", horas: 4, links: [], inicio: null, meuLink: null },
    ]);
  });

  it("junta os links de quem esteve no encontro, sem repetir, em ordem; quem faltou fica de fora", () => {
    const [encontro] = montarEncontros(
      [{ agenda_id: "a", situacao: "cumprida", horas: 4 }],
      [
        agenda("a", "2026-11-03", {
          agenda_bolsista: [
            { bolsista_id: "p1", situacao: "cumprida", link_comprovacao: "https://b.org" },
            { bolsista_id: "p2", situacao: "prevista", link_comprovacao: "https://a.org" },
            { bolsista_id: "p3", situacao: "cumprida", link_comprovacao: "https://b.org" },
            { bolsista_id: "p4", situacao: "faltou_avisou", link_comprovacao: "https://faltou.org" },
            { bolsista_id: "p5", situacao: "cumprida", link_comprovacao: null },
          ],
        }),
      ],
    );
    expect(encontro.links).toEqual(["https://a.org", "https://b.org"]);
  });

  it("meuLink é o da própria pessoa, só se esteve no encontro", () => {
    const encontros = (pessoa?: string) =>
      montarEncontros(
        [{ agenda_id: "a", situacao: "cumprida", horas: 4 }],
        [
          agenda("a", "2026-11-03", {
            inicio: "08:00",
            agenda_bolsista: [
              { bolsista_id: "eu", situacao: "cumprida", link_comprovacao: "https://meu.org" },
              { bolsista_id: "outro", situacao: "cumprida", link_comprovacao: "https://outro.org" },
              { bolsista_id: "faltou", situacao: "faltou_avisou", link_comprovacao: "https://faltou.org" },
            ],
          }),
        ],
        pessoa,
      )[0];
    expect(encontros("eu")).toMatchObject({ inicio: "08:00", meuLink: "https://meu.org" });
    expect(encontros("faltou").meuLink).toBeNull();
    expect(encontros("ninguem").meuLink).toBeNull();
    expect(encontros().meuLink).toBeNull();
  });
});

describe("validarAtividade", () => {
  function form(campos: Record<string, string>): FormData {
    const f = new FormData();
    for (const [k, v] of Object.entries(campos)) f.set(k, v);
    return f;
  }

  it("aceita nome e data", () => {
    expect(validarAtividade(form({ nome: "  Preparei a aula  ", data: "2026-11-04" }))).toEqual({
      ok: true,
      valor: { nome: "Preparei a aula", data: "2026-11-04", comprovacao: null },
    });
    expect(validarAtividade(form({ nome: "Reunião", data: "2026-11-04", comprovacao: " https://drive/x " }))).toMatchObject({
      valor: { comprovacao: "https://drive/x" },
    });
  });

  it("recusa sem nome, nome longo demais e sem data", () => {
    expect(validarAtividade(form({ nome: "a", data: "2026-11-04" })).ok).toBe(false);
    expect(validarAtividade(form({ nome: "x".repeat(201), data: "2026-11-04" })).ok).toBe(false);
    expect(validarAtividade(form({ nome: "Reunião", data: "" })).ok).toBe(false);
    expect(validarAtividade(form({ nome: "Reunião", data: "2026-11-04", comprovacao: "x".repeat(501) })).ok).toBe(false);
  });
});
