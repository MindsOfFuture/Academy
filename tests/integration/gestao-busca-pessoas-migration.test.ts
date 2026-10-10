// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, afterAll, it, expect } from "vitest";
const db = new PGlite({ extensions: { pgcrypto } });
const ids = Array.from({ length: 6 }, (_, i) => `10000000-0000-4000-8000-00000000000${i + 1}`);
async function como(uid: string, role = "authenticated", query = "select * from gestao.buscar_usuarios('Ana')") {
  await db.exec(`set role ${role}; set request.jwt.claim.sub = '${uid}'`);
  try { return (await db.query(query)).rows; }
  finally { await db.exec("reset role; reset request.jwt.claim.sub"); }
}
beforeAll(async () => {
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    create table public.user_profile(id uuid primary key, full_name text, email text, role text);
    alter table public.user_profile enable row level security;
    create policy own on public.user_profile for select to authenticated using(id=auth.uid());
    grant select on public.user_profile to authenticated;
    create table public.notification(id uuid primary key default gen_random_uuid(), user_id uuid references public.user_profile(id), channel text, type text, payload jsonb, read_at timestamptz, created_at timestamptz default now());
    insert into auth.users values ${ids.map(id => `('${id}')`).join(',')};
    insert into public.user_profile values
      ('${ids[0]}','Coord','coord@x','student'), ('${ids[1]}','Bolsista','bolsa@x','student'),
      ('${ids[2]}','Desligado','des@x','student'), ('${ids[3]}','Admin','admin@x','admin'),
      ('${ids[4]}','Ana Silva','ana.um@x','student'), ('${ids[5]}','Ana Silva','ana.dois@x','student');
  `);
  for (const p of ['20260905_gestao_modelo_operacional.sql','20260905_gestao_membro_rpc.sql','20260923_gestao_fundacao.sql','20260924_gestao_melhorias.sql','20260928_gestao_papeis_acumulados.sql'])
    await db.exec(readFileSync(`supabase/migrations/${p}`, 'utf8'));
  await db.exec(`set request.jwt.claim.sub = '${ids[0]}'; insert into gestao.papel_membro(user_profile_id,coordenacao,bolsista,desligado_em) values ('${ids[0]}',true,true,null),('${ids[1]}',false,true,null),('${ids[2]}',true,false,now())`);
  const sql = readFileSync('supabase/migrations/20261008_gestao_busca_pessoas.sql','utf8');
  await db.exec(sql); await db.exec(sql);
}, 60000);
afterAll(async () => { await db.close(); });
it('busca nome ou email parcial, distingue homônimos e respeita limite', async () => {
  const rows = await como(ids[0]);
  expect(rows).toHaveLength(2);
  expect(rows.map(r => r.id).sort()).toEqual([ids[4],ids[5]]);
  expect(Object.keys(rows[0]).sort()).toEqual(['id','nome','email','coordenacao','bolsista','desligado_em'].sort());
  expect(await como(ids[0], 'authenticated', "select * from gestao.buscar_usuarios('DOIS@',1)")).toHaveLength(1);
  expect(await como(ids[0], 'authenticated', "select * from gestao.buscar_usuarios('Ana',1)")).toHaveLength(1);
  expect(await como(ids[0], 'authenticated', "select * from public.user_profile")).toHaveLength(1);
});
it('nega bolsista, desligado, admin público, sem JWT e anônimo', async () => {
  for (const uid of [ids[1],ids[2],ids[3],'']) await expect(como(uid)).rejects.toThrow(/coordenação/);
  await expect(como('', 'anon')).rejects.toThrow(/permission denied/);
});
it('nega concessão direta sem coordenação, inclusive admin público', async () => {
  const query = `insert into gestao.papel_membro(user_profile_id,bolsista) values ('${ids[4]}',true)`;
  for (const uid of [ids[1],ids[2],ids[3],'']) await expect(como(uid,'authenticated',query)).rejects.toThrow(/row-level security/);
  await expect(como('', 'anon',query)).rejects.toThrow(/permission denied/);
  await expect(como(ids[0], 'authenticated', "insert into gestao.papel_membro(user_profile_id,bolsista) values ('99999999-0000-4000-8000-000000000001',true)")).rejects.toThrow(/foreign key/);
});
it('impede busca vazia/curta/longa, limites inválidos e trata curingas literalmente', async () => {
  for (const q of ["''", "'a'", 'null', "repeat('x',101)"]) await expect(como(ids[0],'authenticated',`select * from gestao.buscar_usuarios(${q})`)).rejects.toThrow(/caracteres/);
  for (const n of ['0','51','null']) await expect(como(ids[0],'authenticated',`select * from gestao.buscar_usuarios('Ana',${n})`)).rejects.toThrow(/Limite/);
  expect(await como(ids[0],'authenticated',"select * from gestao.buscar_usuarios('%%')")).toEqual([]);
  expect(await como(ids[0],'authenticated',"select * from gestao.buscar_usuarios('__')")).toEqual([]);
});
