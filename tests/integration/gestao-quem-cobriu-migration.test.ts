// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { gestaoAte, sqlDaMigracao, comoUsuario } from "./helpers/gestao";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Quem cobriu vê o encontro (20261108). Bia falta e Caio cobre o encontro
 * inteiro, sem alocação própria: o relatório do Caio lê as mesmas linhas que
 * `encontrosDoMes` lê — `v_carga` e o encontro — e precisa achar as 4 h.
 */

// A última de novo: idempotência.
const MIGRATIONS = [...gestaoAte("20261108_gestao_quem_cobriu_ve_o_encontro"), sqlDaMigracao("20261108_gestao_quem_cobriu_ve_o_encontro")];

const COORD = "70000000-0000-4000-8000-000000000001";
const BIA = "70000000-0000-4000-8000-000000000002";
const CAIO = "70000000-0000-4000-8000-000000000003";
const DUDA = "70000000-0000-4000-8000-000000000004";
const ESCOLA = "71000000-0000-4000-8000-000000000001";

describe("quem cobriu vê o encontro (20261108)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  let encontro = "";

  const como = comoUsuario(db);

  /** O que o relatório lê: horas em `v_carga` e o encontro em `agenda`. */
  async function relatorio(uid: string) {
    return como(uid, async () => ({
      carga: (await db.query<{ situacao: string; horas: string }>(
        `select situacao, horas::text from gestao.v_carga where bolsista_id = '${uid}'`,
      )).rows,
      encontros: (await db.query(`select id from gestao.agenda where id = '${encontro}'`)).rows.length,
    }));
  }

  beforeAll(async () => {
    const pessoas = [COORD, BIA, CAIO, DUDA];
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

      create table public.user_profile (id uuid primary key, full_name text not null, email text not null);
      alter table public.user_profile enable row level security;
      create table public.system_config (key text primary key, value text);
      grant usage on schema public to anon, authenticated;
      grant select on public.user_profile to authenticated;
      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text, type text, payload jsonb, read_at timestamptz, created_at timestamptz default now()
      );
      alter table public.notification enable row level security;
      grant select, insert, update on public.notification to authenticated;

      insert into auth.users (id) values ${pessoas.map((p) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name, email) values
        ${pessoas.map((p, i) => `('${p}', 'Pessoa ${i}', 'p${i}@ufjf.br')`).join(", ")};
    `);
    for (const sql of MIGRATIONS) await db.exec(sql);

    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false), ('${BIA}', false, true), ('${CAIO}', false, true), ('${DUDA}', false, true);
      insert into gestao.escola (id, nome, categoria, cidade) values ('${ESCOLA}', 'Escola 1', 'estadual', 'Juiz de Fora');
    `);
    encontro = (
      await db.query<{ id: string }>(
        `insert into gestao.agenda (data, escola_id, aulas, modalidade, inicio, fim)
         values ('2026-10-05', '${ESCOLA}', 'Lego', 'Lego', '08:00', '12:00') returning id`,
      )
    ).rows[0].id;
    // Bia alocada; Caio cobre o encontro inteiro dela, sem alocação própria.
    await db.exec(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ('${encontro}', '${BIA}')`);
    await db.exec(`update gestao.agenda_bolsista set coberto_por = '${CAIO}' where agenda_id = '${encontro}'`);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("o relatório de quem cobriu tem o encontro e as horas da cobertura", async () => {
    expect(await relatorio(CAIO)).toEqual({ carga: [{ situacao: "cobertura", horas: "4.00" }], encontros: 1 });
  });

  it("quem não tem nada com o encontro continua sem vê-lo", async () => {
    expect(await relatorio(DUDA)).toEqual({ carga: [], encontros: 0 });
  });
});
