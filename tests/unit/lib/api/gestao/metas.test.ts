import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { ordenarMetas, pendenciasDeMeta, statusDaMeta } from "@/lib/api/gestao/metas";
import type { Meta } from "@/lib/api/gestao/types";

const HOJE = "2026-11-12";

function meta(id: string, prazo: string, extra: Partial<Meta> = {}): Meta {
  return {
    id,
    titulo: `Meta ${id}`,
    descricao: null,
    prazo,
    concluidaEm: null,
    criadoEm: "2026-11-01T12:00:00Z",
    responsaveis: [{ id: "ana", nome: "Ana" }],
    andamentos: [],
    ...extra,
  };
}

describe("statusDaMeta", () => {
  it("prazo hoje está em dia; ontem, atrasada; concluída vence o prazo", () => {
    expect(statusDaMeta(meta("a", HOJE), HOJE)).toBe("em_dia");
    expect(statusDaMeta(meta("b", "2026-11-11"), HOJE)).toBe("atrasada");
    expect(statusDaMeta(meta("c", "2026-11-11", { concluidaEm: "2026-11-12T10:00:00Z" }), HOJE)).toBe("concluida");
  });

  it("ordena: atrasadas, em dia pelo prazo, concluídas", () => {
    const metas = [
      meta("feita", "2026-10-01", { concluidaEm: "2026-10-01T10:00:00Z" }),
      meta("longe", "2026-12-30"),
      meta("perto", "2026-11-20"),
      meta("vencida", "2026-11-01"),
    ];
    expect(ordenarMetas(metas, HOJE).map((m) => m.id)).toEqual(["vencida", "perto", "longe", "feita"]);
  });
});

describe("pendenciasDeMeta", () => {
  it("só a meta atrasada, só para quem é responsável", () => {
    const metas = [
      meta("vencida", "2026-11-01"),
      meta("em-dia", "2026-12-01"),
      meta("feita", "2026-11-01", { concluidaEm: "2026-11-02T10:00:00Z" }),
      meta("de-outro", "2026-11-01", { responsaveis: [{ id: "caio", nome: "Caio" }] }),
    ];
    expect(pendenciasDeMeta("ana", metas, HOJE)).toEqual([
      {
        tipo: "meta_atrasada",
        titulo: 'Meta "Meta vencida" está atrasada',
        detalhe: "Prazo: 01/11",
        href: "/gestao/metas/vencida",
        urgente: true,
      },
    ]);
    expect(pendenciasDeMeta("", metas, HOJE)).toEqual([]);
  });
});
