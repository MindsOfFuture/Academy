// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Certificado verdadeiro aparecia como inválido em /validar: o gerador
 * deixava o bloco do meio em minúsculas e a validação comparava com o código
 * digitado em maiúsculas. Prova em PostgreSQL real que códigos já emitidos
 * (com minúsculas) validam e que o gerador novo só emite maiúsculas.
 */

const MIGRATION = readFileSync("supabase/migrations/20261123_certificado_codigo_em_maiusculas.sql", "utf8");

const MISTO = "11111111-1111-4111-8111-111111111111";
const MAIUSCULO = "22222222-2222-4222-8222-222222222222";

describe("validação de certificado sem depender de maiúsculas", () => {
  const db = new PGlite({ extensions: { pgcrypto } });

  async function validar(codigo: string) {
    await db.exec("set role anon");
    try {
      return (
        await db.query<{ id: string; student_cpf: string | null }>(
          "select id::text, student_cpf from public.validate_certificate($1)",
          [codigo],
        )
      ).rows;
    } finally {
      await db.exec("reset role");
    }
  }

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema extensions;
      create extension pgcrypto schema extensions;
      create table public.certificate (
        id uuid primary key, verification_code text unique, student_name text,
        student_cpf text, course_title text, issued_at timestamptz default now()
      );
      alter table public.certificate enable row level security;
      -- Como em produção: o código de 'MISTO' saiu do gerador antigo, bloco do meio minúsculo.
      insert into public.certificate (id, verification_code, student_name, student_cpf, course_title) values
        ('${MISTO}', 'AB12-cd34-EF56', 'Aluna', '123.456.789-01', 'Curso'),
        ('${MAIUSCULO}', '9A8B-7C6D-5E4F', 'Aluno', '', 'Curso');
    `);
    await db.exec(MIGRATION);
    await db.exec(MIGRATION); // reexecutável
    await db.exec(`
      revoke execute on function public.validate_certificate(text) from public;
      grant execute on function public.validate_certificate(text) to anon, authenticated, service_role;
      revoke execute on function public.generate_verification_code() from public;
      grant execute on function public.generate_verification_code() to service_role;
    `);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("código emitido com minúsculas valida, do jeito que /validar envia (maiúsculas)", async () => {
    expect(await validar("AB12-CD34-EF56")).toEqual([{ id: MISTO, student_cpf: "***.456.789-**" }]);
    expect(await validar("  ab12-cd34-ef56 ")).toEqual([{ id: MISTO, student_cpf: "***.456.789-**" }]);
    expect(await validar("9a8b-7c6d-5e4f")).toEqual([{ id: MAIUSCULO, student_cpf: null }]);
  });

  it("código inexistente segue sem resultado", async () => {
    expect(await validar("AB12-CD34-EF57")).toEqual([]);
    expect(await validar("")).toEqual([]);
  });

  it("o gerador só emite XXXX-XXXX-XXXX em maiúsculas, sem repetir", async () => {
    const r = await db.query<{ c: string }>(
      "select public.generate_verification_code() as c from generate_series(1, 300)",
    );
    const codigos = r.rows.map((x) => x.c);
    for (const c of codigos) expect(c).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it("anon não chama o gerador", async () => {
    await db.exec("set role anon");
    try {
      await expect(db.query("select public.generate_verification_code()")).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
  });
});
