import { beforeEach, describe, expect, it, vi } from "vitest";

const estado = {
  usuario: "user-1" as string | null,
  linha: null as { dados: unknown; atualizado_em: string } | null,
  erroLeitura: null as { message: string } | null,
  erroEscrita: null as { message: string } | null,
};

const chamadas = {
  eq: vi.fn(),
  upsert: vi.fn(),
  from: vi.fn(),
};

const mockClient = {
  from: (tabela: string) => {
    chamadas.from(tabela);
    return {
      select: () => ({
        eq: (coluna: string, valor: string) => {
          chamadas.eq(coluna, valor);
          return { maybeSingle: async () => ({ data: estado.linha, error: estado.erroLeitura }) };
        },
      }),
      upsert: (linha: Record<string, unknown>, opcoes: unknown) => {
        chamadas.upsert(linha, opcoes);
        return {
          select: () => ({
            single: async () => ({ data: estado.erroEscrita ? null : { atualizado_em: linha.atualizado_em }, error: estado.erroEscrita }),
          }),
        };
      },
    };
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
  usuarioDaRequisicao: async () => estado.usuario,
}));

import { GET, PUT } from "@/app/api/lg2/progresso/route";

function put(corpo: unknown, bruto?: string) {
  return new Request("http://local/api/lg2/progresso", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: bruto ?? JSON.stringify(corpo),
  });
}

describe("/api/lg2/progresso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    estado.usuario = "user-1";
    estado.linha = null;
    estado.erroLeitura = null;
    estado.erroEscrita = null;
  });

  it("GET sem login responde 401 em JSON e não consulta o banco", async () => {
    estado.usuario = null;
    const r = await GET();
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: "Usuário não autenticado." });
    expect(chamadas.from).not.toHaveBeenCalled();
  });

  it("GET sem cópia guardada devolve dados null com o id da pessoa", async () => {
    const r = await GET();
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(await r.json()).toEqual({ u: "user-1", dados: null, atualizado_em: null });
    expect(chamadas.from).toHaveBeenCalledWith("lg2_progresso");
    expect(chamadas.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("GET devolve a cópia da própria pessoa", async () => {
    estado.linha = { dados: { "lg2-jornada": "{\"v\":1}" }, atualizado_em: "2026-11-12T10:00:00.000Z" };
    const r = await GET();
    expect(await r.json()).toEqual({ u: "user-1", dados: { "lg2-jornada": "{\"v\":1}" }, atualizado_em: "2026-11-12T10:00:00.000Z" });
  });

  it("GET com falha no banco responde 500 sem detalhes", async () => {
    estado.erroLeitura = { message: "relation does not exist" };
    const r = await GET();
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: "Não foi possível carregar o progresso." });
  });

  it("PUT sem login responde 401", async () => {
    estado.usuario = null;
    const r = await PUT(put({ dados: {} }));
    expect(r.status).toBe(401);
    expect(chamadas.upsert).not.toHaveBeenCalled();
  });

  it("PUT grava só as chaves lg2-* em texto, na linha da própria pessoa", async () => {
    const r = await PUT(put({
      dados: {
        "lg2-jornada": "{\"v\":1,\"feitos\":[1]}",
        "lg2-turma-a-m01": "{\"R\":{}}",
        "lg2-sync": "{\"u\":\"x\"}",
        "outra-chave": "x",
        "lg2-numero": 5,
        "lg2-com espaço": "x",
      },
      user_id: "outra-pessoa",
    }));
    expect(r.status).toBe(200);
    const corpo = await r.json();
    expect(corpo.ok).toBe(true);
    expect(corpo.u).toBe("user-1");
    expect(Number.isNaN(Date.parse(corpo.atualizado_em))).toBe(false);
    expect(chamadas.upsert).toHaveBeenCalledTimes(1);
    const [linha, opcoes] = chamadas.upsert.mock.calls[0];
    expect(linha.user_id).toBe("user-1");
    expect(linha.dados).toEqual({ "lg2-jornada": "{\"v\":1,\"feitos\":[1]}", "lg2-turma-a-m01": "{\"R\":{}}" });
    expect(opcoes).toEqual({ onConflict: "user_id" });
  });

  it.each([
    ["JSON quebrado", undefined, "{"],
    ["dados ausente", {}, undefined],
    ["dados lista", { dados: ["lg2-x"] }, undefined],
    ["dados texto", { dados: "lg2" }, undefined],
    ["corpo lista", [1], undefined],
  ])("PUT recusa %s com 400", async (_nome, corpo, bruto) => {
    const r = await PUT(put(corpo, bruto));
    expect(r.status).toBe(400);
    expect(chamadas.upsert).not.toHaveBeenCalled();
  });

  it("PUT recusa corpo acima de 500 KB com 413", async () => {
    const r = await PUT(put({ dados: { "lg2-grande": "x".repeat(500 * 1024) } }));
    expect(r.status).toBe(413);
    expect(chamadas.upsert).not.toHaveBeenCalled();
  });

  it("PUT logo abaixo do limite passa", async () => {
    const r = await PUT(put({ dados: { "lg2-grande": "x".repeat(400 * 1024) } }));
    expect(r.status).toBe(200);
  });

  it("PUT com falha no banco responde 500 sem detalhes", async () => {
    estado.erroEscrita = { message: "new row violates row-level security policy" };
    const r = await PUT(put({ dados: { "lg2-jornada": "{}" } }));
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: "Não foi possível salvar o progresso." });
  });
});
