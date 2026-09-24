// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const MIGRATION = readFileSync(
  "supabase/migrations/20260923_historico_conteudo.sql",
  "utf8",
);

const OWNER_ID = "123e4567-e89b-42d3-a456-426614174000";
const OTHER_OWNER_ID = "223e4567-e89b-42d3-a456-426614174000";
const OUTSIDER_ID = "323e4567-e89b-42d3-a456-426614174000";
const ADMIN_ID = "423e4567-e89b-42d3-a456-426614174000";
const COURSE_ID = "523e4567-e89b-42d3-a456-426614174000";
const OTHER_COURSE_ID = "623e4567-e89b-42d3-a456-426614174000";
const MODULE_ID = "723e4567-e89b-42d3-a456-426614174000";
const DELETED_MODULE_ID = "823e4567-e89b-42d3-a456-426614174000";

const lessonId = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("migration do histórico detalhado de conteúdo em PostgreSQL real", () => {
  const db = new PGlite();

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;

      create schema auth;
      create table auth.users (id uuid primary key);
      insert into auth.users (id) values
        ('${OWNER_ID}'), ('${OTHER_OWNER_ID}'), ('${OUTSIDER_ID}'), ('${ADMIN_ID}');
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;

      create table public._admins (id uuid primary key);
      insert into public._admins (id) values ('${ADMIN_ID}');
      create function public.is_admin() returns boolean
      language sql stable security definer set search_path = '' as $fn$
        select exists (
          select 1 from public._admins
          where id = nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        )
      $fn$;

      create table public.course (
        id uuid primary key,
        title text not null,
        description text,
        thumb_id uuid,
        level text,
        status text,
        owner_id uuid,
        created_at timestamptz default now(),
        updated_at timestamptz default now(),
        audience text not null,
        language text,
        category text,
        subcategories text[]
      );
      create table public.course_module (
        id uuid primary key,
        course_id uuid not null references public.course (id) on delete cascade,
        title text not null,
        "order" integer not null,
        created_at timestamptz default now()
      );
      create table public.lesson (
        id uuid primary key,
        module_id uuid not null references public.course_module (id) on delete cascade,
        title text not null,
        content_type text,
        content_url text,
        duration_minutes integer,
        "order" integer not null,
        is_public boolean,
        created_at timestamptz default now(),
        course_id uuid,
        description text
      );

      grant usage on schema public to anon, authenticated;
      grant select, insert, update, delete on public.course, public.course_module, public.lesson
        to authenticated;
    `);

    // Rodar duas vezes prova que políticas, funções, índices e triggers são idempotentes.
    await db.exec(MIGRATION);
    await db.exec(MIGRATION);

    await db.exec(`set request.jwt.claim.sub = '${OWNER_ID}'`);
    await db.exec(`
      insert into public.course (id, title, owner_id, audience)
      values ('${COURSE_ID}', 'Robótica', '${OWNER_ID}', 'student');
      insert into public.course_module (id, course_id, title, "order")
      values ('${MODULE_ID}', '${COURSE_ID}', 'Sensores antigos', 1);
    `);

    await db.exec(`set request.jwt.claim.sub = '${OTHER_OWNER_ID}'`);
    await db.exec(`
      insert into public.course (id, title, owner_id, audience)
      values ('${OTHER_COURSE_ID}', 'Programação', '${OTHER_OWNER_ID}', 'student');
      update public.course set title = 'Programação criativa' where id = '${OTHER_COURSE_ID}';
    `);
    await db.exec("reset request.jwt.claim.sub");
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("cria uma única estrutura mesmo quando executada duas vezes", async () => {
    const tables = await db.query<{ n: number }>(`
      select count(*)::int as n
      from information_schema.tables
      where table_schema = 'public' and table_name = 'historico_conteudo'
    `);
    const triggers = await db.query<{ n: number }>(`
      select count(*)::int as n
      from pg_trigger gatilho
      join pg_class tabela on tabela.oid = gatilho.tgrelid
      join pg_namespace schema on schema.oid = tabela.relnamespace
      where schema.nspname = 'public'
        and gatilho.tgname = 'registrar_historico_conteudo'
        and not gatilho.tgisinternal
    `);

    expect(tables.rows[0].n).toBe(1);
    expect(triggers.rows[0].n).toBe(3);
  });

  it("registra a renomeação do módulo com autor, estados e somente title", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${OWNER_ID}'`);
    await db.exec(`update public.course_module set title = 'Sensores' where id = '${MODULE_ID}'`);
    await db.exec("reset role; reset request.jwt.claim.sub");

    const result = await db.query<{
      autor: string;
      antes: { title: string };
      depois: { title: string };
      campos_alterados: string[];
    }>(`
      select autor::text, antes, depois, campos_alterados
      from public.historico_conteudo
      where registro_id = '${MODULE_ID}' and acao = 'update'
    `);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      autor: OWNER_ID,
      antes: { title: "Sensores antigos" },
      depois: { title: "Sensores" },
      campos_alterados: ["title"],
    });
  });

  it("preserva as três aulas e o módulo quando remove como a aplicação", async () => {
    await db.exec(`set request.jwt.claim.sub = '${OWNER_ID}'`);
    await db.exec(`
      insert into public.course_module (id, course_id, title, "order")
      values ('${DELETED_MODULE_ID}', '${COURSE_ID}', 'Módulo descartado', 2);
      insert into public.lesson (id, module_id, course_id, title, "order", description)
      values
        ('${lessonId(1)}', '${DELETED_MODULE_ID}', '${COURSE_ID}', 'Aula um', 1, 'Primeiro conteúdo'),
        ('${lessonId(2)}', '${DELETED_MODULE_ID}', '${COURSE_ID}', 'Aula dois', 2, 'Segundo conteúdo'),
        ('${lessonId(3)}', '${DELETED_MODULE_ID}', '${COURSE_ID}', 'Aula três', 3, 'Terceiro conteúdo');
      delete from public.lesson where module_id = '${DELETED_MODULE_ID}';
      delete from public.course_module where id = '${DELETED_MODULE_ID}';
    `);
    await db.exec("reset request.jwt.claim.sub");

    const result = await db.query<{ tabela: string; antes: { title: string } }>(`
      select tabela, antes
      from public.historico_conteudo
      where acao = 'delete'
        and (registro_id = '${DELETED_MODULE_ID}' or antes ->> 'module_id' = '${DELETED_MODULE_ID}')
      order by id
    `);

    expect(result.rows).toHaveLength(4);
    expect(result.rows.map((row) => row.antes.title)).toEqual([
      "Aula um",
      "Aula dois",
      "Aula três",
      "Módulo descartado",
    ]);
  });

  it("não registra update que altera somente updated_at", async () => {
    const before = await db.query<{ n: number }>(`
      select count(*)::int as n from public.historico_conteudo
      where registro_id = '${COURSE_ID}' and acao = 'update'
    `);

    await db.exec(`update public.course set updated_at = now() + interval '1 minute' where id = '${COURSE_ID}'`);

    const after = await db.query<{ n: number }>(`
      select count(*)::int as n from public.historico_conteudo
      where registro_id = '${COURSE_ID}' and acao = 'update'
    `);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it("aplica RLS para não proprietário, proprietário e administrador", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${OUTSIDER_ID}'`);
    const outsider = await db.query("select id from public.historico_conteudo");
    await db.exec("reset role; reset request.jwt.claim.sub");
    expect(outsider.rows).toEqual([]);

    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${OWNER_ID}'`);
    const owner = await db.query<{ curso_id: string }>(
      "select curso_id::text from public.historico_conteudo",
    );
    await db.exec("reset role; reset request.jwt.claim.sub");
    expect(owner.rows.length).toBeGreaterThan(0);
    expect(owner.rows.every((row) => row.curso_id === COURSE_ID)).toBe(true);

    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ADMIN_ID}'`);
    const admin = await db.query<{ curso_id: string }>(
      "select curso_id::text from public.historico_conteudo",
    );
    await db.exec("reset role; reset request.jwt.claim.sub");
    expect(admin.rows.length).toBeGreaterThan(owner.rows.length);
    expect(admin.rows.some((row) => row.curso_id === OTHER_COURSE_ID)).toBe(true);
  });

  it("rejeita update e delete até para dono da tabela e superusuário", async () => {
    await expect(
      db.exec("update public.historico_conteudo set acao = 'insert' where id = 1"),
    ).rejects.toThrow(/append-only/i);
    await expect(
      db.exec("delete from public.historico_conteudo where id = 1"),
    ).rejects.toThrow(/append-only/i);
  });

  it("não concede leitura ao papel anônimo", async () => {
    await db.exec("set role anon");
    await expect(
      db.query("select * from public.historico_conteudo"),
    ).rejects.toThrow(/permission denied/i);
    await db.exec("reset role");
  });
});
