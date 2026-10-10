// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Spec 015 — buscar pessoa pelo nome para pôr na equipe. Prova que a busca
 * serve à coordenação sem virar listagem das contas do site (a maioria é de
 * aluno): mínimo de 3 letras, teto de 10, e-mail parcial e só por prefixo.
 */

const MIGRATIONS = [
  "supabase/migrations/20260905_gestao_modelo_operacional.sql",
  "supabase/migrations/20260905_gestao_membro_rpc.sql",
  "supabase/migrations/20260923_gestao_fundacao.sql",
  "supabase/migrations/20260924_gestao_melhorias.sql",
  "supabase/migrations/20260928_gestao_papeis_acumulados.sql",
  "supabase/migrations/20260928_gestao_sem_valor_na_bolsa.sql",
  "supabase/migrations/20261009_gestao_buscar_usuarios.sql",
].map((path) => readFileSync(path, "utf8"));

const COORD = "10000000-0000-4000-8000-000000000001";
const BOLSISTA = "20000000-0000-4000-8000-000000000001";
const LEANDRO = "30000000-0000-4000-8000-000000000001";
const EXCLUIDO = "30000000-0000-4000-8000-000000000002";
const alunos = Array.from({ length: 15 }, (_, i) => `40000000-0000-4000-8000-0000000000${String(i + 10)}`);

type Achado = { id: string; nome: string; email_parcial: string; coordenacao: boolean | null };

describe("busca de pessoas para a equipe (spec 015)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });

  async function buscar(uid: string, termo: string): Promise<Achado[]> {
    await db.exec(`set role authenticated`);
    await db.exec(`set request.jwt.claim.sub = '${uid}'`);
    try {
      return (await db.query<Achado>(`select * from gestao.buscar_usuarios($1)`, [termo])).rows;
    } finally {
      await db.exec(`reset role`);
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

  beforeAll(async () => {
    const todos = [COORD, BOLSISTA, LEANDRO, EXCLUIDO, ...alunos];
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
      alter table public.user_profile enable row level security;
      create policy "Users view own profile" on public.user_profile
        for select to authenticated using (auth.uid() = id);
      grant usage on schema public to anon, authenticated;
      grant select on public.user_profile to authenticated;
      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text, type text, payload jsonb, read_at timestamptz, created_at timestamptz default now()
      );

      insert into auth.users (id) values ${todos.map((p) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name, email) values
        ('${COORD}', 'Cris Coordenação', 'cris@ufjf.br'),
        ('${BOLSISTA}', 'Bia Bolsista', 'bia@estudante.ufjf.br'),
        ('${LEANDRO}', 'Leandro Fortunato', 'leandrofortunato@gmail.com'),
        ('${EXCLUIDO}', 'Usuario excluido', null),
        ${alunos.map((p, i) => `('${p}', 'Aluno Silva ${String(i).padStart(2, "0")}', 'aluno${i}@gmail.com')`).join(", ")};
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

  it("acha pelo pedaço do nome, sem diferença de maiúscula, com e-mail parcial", async () => {
    const achados = await buscar(COORD, "fortu");
    expect(achados).toEqual([
      expect.objectContaining({ id: LEANDRO, nome: "Leandro Fortunato", email_parcial: "le***@gmail.com", coordenacao: null }),
    ]);
  });

  it("menos de 3 letras não busca, e o teto é de 10 pessoas", async () => {
    expect(await buscar(COORD, "Al")).toHaveLength(0);
    expect(await buscar(COORD, "Aluno")).toHaveLength(10);
  });

  it("e-mail só por começo: o domínio não lista contas", async () => {
    expect(await buscar(COORD, "gmail")).toHaveLength(0);
    expect((await buscar(COORD, "leandrof")).map((a) => a.id)).toEqual([LEANDRO]);
  });

  it("curinga digitado é texto, e conta excluída não aparece", async () => {
    expect(await buscar(COORD, "%%%")).toHaveLength(0);
    expect(await buscar(COORD, "excluido")).toHaveLength(0);
  });

  it("bolsista não busca pessoas", async () => {
    await expect(buscar(BOLSISTA, "Leandro")).rejects.toThrow(/apenas a coordenação/);
  });
});
