// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const MIGRATION = readFileSync("supabase/migrations/20261109_perfil_sem_dados_pessoais_no_navegador.sql", "utf8");
const EU = "11111111-1111-4111-8111-111111111111";

describe("colunas pessoais de user_profile fora do navegador", () => {
  const db = new PGlite();

  async function como(papel: "anon" | "authenticated", sql: string) {
    await db.exec(`set role ${papel}; set request.jwt.claim.sub = '${papel === "anon" ? "" : EU}'`);
    try {
      return await db.query(sql);
    } finally {
      await db.exec("reset role");
    }
  }

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth, public to anon, authenticated;
      create table public.user_profile (
        id uuid primary key, full_name text, email text, avatar_url text, bio text, is_active boolean,
        created_at timestamptz, updated_at timestamptz, phone text, address text, document text,
        birth_date date, verification_status text, specialties text[], certifications text[],
        timezone text, notification_preferences jsonb
      );
      insert into public.user_profile (id, full_name, phone, document) values ('${EU}', 'Eu', '32', '123');
      alter table public.user_profile enable row level security;
      create policy own_select on public.user_profile for select to authenticated using (id = auth.uid());
      create policy own_update on public.user_profile for update to authenticated using (id = auth.uid());
      grant select, update on public.user_profile to anon, authenticated;
    `);
    await db.exec(MIGRATION);
    await db.exec(MIGRATION); // reexecutável
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("ninguém no navegador lê CPF, nascimento, telefone ou endereço", async () => {
    for (const coluna of ["document", "birth_date", "phone", "address"]) {
      await expect(como("authenticated", `select ${coluna} from public.user_profile`)).rejects.toThrow(/permission denied/);
    }
  });

  it("nome segue legível, a edição do próprio perfil segue valendo e anon não quebra", async () => {
    const eu = await como("authenticated", "select full_name, verification_status from public.user_profile");
    expect(eu.rows).toEqual([{ full_name: "Eu", verification_status: null }]);
    await como("authenticated", `update public.user_profile set phone = '99', address = 'Rua' where id = '${EU}'`);
    const anon = await como("anon", "select id, full_name from public.user_profile");
    expect(anon.rows).toEqual([]);
    const gravado = await db.query<{ phone: string }>("select phone from public.user_profile");
    expect(gravado.rows[0].phone).toBe("99");
  });
});
