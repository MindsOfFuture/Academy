// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { comoUsuario, gestaoAte } from "./helpers/gestao";

/**
 * O e-mail do perfil não muda pelo navegador. Antes, qualquer pessoa gravava
 * no próprio perfil o e-mail de outra e podia ser a escolhida pela busca da
 * coordenação na hora de dar papel na equipe. Prova em PostgreSQL real:
 *   - a sessão do navegador não troca o e-mail (nem a própria), mas edita o resto;
 *   - admin, service role e funções do banco seguem gravando;
 *   - troca confirmada no login (auth.users) chega ao perfil;
 *   - a busca por e-mail usa o e-mail confirmado do login, não o do perfil.
 */

const AUTOAPROVACAO = readFileSync("supabase/migrations/20261109_professor_nao_se_autoaprova.sql", "utf8");
const MIGRATION = readFileSync("supabase/migrations/20261123_perfil_email_so_pelo_login.sql", "utf8");
const GESTAO = gestaoAte("20260928_gestao_papeis_acumulados");

const ADMIN = "10000000-0000-4000-8000-000000000000";
const COORD = "10000000-0000-4000-8000-000000000001";
const BIA = "20000000-0000-4000-8000-000000000001";
const IMPOSTOR = "30000000-0000-4000-8000-000000000001";
const SEM_CONFIRMAR = "40000000-0000-4000-8000-000000000001";

