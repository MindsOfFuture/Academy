// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { gestaoAte, sqlDaMigracao } from "./helpers/gestao";

/**
 * Spec 028 — a coordenação muda número, texto e visibilidade dos números da página
 * inicial numa chamada só. `system_config` no pior caso: RLS ligada, leitura pública
 * só das chaves `public_%` (como a policy de produção) e nenhuma policy de escrita.
 */

// Mesma cadeia do teste de 20261114 (sem a dos artigos, que pede `public.article`); a nova duas vezes: idempotência.
const MIGRATIONS = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
  sqlDaMigracao("20261114_gestao_numero_da_aula"),
  sqlDaMigracao("20261123_gestao_destaques_da_home"),
  sqlDaMigracao("20261123_gestao_destaques_da_home"),
];

const COORD = "28000000-0000-4000-8000-000000000001";
const BOLSISTA = "28000000-0000-4000-8000-000000000002";
const ALUNO = "28000000-0000-4000-8000-000000000003";

const OK = [36, 1520, 0, "Escolas parceiras", "Jovens alcançados", "Aulas realizadas", true, true, false] as const;
const CHAMADA = `select gestao.definir_destaques_do_site($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

describe("destaques da página inicial (spec 028)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });

  async function como(uid: string | null, params: readonly unknown[]) {
    await db.exec(uid ? `set role authenticated` : `set role anon`);
    if (uid) await db.exec(`set request.jwt.claim.sub = '${uid}'`);
    try {
      return await db.query(CHAMADA, [...params]);
    } finally {
      await db.exec(`reset role`);
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

  /** O que o visitante (anon) lê, como a página inicial. */
  async function visivel(): Promise<Record<string, string>> {
    await db.exec(`set role anon`);
    try {
      const { rows } = await db.query<{ key: string; value: string }>(`select key, value from public.system_config order by key`);
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    } finally {
      await db.exec(`reset role`);
    }
  }

  async function config(): Promise<Record<string, string>> {
    const { rows } = await db.query<{ key: string; value: string }>(`select key, value from public.system_config`);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  beforeAll(async () => {
    const pessoas = [COORD, BOLSISTA, ALUNO];
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
      create table public.system_config (key text primary key, value text, value_type text, updated_at timestamptz, updated_by uuid);
      alter table public.system_config enable row level security;
      create policy "Public read config" on public.system_config for select
        using (key like 'public_%' or key = any (array['hero1', 'escolas_atendidas', 'alunos_atendidos']));
      grant usage on schema public to anon, authenticated;
      grant select, insert, update on public.system_config to anon, authenticated;
      grant select on public.user_profile to authenticated;
      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text, type text, payload jsonb, read_at timestamptz, created_at timestamptz default now()
      );
      alter table public.notification enable row level security;
      grant select, insert, update on public.notification to authenticated;

      insert into public.system_config (key, value) values
        ('escolas_atendidas', '35'), ('alunos_atendidos', '1499'), ('hero1', 'Projeto da UFJF'), ('chave_privada', 'x');
      insert into auth.users (id) values ${pessoas.map((p) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name, email) values
        ${pessoas.map((p, i) => `('${p}', 'Pessoa ${i}', 'p${i}@ufjf.br')`).join(", ")};
    `);
    for (const sql of MIGRATIONS) await db.exec(sql);
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

  it("a coordenação grava números, textos e visibilidade, e o visitante lê tudo", async () => {
    await como(COORD, OK);
    const lido = await visivel();
    expect(lido).toMatchObject({
      escolas_atendidas: "36",
      alunos_atendidos: "1520",
      public_aulas_realizadas: "0",
      public_home_rotulo_escolas: "Escolas parceiras",
      public_home_rotulo_alunos: "Jovens alcançados",
      public_home_rotulo_aulas: "Aulas realizadas",
      public_home_mostrar_escolas: "true",
      public_home_mostrar_alunos: "true",
      public_home_mostrar_aulas: "false",
      hero1: "Projeto da UFJF",
    });
    expect(lido).not.toHaveProperty("chave_privada");
    const { rows } = await db.query<{ updated_by: string }>(
      `select updated_by from public.system_config where key = 'public_home_rotulo_escolas'`,
    );
    expect(rows[0].updated_by).toBe(COORD);
  });

  it("salvar de novo atualiza, sem duplicar chave", async () => {
    await como(COORD, [36, 1520, 0, "  Escolas  ", "Alunos", "Aulas", false, true, true]);
    const c = await config();
    expect(c.public_home_rotulo_escolas).toBe("Escolas");
    expect(c.public_home_mostrar_escolas).toBe("false");
    expect(c.public_home_mostrar_aulas).toBe("true");
    const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from public.system_config where key like 'public_home_%'`);
    expect(rows[0].n).toBe(6);
  });

  it("recusa texto curto, longo ou vazio, visibilidade nula e número fora da faixa, sem mudar nada", async () => {
    const antes = await config();
    for (const [i, valor, erro] of [
      [3, "A", /de 2 a 40 letras/],
      [4, "x".repeat(41), /de 2 a 40 letras/],
      [5, null, /de 2 a 40 letras/],
      [8, null, /aparece ou não/],
      [0, -1, /entre 0 e 1.000.000/],
      [2, null, /entre 0 e 1.000.000/],
    ] as const) {
      const params: unknown[] = [...OK];
      params[i] = valor;
      await expect(como(COORD, params)).rejects.toThrow(erro);
    }
    expect(await config()).toEqual(antes);
  });

  it("bolsista, conta comum e visitante não mudam nada", async () => {
    const antes = await config();
    await expect(como(BOLSISTA, OK)).rejects.toThrow(/só a coordenação/);
    await expect(como(ALUNO, OK)).rejects.toThrow(/só a coordenação/);
    await expect(como(null, OK)).rejects.toThrow(/permission denied|schema gestao/);
    expect(await config()).toEqual(antes);
  });
});
