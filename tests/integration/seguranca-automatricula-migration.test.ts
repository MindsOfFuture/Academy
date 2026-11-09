// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const MIGRATION = readFileSync("supabase/migrations/20261109_automatricula_so_em_curso_ativo.sql", "utf8");
const ALUNO = "11111111-1111-4111-8111-111111111111";
const ATIVO = "22222222-2222-4222-8222-222222222222";
const RASCUNHO = "33333333-3333-4333-8333-333333333333";

describe("automatrícula só em curso ativo", () => {
  const db = new PGlite();

  const matricular = async (curso: string) => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ALUNO}'`);
    try {
      await db.exec(`insert into public.enrollment (course_id, user_id) values ('${curso}', '${ALUNO}')`);
    } finally {
      await db.exec("reset role");
    }
  };

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth, public to authenticated;
      create table public.course (id uuid primary key, status text);
      insert into public.course values ('${ATIVO}', 'active'), ('${RASCUNHO}', 'draft');
      create table public.enrollment (id uuid primary key default gen_random_uuid(), course_id uuid, user_id uuid);
      alter table public.enrollment enable row level security;
      create policy "Student can enroll" on public.enrollment for insert with check (auth.uid() = user_id);
      grant insert on public.enrollment to authenticated;
    `);
    await db.exec(MIGRATION);
    await db.exec(MIGRATION); // reexecutável
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("matricula em curso ativo e recusa rascunho", async () => {
    await matricular(ATIVO);
    await expect(matricular(RASCUNHO)).rejects.toThrow(/row-level/);
  });
});
