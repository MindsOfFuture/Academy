// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { comoUsuario, gestaoAte, sqlDaMigracao } from "./helpers/gestao";

/**
 * Calendário da equipe (20261122). Ana está no encontro da escola real; Caio
 * em outro; Bia (conta de teste) num encontro da escola de teste. Rui não é
 * membro.
 */

// Sem a dos artigos (pede `public.article`). A última de novo: idempotência.
const MIGRATIONS = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
  sqlDaMigracao("20261114_gestao_numero_da_aula"),
  sqlDaMigracao("20261115_gestao_atrasos_e_metas"),
  sqlDaMigracao("20261116_gestao_espacos"),
  sqlDaMigracao("20261122_gestao_calendario_da_equipe"),
  sqlDaMigracao("20261122_gestao_calendario_da_equipe"),
];

const COORD = "7e000000-0000-4000-8000-000000000001";
const ANA = "7e000000-0000-4000-8000-000000000002";
const CAIO = "7e000000-0000-4000-8000-000000000003";
const BIA = "7e000000-0000-4000-8000-000000000004";
const RUI = "7e000000-0000-4000-8000-000000000005";
const ESCOLA = "7f000000-0000-4000-8000-000000000001";
const ESCOLA_TESTE = "7f000000-0000-4000-8000-000000000002";

interface Linha {
  modalidade: string;
  escola: string | null;
  equipe: string[];
  minha: boolean;
}

describe("calendário da equipe (20261122)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const como = comoUsuario(db);

  async function encontro(data: string, escola: string | null, modalidade: string, pessoas: string[]): Promise<string> {
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    try {
      const id = (
        await db.query<{ id: string }>(
          `insert into gestao.agenda (data, escola_id, aulas, modalidade, inicio, fim)
           values ($1, $2, $3, $3, '08:00', '12:00') returning id`,
          [data, escola, modalidade],
        )
      ).rows[0].id;
      for (const p of pessoas) await db.query(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ($1, $2)`, [id, p]);
      return id;
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

  const calendario = (uid: string, de = "2026-10-01", ate = "2026-10-31") =>
    como(uid, async () =>
      (
        await db.query<Linha>(
          `select modalidade, escola, equipe, minha from gestao.calendario_da_equipe($1, $2)`,
          [de, ate],
        )
      ).rows,
    );

  beforeAll(async () => {
    const pessoas: [string, string][] = [[COORD, "Coord"], [ANA, "Ana"], [CAIO, "Caio"], [BIA, "Bia"], [RUI, "Rui"]];
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;

      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;

      create table public.user_profile (id uuid primary key, full_name text not null, email text not null, document text);
      alter table public.user_profile enable row level security;
      create table public.system_config (key text primary key, value text, updated_at timestamptz);
      grant usage on schema public to anon, authenticated;
      grant select on public.user_profile to authenticated;
      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text, type text, payload jsonb, read_at timestamptz, created_at timestamptz default now()
      );
      alter table public.notification enable row level security;
      grant select, insert, update on public.notification to authenticated;

      insert into auth.users (id) values ${pessoas.map(([p]) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name, email) values
        ${pessoas.map(([p, n], i) => `('${p}', '${n}', 'p${i}@ufjf.br')`).join(", ")};
    `);
    for (const sql of MIGRATIONS) await db.exec(sql);
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista, teste) values
        ('${COORD}', true, false, false), ('${ANA}', false, true, false), ('${CAIO}', false, true, false),
        ('${BIA}', false, true, true);
      insert into gestao.escola (id, nome, categoria, cidade, teste) values
        ('${ESCOLA}', 'Escola real', 'estadual', 'Juiz de Fora', false),
        ('${ESCOLA_TESTE}', 'Escola E2E', 'estadual', 'Juiz de Fora', true);
    `);
    await db.exec(`reset request.jwt.claim.sub`);

    await encontro("2026-10-05", ESCOLA, "Lego", [ANA, CAIO]);
    await encontro("2026-10-06", ESCOLA, "Python", [CAIO]);
    await encontro("2026-10-07", null, "Reunião", [CAIO]);
    await encontro("2026-10-08", ESCOLA_TESTE, "Teste", [BIA]);
    await encontro("2026-10-09", null, "Reunião de teste", [BIA]);
    const retirada = await encontro("2026-10-12", ESCOLA, "IA", [ANA]);
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.query(`update gestao.agenda_bolsista set situacao = 'retirada', motivo = 'Troca de turma' where agenda_id = $1`, [retirada]);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("bolsista vê os encontros de toda a equipe real; `minha` só nos dele", async () => {
    const linhas = await calendario(ANA);
    expect(linhas.map((l) => [l.modalidade, l.minha])).toEqual([
      ["Lego", true],
      ["Python", false],
      ["Reunião", false],
      ["IA", false],
    ]);
    expect(linhas[0]).toMatchObject({ escola: "Escola real", equipe: ["Ana", "Caio"] });
    // Quem foi retirado não aparece na equipe.
    expect(linhas[3].equipe).toEqual([]);
  });

  it("conta de teste vê só os encontros de teste", async () => {
    expect((await calendario(BIA)).map((l) => l.modalidade)).toEqual(["Teste", "Reunião de teste"]);
  });

  it("recusa quem não é membro e período maior que 62 dias", async () => {
    await expect(calendario(RUI)).rejects.toThrow(/apenas membros/);
    await expect(calendario(ANA, "2026-10-01", "2026-12-31")).rejects.toThrow(/período inválido/);
  });

  it("não devolve nota, motivo nem atraso", async () => {
    const { rows } = await como(ANA, () =>
      db.query<Record<string, unknown>>(`select * from gestao.calendario_da_equipe('2026-10-01', '2026-10-31') limit 1`),
    );
    expect(Object.keys(rows[0]).sort()).toEqual(
      ["cancelado", "concluido", "data", "equipe", "escola", "espaco", "horario", "id", "minha", "modalidade", "numero_aula", "tipo", "turma"],
    );
  });
});
