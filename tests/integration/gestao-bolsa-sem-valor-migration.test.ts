// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Spec 003, alterada em 28/09/2026 — a bolsa não guarda valor em dinheiro.
 * Prova em PostgreSQL real que a coluna sai mesmo com bolsa já cadastrada, que
 * a equipe continua mostrando modalidade, carga e vigência, e que o acesso por
 * papel da bolsa não muda.
 */

const ATE_AQUI = [
  "supabase/migrations/20260905_gestao_modelo_operacional.sql",
  "supabase/migrations/20260905_gestao_membro_rpc.sql",
  "supabase/migrations/20260923_gestao_fundacao.sql",
  "supabase/migrations/20260924_gestao_melhorias.sql",
  "supabase/migrations/20260928_gestao_papeis_acumulados.sql",
].map((path) => readFileSync(path, "utf8"));
const SEM_VALOR = readFileSync("supabase/migrations/20260928_gestao_sem_valor_na_bolsa.sql", "utf8");

const COORD = "20000000-0000-4000-8000-000000000001";
const BIA = "20000000-0000-4000-8000-000000000002";
const CAIO = "20000000-0000-4000-8000-000000000003";

describe("bolsa sem valor em dinheiro (spec 003, 28/09/2026)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });

  async function como<T>(uid: string, fn: () => Promise<T>): Promise<T> {
    await db.exec(`set role authenticated`);
    await db.exec(`set request.jwt.claim.sub = '${uid}'`);
    try {
      return await fn();
    } finally {
      await db.exec(`reset role`);
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

  async function linhas<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    return (await db.query<T>(sql)).rows;
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
      alter table public.user_profile enable row level security;
      create policy "Users view own profile" on public.user_profile
        for select to authenticated using (auth.uid() = id);
      grant usage on schema public to anon, authenticated;
      grant select on public.user_profile to authenticated;

      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text check (channel in ('email', 'in-app')),
        type text,
        payload jsonb,
        read_at timestamptz,
        created_at timestamptz default now()
      );
      alter table public.notification enable row level security;
      create policy "Own notifications only" on public.notification using (user_id = auth.uid());
      grant select, insert, update on public.notification to authenticated;

      insert into auth.users (id) values ('${COORD}'), ('${BIA}'), ('${CAIO}');
      insert into public.user_profile (id, full_name, email) values
        ('${COORD}', 'Cris Coordenação', 'cris@ufjf.br'),
        ('${BIA}', 'Bia Bolsista', 'bia@estudante.ufjf.br'),
        ('${CAIO}', 'Caio Bolsista', 'caio@estudante.ufjf.br');
    `);

    for (const sql of ATE_AQUI) await db.exec(sql);

    // Equipe e uma bolsa cadastradas antes da mudança, ainda com valor.
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false),
        ('${BIA}', false, true),
        ('${CAIO}', false, true);
      insert into gestao.bolsa (bolsista_id, modalidade, carga_semanal_horas, valor_mensal, inicio, fim)
        values ('${BIA}', 'graduacao', 12, 700, '2026-01-01', '2099-12-31');
    `);
    await db.exec(`reset request.jwt.claim.sub`);

    await db.exec(SEM_VALOR);
    // Idempotência: roda de novo sem erro.
    await db.exec(SEM_VALOR);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("a bolsa não tem mais campo de valor, e a bolsa que já existia continua lá", async () => {
    const colunas = await linhas<{ c: string }>(
      `select column_name as c from information_schema.columns
        where table_schema = 'gestao' and table_name = 'bolsa' order by ordinal_position`,
    );
    expect(colunas.map((l) => l.c)).not.toContain("valor_mensal");
    expect(colunas.map((l) => l.c)).toEqual(expect.arrayContaining(["modalidade", "carga_semanal_horas", "inicio", "fim"]));

    const bolsas = await linhas<{ n: number }>(`select count(*)::int as n from gestao.bolsa`);
    expect(bolsas[0].n).toBe(1);
  });

  it("a equipe mostra modalidade, carga e vigência, sem valor", async () => {
    const equipe = await como(COORD, () => linhas(`select * from gestao.equipe() where user_profile_id = '${BIA}'`));
    expect(equipe).toHaveLength(1);
    expect(Object.keys(equipe[0])).not.toContain("valor_mensal");
    expect(equipe[0]).toMatchObject({
      nome: "Bia Bolsista",
      bolsista: true,
      modalidade: "graduacao",
      bolsa_fim: expect.anything(),
    });
    expect(String(equipe[0].carga_semanal_horas)).toBe("12.0");
  });

  it("a coordenação cadastra bolsa só com modalidade, carga e vigência", async () => {
    await como(COORD, () =>
      db.exec(`insert into gestao.bolsa (bolsista_id, modalidade, carga_semanal_horas, inicio, fim)
               values ('${CAIO}', 'mestrado', 20, '2026-03-01', '2099-02-28')`),
    );
    const [caio] = await como(COORD, () =>
      linhas<{ modalidade: string }>(`select modalidade from gestao.equipe() where user_profile_id = '${CAIO}'`),
    );
    expect(caio.modalidade).toBe("mestrado");
  });

  it("o acesso à bolsa não muda: bolsista lê só a própria e não vê a equipe", async () => {
    const propria = await como(BIA, () => linhas<{ bolsista_id: string }>(`select bolsista_id::text from gestao.bolsa`));
    expect(propria).toEqual([{ bolsista_id: BIA }]);
    await expect(como(BIA, () => db.query(`select * from gestao.equipe()`))).rejects.toThrow(/apenas a coordenação/);
  });
});
