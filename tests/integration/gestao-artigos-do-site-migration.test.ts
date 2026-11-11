// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { gestaoAte, sqlDaMigracao } from "./helpers/gestao";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Artigos do site pela gestão (20261111). `public.article`, `media_file`,
 * `storage.objects` e o trigger de professor verificado nasceram no painel;
 * aqui vão como stubs com o mesmo nome, colunas, policies e corpo de produção.
 * `public.is_admin()` responde sim para PSEUDO, que não é admin para o trigger:
 * prova que, mesmo se uma policy deixasse, o trigger ainda barra quem não é da
 * coordenação.
 */

const MIGRATIONS = [...gestaoAte("20261111_gestao_artigos_do_site"), sqlDaMigracao("20261111_gestao_artigos_do_site")];

const COORD = "81000000-0000-4000-8000-000000000001";
const BOLSISTA = "81000000-0000-4000-8000-000000000002";
const ALUNO = "81000000-0000-4000-8000-000000000003";
const DESLIGADA = "81000000-0000-4000-8000-000000000004";
const PSEUDO = "81000000-0000-4000-8000-000000000005";
const RASCUNHO = "82000000-0000-4000-8000-000000000001";
const PUBLICADO = "82000000-0000-4000-8000-000000000002";

describe("artigos do site pela coordenação (20261111)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });

  async function como<T>(uid: string | null, sql: string, params: unknown[] = []): Promise<T[]> {
    await db.exec(uid ? `set role authenticated` : `set role anon`);
    if (uid) await db.exec(`set request.jwt.claim.sub = '${uid}'`);
    try {
      return (await db.query<T>(sql, params)).rows;
    } finally {
      await db.exec(`reset role`);
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

  const inserir = (uid: string, id: string, status: string, autor = uid) =>
    como(
      uid,
      `insert into public.article (id, title, slug, content, status, author_id) values ($1, $2, $3, 'Texto', $4, $5)`,
      [id, `Artigo ${id}`, `artigo-${id}`, status, autor],
    );
  const capa = (uid: string, bucket: string, nome: string) =>
    como(uid, `insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)`, [bucket, nome, uid]);
  const titulos = async (uid: string | null) =>
    (await como<{ id: string }>(uid, `select id from public.article order by id`)).map((r) => r.id);

  beforeAll(async () => {
    const pessoas = [COORD, BOLSISTA, ALUNO, DESLIGADA, PSEUDO];
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;

      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;

      create table public.user_profile (id uuid primary key, full_name text not null, email text, document text);
      alter table public.user_profile enable row level security;
      grant select on public.user_profile to authenticated;
      grant usage on schema public to anon, authenticated;
      create table public.system_config (key text primary key, value text);
      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text, type text, payload jsonb, read_at timestamptz, created_at timestamptz default now()
      );

      create function public.is_admin() returns boolean language sql stable as $fn$
        select auth.uid() = '${PSEUDO}'::uuid
      $fn$;
      create function public.is_user_admin(uuid) returns boolean language sql stable as $fn$ select false $fn$;
      create function public.is_teacher_approved(uuid) returns boolean language sql stable as $fn$ select false $fn$;

      create table public.media_file (
        id uuid primary key default gen_random_uuid(),
        owner_id uuid references public.user_profile (id),
        url text not null,
        type text check (type in ('image', 'pdf', 'video', 'audio', 'other')),
        created_at timestamptz default now()
      );
      alter table public.media_file enable row level security;
      create policy "Own files" on public.media_file for all to public using (owner_id = auth.uid());
      create policy "Public view media files" on public.media_file for select to public using (true);
      grant all on public.media_file to anon, authenticated;

      create table public.article (
        id uuid primary key default gen_random_uuid(),
        title text not null,
        slug text not null constraint article_slug_key unique,
        excerpt text,
        content text,
        status text default 'draft' constraint article_status_check check (status in ('draft', 'published')),
        cover_media_id uuid constraint article_cover_media_id_fkey references public.media_file (id),
        author_id uuid references public.user_profile (id) on delete set null,
        published_at timestamptz,
        created_at timestamptz default now()
      );
      alter table public.article enable row level security;
      create policy "Admins manage articles" on public.article for all to authenticated using (public.is_admin());
      create policy "Public articles" on public.article for select to public using (status = 'published');
      grant all on public.article to anon, authenticated;

      -- Corpo de produção antes desta migration.
      create function public.enforce_verified_teacher_for_content() returns trigger
        language plpgsql set search_path to 'public' as $fn$
      declare v_actor uuid;
      begin
        v_actor := auth.uid();
        if v_actor is null then return new; end if;
        if public.is_user_admin(v_actor) then return new; end if;
        if not public.is_teacher_approved(v_actor) then
          raise exception 'Professor não verificado. Aguarde aprovação do administrador.' using errcode = '42501';
        end if;
        return new;
      end;
      $fn$;
      create trigger trg_article_require_verified_teacher before insert or update on public.article
        for each row execute function public.enforce_verified_teacher_for_content();

      create schema storage;
      create table storage.objects (
        id uuid primary key default gen_random_uuid(),
        bucket_id text,
        name text,
        owner uuid
      );
      alter table storage.objects enable row level security;
      create policy public_read_site_media on storage.objects for select to public using (bucket_id = 'site-media');
      grant usage on schema storage to anon, authenticated;
      grant select, insert on storage.objects to anon, authenticated;

      insert into auth.users (id) values ${pessoas.map((p) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name) values
        ${pessoas.map((p, i) => `('${p}', 'Pessoa ${i}')`).join(", ")};
    `);
    // A última duas vezes: idempotente.
    for (const sql of MIGRATIONS) await db.exec(sql);

    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false), ('${BOLSISTA}', false, true);
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista, desligado_em) values
        ('${DESLIGADA}', true, false, now());
    `);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("a coordenação cria rascunho e publicado sem ser admin nem professor", async () => {
    await inserir(COORD, RASCUNHO, "draft");
    await inserir(COORD, PUBLICADO, "published");
    expect(await titulos(COORD)).toEqual([RASCUNHO, PUBLICADO]);
  });

  it("a coordenação não cria artigo em nome de outra pessoa", async () => {
    await expect(inserir(COORD, "82000000-0000-4000-8000-000000000009", "draft", ALUNO)).rejects.toThrow(/row-level security/);
  });

  it("a coordenação edita, mas não apaga", async () => {
    await como(COORD, `update public.article set title = 'Novo título' where id = $1`, [RASCUNHO]);
    const apagados = await como(COORD, `delete from public.article where id = $1 returning id`, [RASCUNHO]);
    expect(apagados).toEqual([]);
    const { rows } = await db.query<{ title: string }>(`select title from public.article where id = $1`, [RASCUNHO]);
    expect(rows[0].title).toBe("Novo título");
  });

  it("bolsista, aluno e coordenação desligada não leem rascunho nem escrevem", async () => {
    for (const uid of [BOLSISTA, ALUNO, DESLIGADA]) {
      expect(await titulos(uid)).toEqual([PUBLICADO]);
      await expect(inserir(uid, "82000000-0000-4000-8000-000000000008", "draft")).rejects.toThrow(/row-level security|Professor não verificado/);
      await como(uid, `update public.article set title = 'x' where id = $1`, [PUBLICADO]);
    }
    const { rows } = await db.query<{ title: string }>(`select title from public.article where id = $1`, [PUBLICADO]);
    expect(rows[0].title).toBe(`Artigo ${PUBLICADO}`);
  });

  it("quem a policy deixasse passar e não é da coordenação continua barrado pelo trigger", async () => {
    await expect(inserir(PSEUDO, "82000000-0000-4000-8000-000000000007", "draft")).rejects.toThrow(/Professor não verificado/);
  });

  it("visitante lê só o publicado", async () => {
    expect(await titulos(null)).toEqual([PUBLICADO]);
  });

  it("slug repetido é recusado pelo banco", async () => {
    await expect(
      como(COORD, `insert into public.article (title, slug, author_id) values ('Outro', $1, $2)`, [`artigo-${RASCUNHO}`, COORD]),
    ).rejects.toThrow(/article_slug_key/);
  });

  it("a coordenação envia capa só em site-media/covers/", async () => {
    await capa(COORD, "site-media", "covers/x.jpg");
    await expect(capa(COORD, "avatars", "covers/x.jpg")).rejects.toThrow(/row-level security/);
    await expect(capa(COORD, "site-media", "hero/x.jpg")).rejects.toThrow(/row-level security/);
    await expect(capa(COORD, "site-media", "covers/../x.jpg")).rejects.toThrow(/row-level security/);
    await expect(capa(BOLSISTA, "site-media", "covers/y.jpg")).rejects.toThrow(/row-level security/);
    await expect(capa(DESLIGADA, "site-media", "covers/z.jpg")).rejects.toThrow(/row-level security/);
  });

  it("a coordenação registra a capa em media_file com o próprio id", async () => {
    await como(COORD, `insert into public.media_file (owner_id, url, type) values ($1, 'https://x/covers/x.jpg', 'image')`, [COORD]);
  });
});
