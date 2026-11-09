// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const SIGNUP = readFileSync("supabase/migrations/20261109_signup_nao_escolhe_admin.sql", "utf8");
const AUTOAPROVACAO = readFileSync("supabase/migrations/20261109_professor_nao_se_autoaprova.sql", "utf8");

const ADMIN = "11111111-1111-4111-8111-111111111111";
const PROFESSOR = "22222222-2222-4222-8222-222222222222";
const n = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

describe("cadastro e verificação de professor em PostgreSQL real", () => {
  const db = new PGlite();

  async function como(uid: string | null, sql: string) {
    await db.exec("reset role");
    if (uid) await db.exec(`set role authenticated; set request.jwt.claim.sub = '${uid}'`);
    else await db.exec(`set request.jwt.claim.sub = ''`);
    try {
      return await db.exec(sql);
    } finally {
      await db.exec("reset role");
    }
  }

  async function papel(id: string) {
    const r = await db.query<{ name: string }>(
      `select r.name from public.user_role ur join public.role r on r.id = ur.role_id where ur.user_profile_id = $1`,
      [id],
    );
    return r.rows.map((x) => x.name);
  }

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;
      create table public.role (id integer primary key, name text not null);
      insert into public.role values (1, 'admin'), (2, 'teacher'), (3, 'student');
      create table public.user_role (user_profile_id uuid not null, role_id integer not null);
      create table public.user_profile (
        id uuid primary key, email text, full_name text, avatar_url text, phone text, address text,
        document text, birth_date date, verification_status text, is_active boolean default true
      );
      create table public.student_details (user_id uuid, parent_name text, school text, grade text);
      create table public.teacher_details (user_id uuid, schools text[], education_level text, degree text);
      create table public.teacher_request (
        id uuid primary key default gen_random_uuid(), user_id uuid, status text,
        qualification_document_url text, reviewed_by uuid, reviewed_at timestamptz
      );
      create function public.is_admin() returns boolean language sql stable security definer as $fn$
        select exists (select 1 from public.user_role ur join public.role r on r.id = ur.role_id
                       where ur.user_profile_id = auth.uid() and r.name = 'admin')
      $fn$;
      grant usage on schema public to authenticated;
      grant select, insert, update on public.user_profile, public.teacher_request to authenticated;
      grant execute on function public.is_admin() to authenticated;
    `);
    await db.exec(SIGNUP);
    await db.exec(AUTOAPROVACAO);
    await db.exec(AUTOAPROVACAO); // reexecutável
    await db.exec(`
      create trigger on_auth_user_created after insert on auth.users
        for each row execute function public.handle_new_user();
      insert into public.user_profile (id) values ('${ADMIN}'), ('${PROFESSOR}');
      insert into public.user_role values ('${ADMIN}', 1), ('${PROFESSOR}', 2);
      update public.user_profile set verification_status = 'pending' where id = '${PROFESSOR}';
    `);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("cadastro com user_type admin vira aluno; professor continua professor", async () => {
    await db.exec(`insert into auth.users values
      ('${n(1)}', 'a@x.com', '{"user_type":"admin"}'),
      ('${n(2)}', 'b@x.com', '{"user_type":"teacher","schools":["E1"]}'),
      ('${n(3)}', 'c@x.com', '{}')`);
    expect(await papel(n(1))).toEqual(["student"]);
    expect(await papel(n(2))).toEqual(["teacher"]);
    expect(await papel(n(3))).toEqual(["student"]);
  });

  it("professor não aprova a si mesmo, mas edita o próprio perfil", async () => {
    await expect(
      como(PROFESSOR, `update public.user_profile set verification_status = 'approved' where id = '${PROFESSOR}'`),
    ).rejects.toThrow(/administração/);
    await expect(
      como(PROFESSOR, `update public.user_profile set is_active = false where id = '${PROFESSOR}'`),
    ).rejects.toThrow(/administração/);
    await como(PROFESSOR, `update public.user_profile set full_name = 'Prof', phone = '1' where id = '${PROFESSOR}'`);
    const r = await db.query<{ full_name: string; verification_status: string }>(
      `select full_name, verification_status from public.user_profile where id = $1`, [PROFESSOR]);
    expect(r.rows[0]).toEqual({ full_name: "Prof", verification_status: "pending" });
  });

  it("solicitação própria só nasce pendente e sem revisor", async () => {
    await expect(
      como(PROFESSOR, `insert into public.teacher_request (user_id, status) values ('${PROFESSOR}', 'approved')`),
    ).rejects.toThrow(/administração/);
    await expect(
      como(PROFESSOR, `insert into public.teacher_request (user_id, status, reviewed_by) values ('${PROFESSOR}', 'pending', '${ADMIN}')`),
    ).rejects.toThrow(/administração/);
    await como(PROFESSOR, `insert into public.teacher_request (user_id, status, qualification_document_url) values ('${PROFESSOR}', 'pending', 'u')`);
    await expect(
      como(PROFESSOR, `update public.teacher_request set status = 'approved' where user_id = '${PROFESSOR}'`),
    ).rejects.toThrow(/administração/);
    await como(PROFESSOR, `update public.teacher_request set qualification_document_url = 'v' where user_id = '${PROFESSOR}'`);
  });

  it("admin e service role (sem sessão) seguem aprovando", async () => {
    await como(ADMIN, `update public.user_profile set verification_status = 'approved' where id = '${PROFESSOR}'`);
    await como(ADMIN, `insert into public.teacher_request (user_id, status, reviewed_by) values ('${PROFESSOR}', 'approved', '${ADMIN}')`);
    await como(null, `update public.user_profile set verification_status = 'rejected', is_active = false where id = '${PROFESSOR}'`);
    const r = await db.query<{ verification_status: string }>(
      `select verification_status from public.user_profile where id = $1`, [PROFESSOR]);
    expect(r.rows[0].verification_status).toBe("rejected");
  });
});
