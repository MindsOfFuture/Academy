// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { gestaoAte, sqlDaMigracao } from "./helpers/gestao";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Números da homepage (20261108). Prova que escolas e alunos são a base do
 * system_config mais o que está cadastrado na gestão, que o anon consegue
 * lê-los, e que escola de teste e turma que não abriu ficam de fora.
 */

// A última de novo: idempotência.
const MIGRATIONS = [...gestaoAte("20261108_gestao_numeros_da_home"), sqlDaMigracao("20261108_gestao_numeros_da_home")];

const COORD = "50000000-0000-4000-8000-000000000001";
const REAL = "50000000-0000-4000-8000-000000000011";
const TESTE = "50000000-0000-4000-8000-000000000012";

describe("números da homepage (20261108)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });

  async function numeros(): Promise<{ escolas: number; alunos: number }> {
    await db.exec(`set role anon`);
    try {
      return (await db.query<{ escolas: number; alunos: number }>(`select * from public.numeros_da_home()`)).rows[0];
    } finally {
      await db.exec(`reset role`);
    }
  }

  beforeAll(async () => {
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
      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid references public.user_profile (id), channel text, type text, payload jsonb,
        read_at timestamptz, created_at timestamptz default now()
      );
      create table public.system_config (key text primary key, value text);
      insert into public.system_config values ('alunos_atendidos', '1499'), ('escolas_atendidas', '35');
      grant usage on schema public to anon, authenticated;

      insert into auth.users values ('${COORD}');
      insert into public.user_profile values ('${COORD}', 'Coord', 'c@ufjf.br');
    `);
    for (const sql of MIGRATIONS) await db.exec(sql);

    await db.exec(`
      set request.jwt.claim.sub = '${COORD}';
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values ('${COORD}', true, false);
      insert into gestao.escola (id, nome, categoria, cidade, teste) values
        ('${REAL}', 'Escola real', 'estadual', 'Juiz de Fora', false),
        ('${TESTE}', 'Escola E2E', 'estadual', 'Juiz de Fora', true);
      reset request.jwt.claim.sub;
    `);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("sem turmas, alunos é a base; escolas soma só a escola real", async () => {
    expect(await numeros()).toEqual({ escolas: 36, alunos: 1499 });
  });

  it("soma turmas reais; ignora sem número, de teste e que não abriu", async () => {
    await db.exec(`
      set request.jwt.claim.sub = '${COORD}';
      insert into gestao.turma (escola_id, nome, modalidade, inicio, n_alunos, status, motivo) values
        ('${REAL}', 'Lego', 'Lego', '2026-11-01', 25, 'prevista', null),
        ('${REAL}', 'IA', 'IA', '2026-11-01', null, 'em_andamento', null),
        ('${REAL}', 'Fechou', 'IA', '2026-11-01', 40, 'nao_abriu', 'sem inscritos'),
        ('${TESTE}', 'E2E', 'Lego', '2026-11-01', 100, 'prevista', null);
      reset request.jwt.claim.sub;
    `);
    expect(await numeros()).toEqual({ escolas: 36, alunos: 1524 });
  });

  it("recusa número negativo", async () => {
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await expect(db.exec(`update gestao.turma set n_alunos = -1 where nome = 'Lego'`)).rejects.toThrow(/check/);
    await db.exec(`reset request.jwt.claim.sub`);
  });
});
