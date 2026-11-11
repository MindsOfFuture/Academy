import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
let escolas: { id: string; nome: string }[] = [];
let agenda: { data: string; escola_id: string | null; inicio: string; fim: string }[] = [];

function consulta(linhas: () => unknown[]) {
  const q = { data: null as unknown, error: null, gte: () => q, lte: () => q };
  Object.defineProperty(q, "data", { get: linhas });
  return q;
}

const schema = vi.fn(() => ({
  rpc,
  from: (tabela: string) => ({ select: () => consulta(() => (tabela === "escola" ? escolas : agenda)) }),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ schema })) }));

import { importarPlanilha } from "@/lib/api/gestao/importacao";

const evento = (data: string, escola: string | null) => ({
  celula: "A4", data, inicio: "08:00", fim: "12:00", escola, modalidade: "Lego", descricao: data === "2026-10-07" ? "" : "Aulas 01 e 02",
});

describe("importarPlanilha", () => {
  beforeEach(() => {
    rpc.mockReset().mockResolvedValue({ data: { id: "lote", encontros: 2, pulados: 0, escolas: 1, concluidos: 0 }, error: null });
    escolas = [{ id: "cec", nome: "E.M. Cecília Meireles" }];
    agenda = [{ data: "2026-10-05", escola_id: "cec", inicio: "08:00:00", fim: "12:00:00" }];
  });

  it("refaz a prévia, manda só o que não existe e aplica o ajuste da escola nova", async () => {
    const r = await importarPlanilha(
      " calendario.xlsx ",
      [evento("2026-10-05", "E.M Cecília Meireles"), evento("2026-10-06", "E.E. de Belmiro Braga"), evento("2026-10-07", null)],
      { "ee de belmiro braga": { categoria: "estadual", cidade: "Belmiro Braga (MG)" } },
    );
    expect(r).toMatchObject({ id: "lote", encontros: 2, escolas: 1, apagados: null });
    expect(rpc).toHaveBeenCalledWith("importar_planilha", {
      p_arquivo: "calendario.xlsx",
      p_escolas: [{ nome: "E.E. de Belmiro Braga", categoria: "estadual", cidade: "Belmiro Braga (MG)" }],
      p_encontros: [
        { data: "2026-10-06", inicio: "08:00", fim: "12:00", modalidade: "Lego", aulas: "Aulas 01 e 02", escola_id: null, escola_nova: "E.E. de Belmiro Braga" },
        { data: "2026-10-07", inicio: "08:00", fim: "12:00", modalidade: "Lego", aulas: "Lego", escola_id: null, escola_nova: null },
      ],
    });
  });

  it("recusa lixo, ajuste sem cidade e lote só de repetidos sem chamar o banco", async () => {
    await expect(importarPlanilha("a.xlsx", [{ data: "x" }])).rejects.toThrow(/^gestao: /);
    await expect(
      importarPlanilha("a.xlsx", [evento("2026-10-06", "Escola Saci")], { "escola saci": { categoria: "outra", cidade: "" } }),
    ).rejects.toThrow("gestao: informe a cidade da escola Escola Saci");
    await expect(importarPlanilha("a.xlsx", [evento("2026-10-05", "E.M. Cecília Meireles")])).rejects.toThrow(
      "gestao: nada novo para importar",
    );
    expect(rpc).not.toHaveBeenCalled();
  });
});