describe("e-mail do perfil só pelo login", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const como = comoUsuario(db);

  async function emailDoPerfil(id: string) {
    return (await db.query<{ email: string }>(`select email from public.user_profile where id = $1`, [id])).rows[0].email;
  }

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;

      create schema auth;
      create table auth.users (id uuid primary key, email varchar(255), email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;

      create table public.role (id integer primary key, name text not null);
      insert into public.role values (1, 'admin'), (3, 'student');
      create table public.user_role (user_profile_id uuid not null, role_id integer not null);
      create function public.is_admin() returns boolean language sql stable security definer as $fn$
        select exists (select 1 from public.user_role ur join public.role r on r.id = ur.role_id
                       where ur.user_profile_id = auth.uid() and r.name = 'admin')
      $fn$;

      create table public.user_profile (
        id uuid primary key, full_name text not null, email text not null,
        verification_status text, is_active boolean default true
      );
      alter table public.user_profile enable row level security;
      create policy "Users view own profile" on public.user_profile
        for select to authenticated using (auth.uid() = id);
      create policy "Users and Admins update profile" on public.user_profile
        for update using ((auth.uid() = id) or public.is_admin());
      -- Como em produção: UPDATE na tabela inteira, então revoke de coluna não adiantaria.
      grant usage on schema public to anon, authenticated;
      grant select, update on public.user_profile to anon, authenticated;
      grant execute on function public.is_admin() to authenticated;

      create table public.teacher_request (
        id uuid primary key default gen_random_uuid(), user_id uuid, status text,
        reviewed_by uuid, reviewed_at timestamptz
      );

      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text check (channel in ('email', 'in-app')),
        type text, payload jsonb, read_at timestamptz, created_at timestamptz default now()
      );
      alter table public.notification enable row level security;
      create policy "Own notifications only" on public.notification using (user_id = auth.uid());
      grant select, insert, update on public.notification to authenticated;

      insert into auth.users (id, email, email_confirmed_at) values
        ('${ADMIN}', 'admin@ufjf.br', now()),
        ('${COORD}', 'cris@ufjf.br', now()),
        ('${BIA}', 'bia@estudante.ufjf.br', now()),
        ('${IMPOSTOR}', 'impostor@gmail.com', now()),
        ('${SEM_CONFIRMAR}', 'nova@gmail.com', null);
      -- O impostor já gravou no perfil o e-mail da Bia (o que era possível antes desta migração).
      insert into public.user_profile (id, full_name, email) values
        ('${ADMIN}', 'Admin', 'admin@ufjf.br'),
        ('${COORD}', 'Cris Coordenação', 'cris@ufjf.br'),
        ('${IMPOSTOR}', 'Aaa Impostor', 'bia@estudante.ufjf.br'),
        ('${BIA}', 'Bia Bolsista', 'bia@estudante.ufjf.br'),
        ('${SEM_CONFIRMAR}', 'Nova', 'nova@gmail.com');
      insert into public.user_role values ('${ADMIN}', 1), ('${IMPOSTOR}', 3), ('${BIA}', 3);
    `);
    for (const sql of GESTAO) await db.exec(sql);
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`insert into gestao.papel_membro (user_profile_id, coordenacao) values ('${COORD}', true)`);
    await db.exec(`reset request.jwt.claim.sub`);

    await db.exec(AUTOAPROVACAO);
    await db.exec(MIGRATION);
    await db.exec(MIGRATION); // reexecutável

    // Função do banco que grava o e-mail (como a anonimização da exclusão de conta).
    await db.exec(`
      create function public.anonimizar_teste(p_id uuid) returns void language sql security definer
        set search_path to '' as $fn$
        update public.user_profile set email = 'deleted+' || p_id || '@academy.local' where id = p_id
      $fn$;
      grant execute on function public.anonimizar_teste(uuid) to authenticated;
    `);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("o navegador não troca o e-mail do perfil, mas segue editando nome", async () => {
    await expect(
      como(IMPOSTOR, () => db.exec(`update public.user_profile set email = 'cris@ufjf.br' where id = '${IMPOSTOR}'`)),
    ).rejects.toThrow(/confirmação/);
    // Código antigo manda o mesmo e-mail junto com o nome: continua passando.
    await como(IMPOSTOR, () =>
      db.exec(`update public.user_profile set full_name = 'Imp', email = 'bia@estudante.ufjf.br' where id = '${IMPOSTOR}'`),
    );
    const r = await db.query<{ full_name: string; email: string }>(
      `select full_name, email from public.user_profile where id = $1`, [IMPOSTOR]);
    expect(r.rows[0]).toEqual({ full_name: "Imp", email: "bia@estudante.ufjf.br" });
  });

  it("a verificação da conta continua só da administração", async () => {
    await expect(
      como(IMPOSTOR, () => db.exec(`update public.user_profile set is_active = false where id = '${IMPOSTOR}'`)),
    ).rejects.toThrow(/administração/);
  });

  it("admin, service role e funções do banco seguem gravando o e-mail", async () => {
    await como(ADMIN, () => db.exec(`update public.user_profile set email = 'admin2@ufjf.br' where id = '${ADMIN}'`));
    expect(await emailDoPerfil(ADMIN)).toBe("admin2@ufjf.br");
    // Service role / rota do servidor: sem sessão (auth.uid() nulo).
    await db.exec(`update public.user_profile set email = 'admin@ufjf.br' where id = '${ADMIN}'`);
    expect(await emailDoPerfil(ADMIN)).toBe("admin@ufjf.br");
    await como(SEM_CONFIRMAR, () => db.exec(`select public.anonimizar_teste('${SEM_CONFIRMAR}')`));
    expect(await emailDoPerfil(SEM_CONFIRMAR)).toBe(`deleted+${SEM_CONFIRMAR}@academy.local`);
  });

  it("troca confirmada no login chega ao perfil, mesmo com sessão no contexto", async () => {
    await db.exec(`update auth.users set email = 'impostor.novo@gmail.com' where id = '${IMPOSTOR}'`);
    expect(await emailDoPerfil(IMPOSTOR)).toBe("impostor.novo@gmail.com");
    await db.exec(`set request.jwt.claim.sub = '${BIA}'`);
    try {
      await db.exec(`update auth.users set email = 'bia.nova@estudante.ufjf.br' where id = '${BIA}'`);
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
    expect(await emailDoPerfil(BIA)).toBe("bia.nova@estudante.ufjf.br");
    await db.exec(`update auth.users set email = 'bia@estudante.ufjf.br' where id = '${BIA}'`);
    // Volta o perfil do impostor para o e-mail da Bia, para o teste da busca.
    await db.exec(`update public.user_profile set email = 'bia@estudante.ufjf.br' where id = '${IMPOSTOR}'`);
  });

  it("a busca da coordenação acha a dona do e-mail confirmado, não quem o copiou no perfil", async () => {
    const achado = await como(COORD, async () =>
      (await db.query<{ id: string; email: string; coordenacao: boolean | null }>(
        `select id::text, email, coordenacao from gestao.buscar_usuario_por_email('  BIA@estudante.ufjf.br ')`,
      )).rows,
    );
    expect(achado).toEqual([{ id: BIA, email: "bia@estudante.ufjf.br", coordenacao: null }]);
  });

  it("conta sem e-mail confirmado não aparece; quem não é coordenação não busca", async () => {
    await db.exec(`update public.user_profile set email = 'nova@gmail.com' where id = '${SEM_CONFIRMAR}'`);
    const nada = await como(COORD, async () =>
      (await db.query(`select * from gestao.buscar_usuario_por_email('nova@gmail.com')`)).rows,
    );
    expect(nada).toEqual([]);
    await expect(
      como(BIA, () => db.query(`select * from gestao.buscar_usuario_por_email('cris@ufjf.br')`)),
    ).rejects.toThrow(/coordenação/);
  });
});
