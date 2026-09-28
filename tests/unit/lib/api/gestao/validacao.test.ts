import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { lerNumero, mensagemDeErro, validarBolsa } from "@/lib/api/gestao/validacao";
import { montarPendencias } from "@/lib/api/gestao/pendencias";
import { mapMembro } from "@/lib/api/gestao/equipe";
import type { MembroEquipe } from "@/lib/api/gestao/types";

function form(campos: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

const BOLSA_OK = {
  bolsistaId: "b-1",
  modalidade: "graduacao",
  cargaSemanalHoras: "20,5",
  inicio: "2026-03-01",
  fim: "2026-12-31",
};

describe("validação e montagem da gestão (spec 003)", () => {
  it("aceita bolsa válida lendo a carga em formato brasileiro, sem valor em dinheiro, e recusa carga e vigência inválidas", () => {
    // Um valor enviado por fora do formulário é ignorado: a bolsa não guarda dinheiro.
    const ok = validarBolsa(form({ ...BOLSA_OK, valorMensal: "700,00" }));
    expect(ok).toEqual({
      ok: true,
      valor: { ...BOLSA_OK, cargaSemanalHoras: 20.5 },
    });
    expect(validarBolsa(form({ ...BOLSA_OK, cargaSemanalHoras: "41" }))).toMatchObject({ ok: false });
    expect(validarBolsa(form({ ...BOLSA_OK, fim: "2026-02-01" }))).toEqual({
      ok: false,
      mensagem: "O fim da vigência não pode ser antes do início.",
    });
    expect(lerNumero("abc")).toBeNull();
    expect(lerNumero("1.200,50")).toBe(1200.5);
  });

  it("traduz o erro do banco para uma frase que a coordenação entende", () => {
    expect(mensagemDeErro(new Error("gestao: o projeto precisa de ao menos uma pessoa ativa na coordenação"))).toBe(
      "O projeto precisa de ao menos uma pessoa ativa na coordenação.",
    );
    expect(
      mensagemDeErro(new Error('violates RESTRICT setting of foreign key constraint "agenda_bolsista_bolsista_id_papel_membro_fkey"')),
    ).toMatch(/Desligar/);
    expect(mensagemDeErro(new Error("new row violates row-level security policy"))).toBe(
      "Você não tem permissão para fazer isso.",
    );
  });

  it("monta a tela Hoje: aula passada sem registro é urgente, bolsista sem bolsa só aparece à coordenação", () => {
    const semBolsa: MembroEquipe = mapMembro({
      user_profile_id: "b-2",
      nome: "Bia",
      email: "bia@x",
      coordenacao: false,
      bolsista: true,
      desligado_em: null,
      membro_desde: "2026-01-01T00:00:00Z",
      bolsa_id: null,
      modalidade: null,
      carga_semanal_horas: null,
      bolsa_inicio: null,
      bolsa_fim: null,
      tem_alocacao: false,
    });
    const agendas = [
      { id: "a1", data: "2026-09-20", horario: "08h", modalidade: "lego", escola: { nome: "Escola A" }, aula: [] },
      { id: "a2", data: "2026-09-21", horario: "08h", modalidade: "lego", escola: [{ nome: "Escola B" }], aula: [{ id: "x" }] },
      { id: "a3", data: "2026-09-23", horario: "10h", modalidade: "lego", escola: null, aula: [] },
    ];

    const coord = montarPendencias({ papel: "coordenacao", hoje: "2026-09-23", agendas, equipe: [semBolsa] });
    expect(coord.map((p) => [p.tipo, p.titulo])).toEqual([
      ["aula_sem_registro", "Aula de 20/09 sem registro"],
      ["bolsista_sem_bolsa", "Bia está sem bolsa vigente"],
      ["proxima_aula", "Hoje · Escola"],
    ]);
    expect(coord[0].urgente).toBe(true);

    const bolsista = montarPendencias({ papel: "bolsista", hoje: "2026-09-23", agendas, equipe: [semBolsa] });
    expect(bolsista.some((p) => p.tipo === "bolsista_sem_bolsa")).toBe(false);

    // Spec 012: quem é coordenação e bolsista também aparece sem bolsa; só coordenação, não.
    const coordBolsista = { ...semBolsa, userProfileId: "c-1", nome: "Cris", coordenacao: true };
    const soCoord = { ...semBolsa, userProfileId: "c-2", nome: "Dani", coordenacao: true, bolsista: false };
    const titulos = montarPendencias({ papel: "coordenacao", hoje: "2026-09-23", agendas: [], equipe: [coordBolsista, soCoord] })
      .filter((p) => p.tipo === "bolsista_sem_bolsa")
      .map((p) => p.titulo);
    expect(titulos).toEqual(["Cris está sem bolsa vigente"]);
  });

  it("explica que ninguém fica sem papel", () => {
    expect(
      mensagemDeErro(new Error('new row for relation "papel_membro" violates check constraint "papel_membro_algum_papel"')),
    ).toBe("A pessoa precisa ficar com ao menos um papel. Para tirar o acesso, use “Desligar”.");
  });
});
