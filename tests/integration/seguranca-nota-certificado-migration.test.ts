// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const MIGRATION = readFileSync("supabase/migrations/20261109_nota_e_certificado_so_pelo_banco.sql", "utf8");
const AUXILIARES = readFileSync("supabase/migrations/20261109_auxiliares_so_para_quem_tem_relacao.sql", "utf8");
const MATRICULA_DO_ALUNO = readFileSync("supabase/migrations/20261109_matricula_do_aluno_so_conclui.sql", "utf8");

const ADMIN = "11111111-1111-4111-8111-111111111111";
const DONO = "22222222-2222-4222-8222-222222222222";
const ALUNO = "33333333-3333-4333-8333-333333333333";
const CURSO = "44444444-4444-4444-8444-444444444444";
const AULA = "55555555-5555-4555-8555-555555555555";
const TAREFA = "66666666-6666-4666-8666-666666666666";
const MATRICULA = "77777777-7777-4777-8777-777777777777";
const RASCUNHO = "99999999-9999-4999-8999-999999999999";
const ENTREGA = "88888888-8888-4888-8888-888888888888";

describe("nota e certificado conferidos no banco", () => {
  const db = new PGlite();

  async function como(uid: string, sql: string) {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${uid}'`);
    try {
      return await db.exec(sql);
    } finally {
      await db.exec("reset role");
    }
  }
  const emitir = () => como(ALUNO, `insert into public.certificate (enrollment_id) values ('${MATRICULA}')`);

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth, public to authenticated;
      create table public.user_role (user_profile_id uuid, role text);
      insert into public.user_role values ('${ADMIN}', 'admin');
      create function public.is_admin() returns boolean language sql stable security definer as $fn$
        select exists (select 1 from public.user_role where user_profile_id = auth.uid() and role = 'admin')
      $fn$;
      grant execute on function public.is_admin() to authenticated;
      create table public.course (id uuid primary key, owner_id uuid);
      create table public.course_module (id uuid primary key, course_id uuid);
      create table public.lesson (id uuid primary key, module_id uuid, course_id uuid);
      create table public.assignment (id uuid primary key, lesson_id uuid, max_score numeric);
      create table public.enrollment (
        id uuid primary key, course_id uuid, user_id uuid,
        status text default 'active', completed_at timestamptz, enrolled_at timestamptz default now());
      create table public.lesson_progress (enrollment_id uuid, lesson_id uuid, is_completed boolean);
      create table public.assignment_submission (
        id uuid primary key, assignment_id uuid, user_id uuid, content_url text,
        score numeric, grade numeric, feedback text, graded_at timestamptz, graded_by uuid);
      create table public.certificate (id uuid primary key default gen_random_uuid(), enrollment_id uuid);
      insert into public.course values ('${CURSO}', '${DONO}'), ('${RASCUNHO}', '${DONO}');
      insert into public.course_module values ('${CURSO}', '${CURSO}');
      insert into public.lesson values ('${AULA}', '${CURSO}', '${CURSO}');
      insert into public.assignment values ('${TAREFA}', '${AULA}', 10);
      insert into public.enrollment values ('${MATRICULA}', '${CURSO}', '${ALUNO}');
      alter table public.certificate enable row level security;
      grant select, insert on public.certificate, public.enrollment to authenticated;
      grant update on public.enrollment to authenticated;
      grant select on public.lesson, public.course_module to authenticated;
      -- Gatilho de produção: concluir a última aula marca a matrícula concluída, como o aluno.
      create function public.check_course_completion() returns trigger language plpgsql set search_path to 'public' as $fn$
      declare v_course uuid; v_total int; v_feitas int;
      begin
        select course_id into v_course from public.enrollment where id = new.enrollment_id;
        select count(*) into v_total from public.lesson l join public.course_module m on l.module_id = m.id where m.course_id = v_course;
        select count(*) into v_feitas from public.lesson_progress where enrollment_id = new.enrollment_id and is_completed;
        if v_total > 0 and v_total = v_feitas then
          update public.enrollment set status = 'completed', completed_at = now() where id = new.enrollment_id;
        end if;
        return new;
      end $fn$;
      create trigger check_course_completion after insert or update on public.lesson_progress
        for each row execute function public.check_course_completion();
      grant select, insert, update on public.assignment_submission, public.lesson_progress to authenticated;
    `);
    await db.exec(MIGRATION);
    await db.exec(MIGRATION); // reexecutável
    await db.exec(AUXILIARES); // regras abaixo seguem valendo com as auxiliares restritas
    await db.exec(MATRICULA_DO_ALUNO);
    await db.exec(MATRICULA_DO_ALUNO); // reexecutável
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("aluno entrega, mas não dá nota a si mesmo", async () => {
    await expect(como(ALUNO, `insert into public.assignment_submission (id, assignment_id, user_id, score, graded_at)
      values ('${ENTREGA}', '${TAREFA}', '${ALUNO}', 10, now())`)).rejects.toThrow(/corrige/);
    await como(ALUNO, `insert into public.assignment_submission (id, assignment_id, user_id, content_url)
      values ('${ENTREGA}', '${TAREFA}', '${ALUNO}', 'https://x')`);
    await expect(como(ALUNO, `update public.assignment_submission set score = 10, graded_at = now() where id = '${ENTREGA}'`))
      .rejects.toThrow(/corrige/);
    await como(ALUNO, `update public.assignment_submission set content_url = 'https://y' where id = '${ENTREGA}'`);
  });

  it("aluno não troca a matrícula de curso nem se marca concluído antes da hora", async () => {
    await expect(como(ALUNO, `update public.enrollment set course_id = '${RASCUNHO}' where id = '${MATRICULA}'`))
      .rejects.toThrow(/mudar de curso/);
    await expect(como(ALUNO, `update public.enrollment set status = 'completed', completed_at = now() where id = '${MATRICULA}'`))
      .rejects.toThrow(/aulas concluídas/);
    const r = await db.query<{ course_id: string; status: string }>(`select course_id, status from public.enrollment where id = '${MATRICULA}'`);
    expect(r.rows[0]).toEqual({ course_id: CURSO, status: "active" });
  });

  it("sem aulas concluídas e atividade aprovada, o aluno não emite certificado", async () => {
    await expect(emitir()).rejects.toThrow(/row-level/);
    // Concluir a última aula marca a matrícula concluída pelo gatilho, mesmo sem nota ainda.
    await como(ALUNO, `insert into public.lesson_progress values ('${MATRICULA}', '${AULA}', true)`);
    const m = await db.query<{ status: string }>(`select status from public.enrollment where id = '${MATRICULA}'`);
    expect(m.rows[0].status).toBe("completed");
    await expect(emitir()).rejects.toThrow(/row-level/);
    await como(DONO, `update public.assignment_submission set score = 5, graded_at = now(), graded_by = '${DONO}' where id = '${ENTREGA}'`);
    await expect(emitir()).rejects.toThrow(/row-level/); // 50% reprova
  });

  it("corrigido pelo dono com nota suficiente, emite; admin também corrige", async () => {
    await como(ADMIN, `update public.assignment_submission set score = 6 where id = '${ENTREGA}'`);
    // Como em lib/api/certificates.ts: marca concluída e depois emite.
    await como(ALUNO, `update public.enrollment set status = 'completed', completed_at = now() where id = '${MATRICULA}'`);
    await emitir();
    const r = await db.query("select 1 from public.certificate");
    expect(r.rows).toHaveLength(1);
  });

  it("dono do curso e admin seguem alterando a matrícula", async () => {
    await como(DONO, `update public.enrollment set status = 'active', completed_at = null where id = '${MATRICULA}'`);
    await como(ADMIN, `update public.enrollment set status = 'completed' where id = '${MATRICULA}'`);
    const r = await db.query<{ status: string }>(`select status from public.enrollment where id = '${MATRICULA}'`);
    expect(r.rows[0].status).toBe("completed");
  });
});
