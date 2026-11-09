// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const MIGRATION = readFileSync("supabase/migrations/20261109_professor_so_no_proprio_curso.sql", "utf8");
const AUXILIARES = readFileSync("supabase/migrations/20261109_auxiliares_so_para_quem_tem_relacao.sql", "utf8");

const ADMIN = "11111111-1111-4111-8111-111111111111";
const DONO = "22222222-2222-4222-8222-222222222222"; // professor aprovado, dono do curso
const OUTRO = "33333333-3333-4333-8333-333333333333"; // professor aprovado, sem o curso
const PENDENTE = "44444444-4444-4444-8444-444444444444"; // acabou de se cadastrar
const ALUNO = "55555555-5555-4555-8555-555555555555";
const CURSO = "66666666-6666-4666-8666-666666666666";
const MATRICULA = "77777777-7777-4777-8777-777777777777";
const TAREFA = "88888888-8888-4888-8888-888888888888";

describe("professor só age no próprio curso, em PostgreSQL real", () => {
  const db = new PGlite();

  async function como<T>(uid: string, fn: () => Promise<T>): Promise<T> {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${uid}'`);
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
    }
  }
  const conta = (uid: string, sql: string) =>
    como(uid, async () => (await db.query<{ n: number }>(`select count(*)::int as n from (${sql}) q`)).rows[0].n);

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;
      grant usage on schema public to authenticated;
      -- Como em produção: a pessoa lê o próprio perfil e papéis (is_teacher_approved é invoker).
      create table public.role (id int primary key, name text);
      insert into public.role values (1,'admin'),(2,'teacher'),(3,'student');
      create table public.user_role (user_profile_id uuid, role_id int);
      create table public.user_profile (id uuid primary key, full_name text, verification_status text);
      insert into public.user_profile values
        ('${ADMIN}','Admin',null),('${DONO}','Dono','approved'),('${OUTRO}','Outro','approved'),
        ('${PENDENTE}','Pendente','pending'),('${ALUNO}','Aluno',null);
      insert into public.user_role values
        ('${ADMIN}',1),('${DONO}',2),('${OUTRO}',2),('${PENDENTE}',2),('${ALUNO}',3);
      grant select on public.role, public.user_role, public.user_profile to authenticated;
      create function public.is_admin() returns boolean language sql stable security definer as $fn$
        select exists (select 1 from public.user_role ur join public.role r on r.id = ur.role_id
                       where ur.user_profile_id = auth.uid() and r.name = 'admin')
      $fn$;
      create function public.is_teacher_approved(p uuid) returns boolean language sql stable as $fn$
        select exists (select 1 from public.user_profile up join public.user_role ur on ur.user_profile_id = up.id
                       join public.role r on r.id = ur.role_id
                       where up.id = p and r.name = 'teacher' and up.verification_status = 'approved')
      $fn$;
      create table public.course (id uuid primary key, owner_id uuid);
      create table public.course_module (id uuid primary key, course_id uuid);
      create table public.lesson (id uuid primary key, module_id uuid);
      create table public.assignment (id uuid primary key, lesson_id uuid);
      create table public.enrollment (id uuid primary key, course_id uuid, user_id uuid, status text);
      create table public.certificate (id uuid primary key default gen_random_uuid(), enrollment_id uuid);
      create table public.activity_chat_message (
        id uuid primary key default gen_random_uuid(), assignment_id uuid, student_id uuid, sender_id uuid, content text);
      create table public.tag (id uuid primary key default gen_random_uuid(), name text);
      create table public.telemetry_assessment_interaction (user_id uuid);
      create table public.telemetry_content_review (user_id uuid);
      create table public.telemetry_course_milestone (user_id uuid);
      create table public.telemetry_video_interaction (user_id uuid);
      insert into public.course values ('${CURSO}','${DONO}');
      insert into public.course_module values ('${CURSO}','${CURSO}');
      insert into public.lesson values ('${CURSO}','${CURSO}');
      insert into public.assignment values ('${TAREFA}','${CURSO}');
      insert into public.enrollment values ('${MATRICULA}','${CURSO}','${ALUNO}','active');
      insert into public.certificate (enrollment_id) values ('${MATRICULA}');
      insert into public.activity_chat_message (assignment_id, student_id, sender_id, content)
        values ('${TAREFA}','${ALUNO}','${ALUNO}','oi');
      insert into public.telemetry_video_interaction values ('${ALUNO}');
      do $$ declare t text; begin
        foreach t in array array['enrollment','certificate','activity_chat_message','tag',
          'telemetry_assessment_interaction','telemetry_content_review','telemetry_course_milestone','telemetry_video_interaction']
        loop
          execute format('alter table public.%I enable row level security', t);
          execute format('grant select, insert, update, delete on public.%I to authenticated', t);
        end loop;
      end $$;
      -- Leitura liberada: update/delete com WHERE também passam pela policy de SELECT,
      -- e sem ela todo update/delete afetaria 0 linhas e os testes não provariam nada.
      create policy ler_tudo on public.enrollment for select using (true);
    `);
    await db.exec(MIGRATION);
    await db.exec(MIGRATION); // reexecutável
    await db.exec(`
      create table if not exists public.lesson_progress (enrollment_id uuid, is_completed boolean);
      create table if not exists public.assignment_submission (assignment_id uuid, user_id uuid, graded_at timestamptz, score numeric);
      alter table public.lesson add column if not exists course_id uuid;
      alter table public.assignment add column if not exists max_score numeric;
      -- Matrícula concluída de verdade, para matricula_concluida responder "sim" a quem pode ver.
      update public.lesson set course_id = '${CURSO}';
      insert into public.lesson_progress values ('${MATRICULA}', true);
      insert into public.assignment_submission values ('${TAREFA}', '${ALUNO}', now(), 10);
    `);
    await db.exec(AUXILIARES);
    await db.exec(AUXILIARES);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("certificados com CPF só para o dono do curso e admin", async () => {
    expect(await conta(PENDENTE, "select * from public.certificate")).toBe(0);
    expect(await conta(OUTRO, "select * from public.certificate")).toBe(0);
    expect(await conta(DONO, "select * from public.certificate")).toBe(1);
    expect(await conta(ADMIN, "select * from public.certificate")).toBe(1);
  });

  it("emitir certificado e matricular exige ser dono do curso", async () => {
    await expect(como(PENDENTE, () =>
      db.exec(`insert into public.certificate (enrollment_id) values ('${MATRICULA}')`))).rejects.toThrow(/row-level/);
    await expect(como(OUTRO, () =>
      db.exec(`insert into public.enrollment values (gen_random_uuid(),'${CURSO}','${OUTRO}','active')`))).rejects.toThrow(/row-level/);
    await como(DONO, () => db.exec(`insert into public.certificate (enrollment_id) values ('${MATRICULA}')`));
    const alterada = await como(DONO, () => db.query(`update public.enrollment set status = 'completed' where id = '${MATRICULA}'`));
    expect(alterada.affectedRows).toBe(1);
    const deFora = await como(OUTRO, () => db.query(`update public.enrollment set status = 'active' where id = '${MATRICULA}'`));
    expect(deFora.affectedRows).toBe(0);
    await como(ADMIN, () => db.exec(`insert into public.enrollment values (gen_random_uuid(),'${CURSO}','${ADMIN}','active')`));
  });

  it("professor de fora não apaga matrícula alheia", async () => {
    // OUTRO é aprovado: só a checagem de dono do curso o barra.
    await como(OUTRO, () => db.exec(`delete from public.enrollment where id = '${MATRICULA}'`));
    await como(PENDENTE, () => db.exec(`delete from public.enrollment where id = '${MATRICULA}'`));
    const r = await db.query(`select 1 from public.enrollment where id = '${MATRICULA}'`);
    expect(r.rows).toHaveLength(1);
  });

  it("chat: aluno, dono do curso e admin; ninguém mais", async () => {
    expect(await conta(ALUNO, "select * from public.activity_chat_message")).toBe(1);
    expect(await conta(DONO, "select * from public.activity_chat_message")).toBe(1);
    expect(await conta(PENDENTE, "select * from public.activity_chat_message")).toBe(0);
    expect(await conta(OUTRO, "select * from public.activity_chat_message")).toBe(0);
    await como(DONO, () => db.exec(`insert into public.activity_chat_message (assignment_id, student_id, sender_id, content)
      values ('${TAREFA}','${ALUNO}','${DONO}','resposta')`));
    await expect(como(OUTRO, () => db.exec(`insert into public.activity_chat_message (assignment_id, student_id, sender_id, content)
      values ('${TAREFA}','${ALUNO}','${OUTRO}','x')`))).rejects.toThrow(/row-level/);
  });

  it("telemetria geral só para admin; tags para professor aprovado", async () => {
    expect(await conta(DONO, "select * from public.telemetry_video_interaction")).toBe(0);
    expect(await conta(ADMIN, "select * from public.telemetry_video_interaction")).toBe(1);
    await expect(como(PENDENTE, () => db.exec(`insert into public.tag (name) values ('x')`))).rejects.toThrow(/row-level/);
    await como(OUTRO, () => db.exec(`insert into public.tag (name) values ('robótica')`));
  });

  it("auxiliares não revelam curso nem conclusão de matrícula alheia", async () => {
    const curso = (uid: string) => como(uid, async () =>
      (await db.query<{ c: string | null }>(`select public.curso_da_matricula('${MATRICULA}') as c`)).rows[0].c);
    expect(await curso(ALUNO)).toBe(CURSO);
    expect(await curso(DONO)).toBe(CURSO);
    expect(await curso(OUTRO)).toBeNull();
    expect(await curso(PENDENTE)).toBeNull();
    const tarefa = (uid: string) => como(uid, async () =>
      (await db.query<{ c: string | null }>(`select public.curso_da_tarefa('${TAREFA}') as c`)).rows[0].c);
    expect(await tarefa(DONO)).toBe(CURSO);
    expect(await tarefa(OUTRO)).toBeNull();
    const concluiu = (uid: string) => como(uid, async () =>
      (await db.query<{ c: boolean }>(`select public.matricula_concluida('${MATRICULA}') as c`)).rows[0].c);
    expect(await concluiu(ALUNO)).toBe(true); // a matrícula está concluída: o "false" abaixo é a guarda
    expect(await concluiu(OUTRO)).toBe(false);
  });
});
