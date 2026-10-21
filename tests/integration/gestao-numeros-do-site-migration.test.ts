// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Spec 019 — a coordenação muda os números da página inicial. A tabela de
 * configuração do site nasceu no painel (ADR 008); aqui ela tem o pior caso:
 * RLS ligada e nenhuma policy de escrita. Só a função da migration escreve.
 */

const MIGRATIONS = [
  "supabase/migrations/20260905_gestao_modelo_operacional.sql",
  "supabase/migrations/20260905_gestao_membro_rpc.sql",
  "supabase/migrations/20260923_gestao_fundacao.sql",
  "supabase/migrations/20260924_gestao_melhorias.sql",
  "supabase/migrations/20260928_gestao_papeis_acumulados.sql",
  "supabase/migrations/20260928_gestao_sem_valor_na_bolsa.sql",
];
const NOVA = "supabase/migrations/20261021_gestao_numeros_do_site.sql";

const COORD = "10000000-0000-4000-8000-000000000001";
const BOLSISTA = "20000000-0000-4000-8000-000000000001";
const ALUNO = "30000000-0000-4000-8000-000000000001";

describe("números da página inicial (spec 019)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });

  async function como<T>(uid: string | null, sql: string, params: unknown[] = []): Promise<T[]> {
    await db.exec(uid ? `set role authenticated` : `set role anon`);
    if (uid) await db.exec(`set request.jwt.claim.sub = '${uid}'`);
    try {
      return (await db.query<T>(sql, params)).rows;
    } finally {
      await db.exec(`reset role`);
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

  async function numeros(): Promise<Record<string, string>> {
    const { rows } = await db.query<{ key: string; value: string }>(
      `select key, value from public.system_config where key in ('escolas_atendidas', 'alunos_atendidos')`,
    );
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  beforeAll(async () => {
    const todos = [COORD, BOLSISTA, ALUNO];
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;

      create table public.user_profile (id uuid primary key, full_name text not null, email text);
      grant usage on schema public to anon, authenticated;
      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text, type text, payload jsonb, read_at timestamptz, created_at timestamptz default now()
      );

      create table public.system_config (
        key text primary key,
        value text,
        value_type text,
        updated_at timestamptz default now(),
        updated_by uuid
      );
      alter table public.system_config enable row level security;
      create policy "leitura publica" on public.system_config for select to anon, authenticated using (true);
      grant select, update, insert on public.system_config to anon, authenticated;
      insert into public.system_config (key, value) values
        ('escolas_atendidas', '35'), ('alunos_atendidos', '1499'), ('hero1', 'Projeto da UFJF');

      insert into auth.users (id) values ${todos.map((p) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name) values
        ('${COORD}', 'Cris Coordenação'), ('${BOLSISTA}', 'Bia Bolsista'), ('${ALUNO}', 'Ana Aluna');
    `);
    for (const path of MIGRATIONS) await db.exec(readFileSync(path, "utf8"));
    // Duas vezes: a migration é idempotente.
    await db.exec(readFileSync(NOVA, "utf8"));
    await db.exec(readFileSync(NOVA, "utf8"));
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false), ('${BOLSISTA}', false, true);
    `);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("sem a função, nem a coordenação consegue escrever pela tabela", async () => {
    await como(COORD, `update public.system_config set value = '1' where key = 'escolas_atendidas'`);
    expect(await numeros()).toEqual({ escolas_atendidas: "35", alunos_atendidos: "1499" });
  });

  it("a coordenação muda os dois números e o texto do site fica como estava", async () => {
    await como(COORD, `select gestao.definir_numeros_do_site($1, $2)`, [36, 1520]);
    expect(await numeros()).toEqual({ escolas_atendidas: "36", alunos_atendidos: "1520" });
    const { rows } = await db.query<{ value: string }>(`select value from public.system_config where key = 'hero1'`);
    expect(rows[0].value).toBe("Projeto da UFJF");
  });

  it("cria a chave que faltar", async () => {
    await db.exec(`delete from public.system_config where key = 'alunos_atendidos'`);
    await como(COORD, `select gestao.definir_numeros_do_site($1, $2)`, [36, 1600]);
    expect(await numeros()).toEqual({ escolas_atendidas: "36", alunos_atendidos: "1600" });
  });

  it("recusa número fora da faixa e não muda nada", async () => {
    await expect(como(COORD, `select gestao.definir_numeros_do_site($1, $2)`, [-1, 10])).rejects.toThrow(/entre 0 e 1.000.000/);
    await expect(como(COORD, `select gestao.definir_numeros_do_site($1, $2)`, [10, 1000001])).rejects.toThrow(/entre 0 e 1.000.000/);
    await expect(como(COORD, `select gestao.definir_numeros_do_site($1, $2)`, [null, 10])).rejects.toThrow(/entre 0 e 1.000.000/);
    expect(await numeros()).toEqual({ escolas_atendidas: "36", alunos_atendidos: "1600" });
  });

  it("bolsista, conta comum e visitante não mudam os números", async () => {
    await expect(como(BOLSISTA, `select gestao.definir_numeros_do_site(1, 1)`)).rejects.toThrow(/só a coordenação/);
    await expect(como(ALUNO, `select gestao.definir_numeros_do_site(1, 1)`)).rejects.toThrow(/só a coordenação/);
    await expect(como(null, `select gestao.definir_numeros_do_site(1, 1)`)).rejects.toThrow(/permission denied|schema gestao/);
    expect(await numeros()).toEqual({ escolas_atendidas: "36", alunos_atendidos: "1600" });
  });
});
