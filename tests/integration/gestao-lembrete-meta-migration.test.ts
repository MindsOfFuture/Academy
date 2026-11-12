// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { comoUsuario, gestaoAte, sqlDaMigracao } from "./helpers/gestao";

/**
 * Lembrete de meta atrasada (20261118). Ana e Ex são responsáveis; Ex foi
 * desligado. Só o papel gestao_lembrete lê e marca.
 */

// Sem a dos artigos (pede `public.article`); a última de novo: idempotência.
const MIGRATIONS = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
  sqlDaMigracao("20261114_gestao_numero_da_aula"),
  sqlDaMigracao("20261115_gestao_atrasos_e_metas"),
  sqlDaMigracao("20261118_gestao_lembrete_meta_atrasada"),
  sqlDaMigracao("20261118_gestao_lembrete_meta_atrasada"),
];

const COORD = "7a000000-0000-4000-8000-000000000001";
const ANA = "7a000000-0000-4000-8000-000000000002";
const EX = "7a000000-0000-4000-8000-000000000003";

type Pendente = { meta_id: string; user_profile_id: string; prazo: string; email: { to: string[]; subject: string; html: string } };

describe("lembrete de meta atrasada (20261118)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const como = comoUsuario(db);

  async function comoLembrete<T>(fn: () => Promise<T>): Promise<T> {
    await db.exec(`set role gestao_lembrete`);
    try {
      return await fn();
    } finally {
      await db.exec(`reset role`);
    }
  }
  const pendentes = () =>
    comoLembrete(async () =>
      (await db.query<Pendente>(`select meta_id::text, user_profile_id::text, prazo::text, email from gestao.lembretes_meta_pendentes('Academy <a@b>', 'https://academy.test/', '')`)).rows,
    );
  /** SQL direto com autoria: as tabelas da gestão exigem `auth.uid()`. */
  const comoCoord = async (sql: string) => {
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    try {
      await db.exec(sql);
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
  };
  const salvar = async (titulo: string, prazo: string, responsaveis: string[]) => {
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    try {
      return (
        await db.query<{ id: string }>(`select gestao.salvar_meta(null, $1, null, $2, $3::uuid[]) as id`, [titulo, prazo, responsaveis])
      ).rows[0].id;
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
  };

  beforeAll(async () => {
    const pessoas = [COORD, ANA, EX];
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

      insert into auth.users (id) values ${pessoas.map((p) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name, email) values
        ('${COORD}', 'Coord', 'coord@ufjf.br'), ('${ANA}', 'Ana <B>', 'ana@ufjf.br'), ('${EX}', 'Ex', 'ex@ufjf.br');
    `);
    for (const sql of MIGRATIONS) await db.exec(sql);

    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false), ('${ANA}', false, true), ('${EX}', false, true);
    `);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("só a meta vencida e aberta, só para responsável ativo; uma vez por prazo", async () => {
    const atrasada = await salvar("Relatório <final>", "2020-01-10", [ANA, EX]);
    await salvar("No prazo", "2099-01-10", [ANA]);
    const concluida = await salvar("Já feita", "2020-01-10", [ANA]);
    await comoCoord(`update gestao.meta set concluida_em = now() where id = '${concluida}'`);
    await comoCoord(`update gestao.papel_membro set desligado_em = now() where user_profile_id = '${EX}'`);

    const primeira = await pendentes();
    expect(primeira).toHaveLength(1);
    expect(primeira[0]).toMatchObject({ meta_id: atrasada, user_profile_id: ANA, prazo: "2020-01-10" });
    expect(primeira[0].email.to).toEqual(["ana@ufjf.br"]);
    expect(primeira[0].email.subject).toBe("Meta atrasada: Relatório <final>");
    expect(primeira[0].email.html).toContain("Relatório &#60;final&#62; · prazo 10/01/2020");
    expect(primeira[0].email.html).toContain("Olá, Ana &#60;B&#62;");
    expect(primeira[0].email.html).toContain(`href="https://academy.test/gestao/metas/${atrasada}"`);

    await comoLembrete(() =>
      db.query(`select gestao.marcar_lembrete_meta_enviado($1, $2, $3)`, [atrasada, ANA, "2020-01-10"]),
    );
    expect(await pendentes()).toHaveLength(0);

    // Prazo novo que também já venceu: lembra de novo.
    await comoCoord(`update gestao.meta set prazo = '2020-02-10' where id = '${atrasada}'`);
    expect((await pendentes()).map((p) => p.prazo)).toEqual(["2020-02-10"]);
  });

  it("meta de teste não lembra", async () => {
    const teste = await salvar("Meta de teste", "2020-01-10", [ANA]);
    await comoCoord(`update gestao.meta set teste = true where id = '${teste}'`);
    expect((await pendentes()).map((p) => p.meta_id)).not.toContain(teste);
  });

  it("membro logado não lê nem marca", async () => {
    await como(COORD, async () => {
      await expect(db.query(`select * from gestao.lembretes_meta_pendentes('a@b', 'https://x')`)).rejects.toThrow(/permission denied/);
      await expect(
        db.query(`select gestao.marcar_lembrete_meta_enviado($1, $2, '2020-01-10')`, [COORD, ANA]),
      ).rejects.toThrow(/permission denied/);
    });
  });
});
