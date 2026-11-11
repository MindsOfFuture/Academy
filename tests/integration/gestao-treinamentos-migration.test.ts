// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { sqlDaMigracao } from "./helpers/gestao";

const COORD = "10000000-0000-4000-8000-000000000001";
const BOLSISTA = "20000000-0000-4000-8000-000000000001";
const OUTRO = "20000000-0000-4000-8000-000000000002";
const TESTE = "20000000-0000-4000-8000-000000000003";
const ESTRANHO = "30000000-0000-4000-8000-000000000001";

describe("vídeos de treinamento (spec 025)", () => {
  const db = new PGlite();
  const como = async <T>(uid: string, sql: string) => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${uid}'`);
    try { return (await db.query<T>(sql)).rows; } finally { await db.exec("reset role; reset request.jwt.claim.sub"); }
  };

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin; create role authenticated nologin; create role service_role nologin;
      create schema auth; create table auth.users (id uuid primary key);
      insert into auth.users values ('${COORD}'), ('${BOLSISTA}'), ('${OUTRO}'), ('${TESTE}'), ('${ESTRANHO}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create table public.user_profile (id uuid primary key, full_name text, email text);
      insert into public.user_profile values ('${COORD}', 'Cris', 'c@x'), ('${BOLSISTA}', 'Ana', 'a@x'), ('${OUTRO}', 'Beto', 'b@x'), ('${TESTE}', 'Robô', 't@x'), ('${ESTRANHO}', 'Zé', 'z@x');
      create schema gestao;
      create table gestao.papel_membro (user_profile_id uuid primary key, coordenacao boolean not null default false,
        bolsista boolean not null default false, teste boolean not null default false, desligado_em timestamptz);
      insert into gestao.papel_membro values ('${COORD}', true, false, false, null), ('${BOLSISTA}', false, true, false, null),
        ('${OUTRO}', false, true, false, null), ('${TESTE}', false, true, true, null);
      create function public.gestao_membro_papel() returns text language sql stable security definer as $$
        select case when m.coordenacao then 'coordenacao' when m.bolsista then 'bolsista' end
        from gestao.papel_membro m where m.user_profile_id = auth.uid() and m.desligado_em is null
      $$;
      grant usage on schema public to authenticated;
    `);
    await db.exec(sqlDaMigracao("20261114_gestao_treinamentos"));
  });
  afterAll(() => db.close());

  it("só a coordenação publica; o mesmo número troca o vídeo", async () => {
    await expect(como(BOLSISTA, "select public.treinamento_salvar_video(1, 'Pontualidade', 'dQw4w9WgXcQ')")).rejects.toThrow(/coordenação/);
    await como(COORD, "select public.treinamento_salvar_video(1, 'Pontualidade', 'aaaaaaaaaaa')");
    await como(COORD, "select public.treinamento_salvar_video(1, 'Pontualidade e horários', 'dQw4w9WgXcQ')");
    await expect(como(COORD, "select public.treinamento_salvar_video(2, 'Ruim', 'nao-e-id')")).rejects.toThrow(/check/);
    expect(await como(BOLSISTA, "select numero, titulo, youtube_id, aberto, concluido from public.treinamento_videos()")).toEqual([
      { numero: 1, titulo: "Pontualidade e horários", youtube_id: "dQw4w9WgXcQ", aberto: false, concluido: false },
    ]);
  });

  it("registra abertura e fim, e só a coordenação vê o resumo", async () => {
    const [{ id }] = await como<{ id: string }>(BOLSISTA, "select id from public.treinamento_videos()");
    await como(BOLSISTA, `select public.treinamento_registrar('${id}', false)`);
    await como(BOLSISTA, `select public.treinamento_registrar('${id}', false)`);
    await como(BOLSISTA, `select public.treinamento_registrar('${id}', true)`);
    expect(await como(BOLSISTA, "select aberto, concluido from public.treinamento_videos()")).toEqual([{ aberto: true, concluido: true }]);

    const resumo = await como<{ nome: string; acessos: number; concluiu: boolean }>(COORD,
      "select nome, acessos, concluido_em is not null as concluiu from public.treinamento_resumo()");
    expect(resumo).toEqual([{ nome: "Ana", acessos: 2, concluiu: true }, { nome: "Beto", acessos: 0, concluiu: false }]);
    expect(await como(BOLSISTA, "select * from public.treinamento_resumo()")).toEqual([]);
  });

  it("quem não é do projeto não vê nem registra, e ninguém lê as tabelas direto", async () => {
    expect(await como(ESTRANHO, "select * from public.treinamento_videos()")).toEqual([]);
    const [{ id }] = await como<{ id: string }>(COORD, "select id from public.treinamento_videos()");
    await expect(como(ESTRANHO, `select public.treinamento_registrar('${id}', false)`)).rejects.toThrow(/Acesso negado/);
    await expect(como(COORD, "select * from public.treinamento_visualizacao")).rejects.toThrow(/permission denied/);
    await expect(como(COORD, "insert into public.treinamento_video (numero, titulo, youtube_id) values (9, 'xxx', 'dQw4w9WgXcQ')")).rejects.toThrow(/permission denied/);
  });
});
