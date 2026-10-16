// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

// Spec 017, parte de banco: 20261016_security_db_hardening.sql em PGlite no
// molde do Supabase. O public real não está no repo; a fixture
// (tests/integration/fixtures/public-baseline-1016.sql) reconstrói o mínimo a
// partir do código e usa policies de pior caso, para provar que as travas valem
// qualquer que seja a RLS de produção. Cada sonda roda numa transação desfeita.

/* eslint-disable @typescript-eslint/no-explicit-any */
async function executar(repo: string, semCorrecao: boolean) {
  const linhas: string[] = [];
  const log = (l: string) => linhas.push(l);
  const db = new PGlite({ extensions: { pgcrypto } });

  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $fn$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $fn$;
    grant usage on schema auth to anon, authenticated;
    create table public.user_profile (id uuid primary key);
    grant usage on schema public to anon, authenticated;
    grant select on public.user_profile to authenticated;
  `);

  let falhas = 0;
  async function etapa(nome: string, sql: string) {
    try {
      await db.exec(sql);
      log(`${nome}: OK`);
    } catch (e: any) {
      falhas++;
      log(`${nome}: FAIL -> ${e.message.split("\n")[0]}`);
    }
  }

  await etapa("fixture", readFileSync(`${repo}/tests/integration/fixtures/public-baseline-1016.sql`, "utf8"));
  for (const m of [
    "20260825_security_hardening.sql",
    "20260825_security_hardening_analytics_guard.sql",
    "20260902_security_hardening_followup.sql",
  ]) {
    await etapa(`repo ${m}`, readFileSync(`${repo}/supabase/migrations/${m}`, "utf8"));
  }
  const nova = readFileSync(`${repo}/supabase/migrations/20261016_security_db_hardening.sql`, "utf8");
  if (!semCorrecao) {
    await etapa("nova migration passe 1", nova);
    await etapa("nova migration passe 2", nova);
  }

  const U = {
    admin: "00000000-0000-0000-0000-00000000000a",
    prof: "00000000-0000-0000-0000-0000000000e1", // aprovado, dono de C1
    pendente: "00000000-0000-0000-0000-0000000000e2", // pendente
    outroProf: "00000000-0000-0000-0000-0000000000e3", // aprovado, dono de C2
    aluno: "00000000-0000-0000-0000-0000000000b1", // C1 concluído
    aluno2: "00000000-0000-0000-0000-0000000000b2", // C1 incompleto
    alunoC2: "00000000-0000-0000-0000-0000000000b3", // só em C2, concluído
  };
  const C1 = "c0000000-0000-0000-0000-000000000001";
  const C2 = "c0000000-0000-0000-0000-000000000002";
  const E = { aluno: "e0000000-0000-0000-0000-000000000001", aluno2: "e0000000-0000-0000-0000-000000000002", alunoC2: "e0000000-0000-0000-0000-000000000003" };
  const X1 = "a0000000-0000-0000-0000-000000000001";
  const SUB2 = "5b000000-0000-0000-0000-000000000002";

  await etapa("seed", `
    insert into auth.users select unnest(array['${Object.values(U).join("','")}']::uuid[]);
    insert into public.role values (1,'admin'),(2,'teacher'),(3,'student');
    insert into public.user_profile (id, full_name, email, document, phone, address, birth_date, verification_status) values
      ('${U.admin}','Admin','a@x','111','1','Rua A','1980-01-01',null),
      ('${U.prof}','Prof Aprovado','p@x','222','2','Rua B','1985-01-01','approved'),
      ('${U.pendente}','Prof Pendente','pp@x','333','3','Rua C','1990-01-01','pending'),
      ('${U.outroProf}','Outro Prof','op@x','444','4','Rua D','1986-01-01','approved'),
      ('${U.aluno}','Ana Aluna','al@x','55566677788','5','Rua E','2010-01-01',null),
      ('${U.aluno2}','Beto Aluno','b@x','99988877766','6','Rua F','2011-01-01',null),
      ('${U.alunoC2}','Caio Aluno','c@x','12312312312','7','Rua G','2012-01-01',null);
    insert into public.user_role (user_profile_id, role_id) values
      ('${U.admin}',1),('${U.prof}',2),('${U.pendente}',2),('${U.outroProf}',2),('${U.aluno}',3),('${U.aluno2}',3),('${U.alunoC2}',3);
    insert into public.course values ('${C1}','Robótica','${U.prof}'),('${C2}','Arte','${U.outroProf}');
    insert into public.lesson values
      ('11000000-0000-0000-0000-000000000001','${C1}','Aula 1'),
      ('11000000-0000-0000-0000-000000000002','${C1}','Aula 2'),
      ('11000000-0000-0000-0000-000000000003','${C2}','Aula única');
    insert into public.assignment values ('${X1}','11000000-0000-0000-0000-000000000001','Montar robô',10,'${U.prof}');
    insert into public.enrollment (id, user_id, course_id) values
      ('${E.aluno}','${U.aluno}','${C1}'),('${E.aluno2}','${U.aluno2}','${C1}'),('${E.alunoC2}','${U.alunoC2}','${C2}');
    insert into public.lesson_progress values
      ('${E.aluno}','11000000-0000-0000-0000-000000000001',true),
      ('${E.aluno}','11000000-0000-0000-0000-000000000002',true),
      ('${E.aluno2}','11000000-0000-0000-0000-000000000001',true),
      ('${E.alunoC2}','11000000-0000-0000-0000-000000000003',true);
    insert into public.assignment_submission (assignment_id, user_id, enrollment_id, score, graded_at) values
      ('${X1}','${U.aluno}','${E.aluno}',8,now());
    insert into public.assignment_submission (id, assignment_id, user_id, enrollment_id) values
      ('${SUB2}','${X1}','${U.aluno2}','${E.aluno2}');
  `);

  // quem: uid (authenticated) | 'service_role' | 'postgres'
  async function sonda(nome: string, quem: string, sql: string, esperado: "permite" | "nega", prep?: string) {
    await db.exec("begin");
    let resultado: any;
    try {
      if (prep) await db.exec(prep);
      if (quem === "service_role") await db.exec("set local role service_role");
      else if (quem !== "postgres") {
        await db.exec(`set local role authenticated; set local request.jwt.claim.sub = '${quem}'`);
      }
      const r = await db.query(sql);
      resultado = { ok: true, linhas: r.rows.length, rows: r.rows, afetadas: r.affectedRows };
    } catch (e: any) {
      resultado = { ok: false, erro: e.message.split("\n")[0] };
    } finally {
      await db.exec("rollback");
    }
    // UPDATE/DELETE barrado só pela RLS não dá erro: conta 0 linhas.
    const passou = resultado.ok && Math.max(resultado.afetadas ?? 0, resultado.linhas) > 0;
    const certo = esperado === "permite" ? passou : !passou;
    if (!certo) falhas++;
    const det = resultado.ok ? `${Math.max(resultado.afetadas ?? 0, resultado.linhas)} linha(s)` : resultado.erro;
    log(`${certo ? "PASS" : "FAIL"} [espera ${esperado}] ${nome} -> ${det}`);
    return resultado;
  }

  log("\n-- (a) papel e status de verificação");
  await sonda("aluno muda o próprio nome/telefone/e-mail", U.aluno, `update public.user_profile set full_name='Ana B', phone='9', email='n@x' where id='${U.aluno}' returning id`, "permite");
  await sonda("aluno se marca professor aprovado", U.aluno, `update public.user_profile set verification_status='approved' where id='${U.aluno}' returning id`, "nega");
  await sonda("professor pendente se autoaprova", U.pendente, `update public.user_profile set verification_status='approved' where id='${U.pendente}' returning id`, "nega");
  await sonda("aluno reativa/desativa a própria conta", U.aluno, `update public.user_profile set is_active=false where id='${U.aluno}' returning id`, "nega");
  await sonda("aluno cria perfil já aprovado", U.aluno, `insert into public.user_profile (id, verification_status) values ('${U.aluno}','approved') on conflict (id) do update set verification_status = excluded.verification_status returning id`, "nega");
  await sonda("aluno se dá papel de admin", U.aluno, `insert into public.user_role values ('${U.aluno}',1,'${U.aluno}') returning user_profile_id`, "nega");
  await sonda("aluno troca o próprio papel para professor", U.aluno, `update public.user_role set role_id=2 where user_profile_id='${U.aluno}' returning user_profile_id`, "nega");
  await sonda("aluno pede para ser professor (pendente)", U.aluno, `insert into public.teacher_request (user_id, status) values ('${U.aluno}','pending') returning id`, "permite");
  await sonda("aluno cria pedido já aprovado", U.aluno, `insert into public.teacher_request (user_id, status) values ('${U.aluno}','approved') returning id`, "nega");
  await sonda("admin (logado) aprova professor", U.admin, `update public.user_profile set verification_status='approved' where id='${U.pendente}' returning id`, "permite");
  await sonda("servidor (service_role) aprova professor", "service_role", `update public.user_profile set verification_status='approved', updated_at=now() where id='${U.pendente}' returning id`, "permite");
  await sonda("servidor (setOnboardingRole) troca papel e grava pendente", "service_role", `
    with d as (delete from public.user_role where user_profile_id='${U.aluno}' returning 1),
         i as (insert into public.user_role values ('${U.aluno}',2,'${U.aluno}') returning 1)
    update public.user_profile set verification_status='pending' where id='${U.aluno}' returning id`, "permite");
  await sonda("cadastro novo (trigger do auth, como postgres)", "postgres", `insert into public.user_profile (id, full_name, verification_status) values (gen_random_uuid(),'Novo','pending') returning id`, "permite");

  log("\n-- (b) certificado");
  await sonda("aluno que concluiu emite o próprio", U.aluno, `insert into public.certificate (enrollment_id, student_name) values ('${E.aluno}','FORJADO') returning student_name, student_cpf, course_title, verification_code`, "permite");
  await sonda("aluno que NÃO concluiu emite o próprio (direto na API)", U.aluno2, `insert into public.certificate (enrollment_id) values ('${E.aluno2}') returning id`, "nega");
  await sonda("aluno emite certificado da matrícula de outro", U.aluno2, `insert into public.certificate (enrollment_id) values ('${E.aluno}') returning id`, "nega");
  await sonda("professor dono emite para aluno que concluiu", U.prof, `insert into public.certificate (enrollment_id) values ('${E.aluno}') returning id`, "permite");
  await sonda("professor dono emite para aluno que NÃO concluiu", U.prof, `insert into public.certificate (enrollment_id) values ('${E.aluno2}') returning id`, "nega");
  await sonda("professor de outro curso emite (policy de professor deixaria)", U.outroProf, `insert into public.certificate (enrollment_id) values ('${E.aluno}') returning id`, "nega");
  await sonda("professor pendente emite", U.pendente, `insert into public.certificate (enrollment_id) values ('${E.aluno}') returning id`, "nega");
  await sonda("admin emite para aluno que concluiu", U.admin, `insert into public.certificate (enrollment_id) values ('${E.aluno}') returning id`, "permite");
  await sonda("outro professor emite no próprio curso concluído", U.outroProf, `insert into public.certificate (enrollment_id) values ('${E.alunoC2}') returning id`, "permite");

  log("\n-- (c) nota");
  await sonda("aluno entrega sem nota", U.aluno2, `insert into public.assignment_submission (assignment_id, user_id, content_url) values ('${X1}','${U.aluno2}','https://x') returning id`, "permite");
  await sonda("aluno entrega já com nota 10", U.aluno2, `insert into public.assignment_submission (assignment_id, user_id, score, graded_at) values ('${X1}','${U.aluno2}',10,now()) returning id`, "nega");
  await sonda("aluno edita a própria entrega (link/comentário)", U.aluno2, `update public.assignment_submission set content_url='https://y', comments='ok' where id='${SUB2}' returning id`, "permite");
  await sonda("aluno se dá nota na própria entrega", U.aluno2, `update public.assignment_submission set score=10, graded_at=now() where id='${SUB2}' returning id`, "nega");
  await sonda("aluno escreve o próprio feedback", U.aluno2, `update public.assignment_submission set feedback='ótimo' where id='${SUB2}' returning id`, "nega");
  await sonda("professor do curso corrige", U.prof, `update public.assignment_submission set score=7, feedback='bom', graded_at=now(), graded_by='${U.prof}' where id='${SUB2}' returning id`, "permite");
  await sonda("professor do curso apaga a correção", U.prof, `update public.assignment_submission set score=null, feedback=null, graded_at=null, graded_by=null where id='${SUB2}' returning id`, "permite");
  await sonda("professor de outro curso corrige (policy de professor deixaria)", U.outroProf, `update public.assignment_submission set score=10, graded_at=now() where id='${SUB2}' returning id`, "nega");
  await sonda("admin corrige", U.admin, `update public.assignment_submission set score=9, graded_at=now() where id='${SUB2}' returning id`, "permite");

  log("\n-- (d) dados pessoais");
  if (!semCorrecao) {
    const r = await sonda("professor dono lista alunos do curso pela função", U.prof, `select * from public.get_course_people('${C1}')`, "permite");
    if (r.ok) {
      const colunas = Object.keys(r.rows[0] ?? {}).join(",");
      const ok = colunas === "id,full_name,email,avatar_url";
      if (!ok) falhas++;
      log(`${ok ? "PASS" : "FAIL"} função devolve só ${colunas}`);
    }
    await sonda("professor de outro curso usa a função", U.outroProf, `select * from public.get_course_people('${C1}')`, "nega");
    await sonda("aluno usa a função", U.aluno, `select * from public.get_course_people('${C1}')`, "nega");
  }
  await sonda("hoje (etapa 1): professor dono ainda lê o CPF do aluno pela tabela", U.prof, `select document from public.user_profile where id='${U.aluno}'`, "permite");
  if (!semCorrecao) {
    await sonda("etapa 2 aplicada: professor dono não lê mais o CPF", U.prof,
      `select document from public.user_profile where id='${U.aluno}'`, "nega",
      `drop policy if exists "Teachers view enrolled student profiles" on public.user_profile`);
  }

  log("\n-- (e) analytics");
  await sonda("professor pendente vê aluno qualquer", U.pendente, `select public.get_analytics_by_student('${U.aluno}')`, "nega");
  await sonda("professor pendente vê a plataforma toda", U.pendente, `select public.get_analytics_overview()`, "nega");
  await sonda("professor aprovado vê aluno do próprio curso", U.prof, `select public.get_analytics_by_student('${U.aluno}')`, "permite");
  await sonda("professor aprovado vê aluno de outro curso", U.prof, `select public.get_analytics_by_student('${U.alunoC2}')`, "nega");
  await sonda("professor aprovado vê o próprio curso", U.prof, `select public.get_analytics_by_course('${C1}')`, "permite");
  await sonda("professor aprovado vê curso alheio", U.prof, `select public.get_analytics_by_course('${C2}')`, "nega");
  await sonda("professor aprovado vê a plataforma toda", U.prof, `select public.get_analytics_overview()`, "nega");
  await sonda("aluno vê analytics de outro aluno", U.aluno, `select public.get_analytics_by_student('${U.aluno2}')`, "nega");
  await sonda("admin vê a plataforma toda", U.admin, `select public.get_analytics_overview()`, "permite");
  await sonda("admin vê trilha", U.admin, `select public.get_analytics_by_learning_path('${C1}')`, "permite");


  return { falhas, linhas };
}

describe("20261016_security_db_hardening.sql", () => {
  it("roda duas vezes e todas as sondas por papel dão o resultado esperado", async () => {
    const r = await executar(process.cwd(), false);
    expect(r.linhas.filter((l) => l.startsWith("FAIL") || l.includes(": FAIL"))).toEqual([]);
    expect(r.falhas).toBe(0);
    expect(r.linhas.filter((l) => l.startsWith("PASS")).length).toBe(47);
  }, 60_000);

  it("sem a migration, os 20 ataques passam e os fluxos legítimos continuam", async () => {
    const r = await executar(process.cwd(), true);
    const ataques = r.linhas.filter((l) => l.startsWith("FAIL [espera nega]"));
    expect(ataques.length).toBe(20);
    expect(r.linhas.filter((l) => l.startsWith("FAIL [espera permite]"))).toEqual([]);
  }, 60_000);
});
