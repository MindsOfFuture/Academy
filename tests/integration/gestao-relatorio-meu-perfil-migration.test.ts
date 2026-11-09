// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const MIGRATION = readFileSync("supabase/migrations/20261109_gestao_relatorio_meu_perfil.sql", "utf8");
const EU = "70000000-0000-4000-8000-000000000001";
const OUTRA = "70000000-0000-4000-8000-000000000002";

describe("nome e CPF do relatório só de quem está logado (20261109)", () => {
  const db = new PGlite();

  async function meuPerfil(uid: string | null) {
    await db.exec(`set role ${uid ? "authenticated" : "anon"}; set request.jwt.claim.sub = '${uid ?? ""}'`);
    try {
      return (await db.query("select * from gestao.meu_perfil_para_relatorio()")).rows;
    } finally {
      await db.exec("reset role");
    }
  }

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create schema gestao;
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth, gestao to anon, authenticated;
      create table public.user_profile (id uuid primary key, full_name text, document text);
      insert into public.user_profile values ('${EU}', 'Bia', '111'), ('${OUTRA}', 'Caio', '222');
      -- Como depois da migração de colunas: authenticated não lê o CPF direto.
      revoke all on public.user_profile from anon, authenticated;
    `);
    await db.exec(MIGRATION);
    await db.exec(MIGRATION); // idempotência
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("devolve só a própria linha, mesmo sem acesso à coluna", async () => {
    expect(await meuPerfil(EU)).toEqual([{ nome: "Bia", cpf: "111" }]);
    expect(await meuPerfil(OUTRA)).toEqual([{ nome: "Caio", cpf: "222" }]);
  });

  it("visitante sem login não chama", async () => {
    await expect(meuPerfil(null)).rejects.toThrow(/permission denied/);
  });
});
