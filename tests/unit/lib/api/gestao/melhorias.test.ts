import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { mapMelhoria, ordenarFila, pendenciasDeMelhoria, PROXIMOS_STATUS } from "@/lib/api/gestao/melhorias";
import { validarMelhoria, validarRespostaMelhoria } from "@/lib/api/gestao/validacao";
import type { Melhoria, MelhoriaRow } from "@/lib/api/gestao/types";

function linha(parcial: Partial<MelhoriaRow>): MelhoriaRow {
  return {
    id: "m",
    autor: "u-bia",
    autor_nome: "Bia",
    titulo: "Pedido",
    area: "gestao",
    problema: "Um problema real descrito.",
    proposta: "Uma proposta.",
    quem_sofre: null,
    status: "nova",
    resposta: null,
    duplicada_de: null,
    link_execucao: null,
    respondida_em: null,
    criado_em: "2026-09-01T12:00:00Z",
    atualizado_em: "2026-09-01T12:00:00Z",
    apoios: 0,
    apoiei: false,
    atrasada: false,
    ...parcial,
  };
}

function form(campos: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

describe("pedido de melhoria (spec 011)", () => {
  it("fila da coordenação: atrasadas primeiro, depois novas mais antigas, decididas por último", () => {
    const fila: Melhoria[] = [
      linha({ id: "aceita", status: "aceita", criado_em: "2026-09-10T00:00:00Z" }),
      linha({ id: "nova-recente", criado_em: "2026-09-20T00:00:00Z" }),
      linha({ id: "recusada", status: "recusada", criado_em: "2026-09-21T00:00:00Z" }),
      linha({ id: "atrasada", atrasada: true, criado_em: "2026-08-01T00:00:00Z" }),
      linha({ id: "nova-antiga", criado_em: "2026-09-12T00:00:00Z" }),
      linha({ id: "em-analise", status: "em_analise", criado_em: "2026-09-05T00:00:00Z" }),
    ].map(mapMelhoria);

    expect(ordenarFila(fila).map((m) => m.id)).toEqual([
      "atrasada",
      "nova-antiga",
      "nova-recente",
      "em-analise",
      "aceita",
      "recusada",
    ]);
  });

  it("tela Hoje: coordenação conta as que esperam; bolsista vê as próprias respondidas na semana", () => {
    const agora = new Date("2026-09-23T12:00:00Z");
    const melhorias = [
      linha({ id: "a", atrasada: true }),
      linha({ id: "b" }),
      linha({ id: "c", status: "aceita", respondida_em: "2026-09-22T10:00:00Z", resposta: "Vamos fazer." }),
      linha({ id: "d", status: "recusada", respondida_em: "2026-09-01T10:00:00Z", resposta: "Fora do escopo agora." }),
      linha({ id: "e", autor: "u-leo", status: "aceita", respondida_em: "2026-09-22T10:00:00Z" }),
    ].map(mapMelhoria);

    const coord = pendenciasDeMelhoria("coordenacao", "u-cris", melhorias, agora);
    expect(coord).toEqual([
      expect.objectContaining({
        titulo: "2 pedidos de melhoria esperam resposta",
        detalhe: "1 há mais de 14 dias",
        urgente: true,
      }),
    ]);

    const bia = pendenciasDeMelhoria("bolsista", "u-bia", melhorias, agora);
    expect(bia.map((p) => [p.titulo, p.href])).toEqual([['Seu pedido "Pedido" está aceita', "/gestao/melhorias/c"]]);
  });

  it("valida o pedido e exige motivo ao recusar, espelhando as regras do banco", () => {
    expect(
      validarMelhoria(form({ titulo: "Oi", area: "gestao", problema: "Um problema real.", proposta: "Algo" })),
    ).toMatchObject({ ok: false });
    expect(
      validarMelhoria(form({ titulo: "Chamada offline", area: "gestao", problema: "Sem sinal na escola.", proposta: "Guardar local" })),
    ).toMatchObject({ ok: true, valor: { quemSofre: null } });

    expect(validarRespostaMelhoria(form({ status: "recusada", resposta: "não" }))).toMatchObject({ ok: false });
    expect(validarRespostaMelhoria(form({ status: "duplicada", resposta: "Já foi pedido antes." }))).toEqual({
      ok: false,
      mensagem: "Aponte qual é o pedido original.",
    });
    expect(validarRespostaMelhoria(form({ status: "aceita", linkExecucao: "trello.com/c/x" }))).toMatchObject({ ok: false });
    expect(
      validarRespostaMelhoria(form({ status: "aceita", linkExecucao: "https://trello.com/c/x", duplicadaDe: "ignorado" })),
    ).toEqual({ ok: true, valor: { status: "aceita", resposta: null, duplicadaDe: null, linkExecucao: "https://trello.com/c/x" } });

    expect(PROXIMOS_STATUS.recusada).toEqual([]);
    expect(PROXIMOS_STATUS.aceita).toEqual(["entregue"]);
  });
});
