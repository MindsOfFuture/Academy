// @vitest-environment node
import { readFileSync, existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const base = ["20260905_gestao_modelo_operacional", "20260905_gestao_membro_rpc", "20260923_gestao_fundacao", "20260924_gestao_melhorias", "20260928_gestao_papeis_acumulados", "20260928_gestao_sem_valor_na_bolsa"];
const path = "supabase/migrations/20261008_gestao_turmas.sql";
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const coord = id(1), member = id(2), other = id(3), outsider = id(4), school = id(10), classA = id(20), classB = id(21), studentA = id(30), studentB = id(31), meetingA = id(40), meetingB = id(41), legacyMeeting = id(42);

describe("M1: turmas, matrículas e chamada com RLS real", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const rows = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows;
  async function as<T>(uid: string, fn: () => Promise<T>) {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${uid}'`);
    try { return await fn(); } finally { await db.exec("reset role; reset request.jwt.claim.sub"); }
  }
  const call = (items: unknown, agenda = meetingA) => `select gestao.salvar_chamada('${agenda}', '${JSON.stringify(items)}'::jsonb, true)`;
  beforeAll(async () => {
    await db.exec(`
      create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated;
      create table public.user_profile(id uuid primary key, full_name text, email text);
      alter table public.user_profile enable row level security;
      create policy own_profile on public.user_profile for select to authenticated using(id=auth.uid());
      grant select on public.user_profile to authenticated;
      create table public.role(id uuid primary key,name text);
      create table public.user_role(user_profile_id uuid,role_id uuid);
      insert into public.role values ('${id(90)}','admin');
      insert into public.user_role values ('${outsider}','${id(90)}');
      create function public.is_admin() returns boolean language sql stable security definer set search_path='public' as $$ select exists(select 1 from public.user_role ur join public.role r on r.id=ur.role_id where ur.user_profile_id=auth.uid() and r.name='admin') $$;
      create table public.notification(id uuid primary key default gen_random_uuid(), user_id uuid, channel text, type text, payload jsonb, read_at timestamptz, created_at timestamptz default now());
      create schema storage;
      create table storage.buckets(id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text);
      alter table storage.objects enable row level security;
      grant usage on schema storage to anon, authenticated;
      grant select, insert, update, delete on storage.objects to anon, authenticated;
      insert into auth.users values ('${coord}'),('${member}'),('${other}'),('${outsider}');
      insert into public.user_profile values ('${coord}','Coordenação fictícia','coord@example.invalid'),('${member}','Bolsista fictício A','a@example.invalid'),('${other}','Bolsista fictício B','b@example.invalid'),('${outsider}','Conta fictícia sem vínculo','sem@example.invalid');
    `);
    for (const name of base) await db.exec(readFileSync(`supabase/migrations/${name}.sql`, "utf8"));
    await db.exec(`set request.jwt.claim.sub='${coord}';
      insert into gestao.papel_membro(user_profile_id,coordenacao,bolsista) values ('${coord}',true,true),('${member}',false,true),('${other}',false,true);
      insert into gestao.escola(id,nome,categoria,cidade) values ('${school}','Escola fictícia','estadual','Cidade fictícia');
      insert into gestao.aluno(id,nome,idade,escola_id,categoria_escola,ano_escolar,modalidade,execucao,cidade) values
      ('${studentA}','Aluno fictício A',14,'${school}','estadual','9º','LEGO','presencial','Cidade fictícia'),
      ('${studentB}','Aluno fictício B',15,'${school}','estadual','9º','LEGO','presencial','Cidade fictícia');
      insert into gestao.agenda(id,data,escola_id,aulas,modalidade,horario) values ('${legacyMeeting}','2026-10-01','${school}','Legado','LEGO','8h');
      insert into gestao.agenda_bolsista(agenda_id,bolsista_id,carga) values ('${legacyMeeting}','${member}','2h');
      reset request.jwt.claim.sub;
    `);
    // A ausência intencional serve à prova RED antes de criar a migration.
    if (existsSync(path) && process.env.M1_SEM_MIGRATION !== "1") {
      await db.exec(readFileSync(path, "utf8"));
      await db.exec(readFileSync(path, "utf8"));
    }
    await as(coord, () => db.exec(`
      insert into gestao.turma(id,escola_id,nome,modalidade,semestre) values ('${classA}','${school}','Turma A','LEGO','2026/2'),('${classB}','${school}','Turma B','LEGO','2026/2');
      insert into gestao.matricula(turma_id,aluno_id,inicio) values ('${classA}','${studentA}','2026-01-01'),('${classB}','${studentB}','2026-01-01');
      insert into gestao.turma_bolsista(turma_id,bolsista_id) values ('${classA}','${member}'),('${classB}','${other}');
      insert into gestao.agenda(id,turma_id,data,escola_id,aulas,modalidade,horario,inicio,fim,professor) values
      ('${meetingA}','${classA}','2026-10-08','${school}','Sensores','LEGO','08:00–10:00','08:00','10:00','Professor fictício'),
      ('${meetingB}','${classB}','2026-10-08','${school}','Motores','LEGO','08:00–10:00','08:00','10:00','Professor fictício');
    `));
    // Reenvio também após dados: não altera cadastros, vínculos ou auditoria.
    const antes = await rows("select count(*)::int n from gestao.registro_auditoria");
    await db.exec(readFileSync(path, "utf8"));
    expect(await rows("select count(*)::int n from gestao.registro_auditoria")).toEqual(antes);
    if (process.env.M1_POLITICA_INSEGURA === "1") {
      await db.exec("drop policy bolsista_le on gestao.aluno; create policy bolsista_le on gestao.aluno for select to authenticated using(gestao.bolsista_na_escola(escola_id))");
    }
  }, 60_000);
  afterAll(() => db.close());

  it("preserva o encontro legado e a alocação, mas não abre outra turma da mesma escola", async () => {
    const result = await as(member, async () => ({
      classes: await rows<{ id: string }>("select id from gestao.turma"),
      students: await rows<{ id: string }>("select id from gestao.aluno order by id"),
      meetings: await rows<{ id: string }>("select id from gestao.agenda order by id"),
    }));
    expect(result.classes).toEqual([{ id: classA }]);
    // Alocação legada por escola não revela aluno que já tem matrícula M1 alheia.
    expect(result.students).toEqual([{ id: studentA }]);
    expect(result.meetings).toEqual([{ id: meetingA }, { id: legacyMeeting }]);
    expect(await as(member, () => rows(`select * from gestao.matricula where turma_id='${classB}'`))).toEqual([]);
  });
  it("queries legadas por escola e agenda continuam funcionando sem liberar turmas", async () => {
    await as(member, () => db.exec(`insert into gestao.aula(agenda_id,titulo,realizada_em) values ('${legacyMeeting}','Legado preservado','2026-10-01')`));
    const [lesson] = await rows<{ id: string }>(`select id from gestao.aula where agenda_id='${legacyMeeting}'`);
    await as(member, () => db.exec(`insert into gestao.presenca(aula_id,aluno_id,presente,assinatura_status) values ('${lesson.id}','${studentA}',false,'pendente')`));
    expect(await as(member, () => rows(`select presente from gestao.presenca where aula_id='${lesson.id}'`))).toEqual([{ presente: false }]);
    expect(await as(member, () => rows(`select nome from gestao.escola where id='${school}'`))).toEqual([{ nome: "Escola fictícia" }]);
    await as(coord, () => db.exec(`delete from gestao.presenca where aula_id='${lesson.id}'; delete from gestao.aula where id='${lesson.id}'`));
  });
  it("recusa não membro, admin público sem vínculo e anônimo", async () => {
    expect(await as(outsider, () => rows("select public.is_admin() ok"))).toEqual([{ ok: true }]);
    expect(await as(outsider, () => rows("select * from gestao.turma"))).toEqual([]);
    await expect(as(outsider, () => db.exec(call([])))).rejects.toThrow(/Acesso negado/);
    await db.exec("set role anon");
    try { await expect(db.query("select * from gestao.turma")).rejects.toThrow(/permission denied/); }
    finally { await db.exec("reset role"); }
  });
  it("não presume presença; frequência sem base é indisponível", async () => {
    const [indicator] = await as(member, () => rows<{ presentes: number; ausentes: number; nao_informados: number; frequencia: number | null }>(`select * from gestao.turma_indicadores where turma_id='${classA}'`));
    expect(indicator).toMatchObject({ presentes: 0, ausentes: 0, nao_informados: 1, frequencia: null });
  });
  it("bolsista salva e corrige chamada idempotente, incluindo apagar informação para desconhecida", async () => {
    await as(member, () => db.exec(call([{ alunoId: studentA, presente: true }])));
    await as(member, () => db.exec(call([{ alunoId: studentA, presente: true }])));
    expect(await rows("select id from gestao.aula where m1")).toHaveLength(1);
    expect(await rows("select id from gestao.presenca")).toHaveLength(1);
    expect(await rows("select atualizado_por from gestao.presenca")).toEqual([{ atualizado_por: member }]);
    await as(member, () => db.exec("update gestao.presenca set assinatura_status='assinado',atualizado_por='"+coord+"'"));
    expect(await rows("select assinatura_status,atualizado_por from gestao.presenca")).toEqual([{ assinatura_status: 'pendente', atualizado_por: member }]);
    await as(member, () => db.exec(call([{ alunoId: studentA, presente: false }])));
    expect((await rows("select presente from gestao.presenca"))[0].presente).toBe(false);
    await as(member, () => db.exec(call([{ alunoId: studentA, presente: null }])));
    expect(await rows("select id from gestao.presenca")).toHaveLength(0);
  });
  it("nega chamada de outra turma e presença de aluno não matriculado mesmo por escrita direta", async () => {
    await expect(as(member, () => db.exec(call([{ alunoId: studentB, presente: true }], meetingB)))).rejects.toThrow(/Acesso negado/);
    await expect(as(member, () => db.exec(call([{ alunoId: studentB, presente: true }])))).rejects.toThrow(/matriculado/);
    const [lesson] = await rows<{ id: string }>("select id from gestao.aula where m1");
    await expect(as(member, () => db.exec(`insert into gestao.presenca(aula_id,aluno_id,presente,assinatura_status) values ('${lesson.id}','${studentB}',true,'pendente')`))).rejects.toThrow(/matriculado/);
  });
  it("recusa horários invertidos e alocação de quem não é bolsista ativo", async () => {
    await expect(as(coord, () => db.exec(`update gestao.agenda set fim='07:00' where id='${meetingA}'`))).rejects.toThrow(/agenda_horario/);
    await expect(as(coord, () => db.exec(`insert into gestao.turma_bolsista(turma_id,bolsista_id) values ('${classA}','${outsider}')`))).rejects.toThrow(/bolsista ativo/);
  });
  it("isolamento da metadata privada e upload bloqueado por retenção", async () => {
    await as(coord, () => db.exec(`insert into gestao.matricula_termo(matricula_id) select id from gestao.matricula where turma_id='${classA}'`));
    expect(await as(member, () => rows("select * from gestao.matricula_termo"))).toEqual([]);
    expect(await as(coord, () => rows("select * from gestao.matricula_termo"))).toHaveLength(1);
    expect(await rows("select public from storage.buckets where id='gestao-termos' ")).toEqual([{ public: false }]);
    await expect(as(coord, () => db.exec("insert into storage.objects(bucket_id,name) values ('gestao-termos','teste.pdf')"))).rejects.toThrow(/row-level security/);
    await expect(as(coord, () => db.exec("update gestao.matricula_termo set arquivo_path='teste.pdf'"))).rejects.toThrow(/retenção/);
  });
  it("importação revisada exige IDs explícitos, é idempotente e recusa fonte alterada", async () => {
    const items = JSON.stringify([{ origemLinha: "linha-1", alunoId: studentA }]);
    const sql = `select gestao.importar_matriculas('${classA}','fonte-ficticia','2026','lote-1','${items}'::jsonb,true)`;
    await as(coord, () => db.exec(sql)); await as(coord, () => db.exec(sql));
    expect(await rows("select * from gestao.importacao_matricula")).toHaveLength(1);
    expect(await rows(`select * from gestao.matricula where turma_id='${classA}'`)).toHaveLength(1);
    await expect(as(coord, () => db.exec(sql.replace(studentA, studentB)))).rejects.toThrow(/alterada/);
    await expect(as(member, () => db.exec(sql))).rejects.toThrow(/coordenação/);
    await expect(as(coord, () => db.exec(sql.replace(",true)", ",false)")))).rejects.toThrow(/revisão/);
  });
  it("encerramento requer confirmação, preserva pendências e autoria", async () => {
    await expect(as(coord, () => db.exec(`select gestao.encerrar_turma('${classA}',false)`))).rejects.toThrow(/confirme/);
    await as(coord, () => db.exec(`select gestao.encerrar_turma('${classA}',true)`));
    expect((await rows(`select status, encerrada_por from gestao.turma where id='${classA}'`))[0]).toMatchObject({ status: "encerrada", encerrada_por: coord });
    expect((await as(coord, () => rows(`select nao_informados,termos_pendentes from gestao.turma_indicadores where turma_id='${classA}'`)))[0]).toMatchObject({ nao_informados: 1, termos_pendentes: 1 });
  });
  it("30 alunos: cadastro/matrícula atomicamente, indicadores parciais e reenvio sem duplicata", async () => {
    // Turma B não interfere na turma A usada nos testes de autorização.
    const novos: string[] = [studentB];
    for (let n = 1; n < 30; n++) {
      const [r] = await as(coord, () => rows<{ aluno: string }>(`select gestao.cadastrar_aluno_turma('${classB}','Aluno fictício ${n}',14,'9º','2026-01-01') aluno`));
      novos.push(r.aluno);
    }
    const itens = novos.map((alunoId, n) => ({ alunoId, presente: n < 10 ? true : n < 20 ? false : null }));
    await as(other, () => db.exec(call(itens, meetingB)));
    await as(other, () => db.exec(call(itens, meetingB)));
    const [i] = await as(other, () => rows(`select * from gestao.turma_indicadores where turma_id='${classB}'`));
    expect(i).toMatchObject({ matriculas: 30, presentes: 10, ausentes: 10, nao_informados: 10, frequencia: '50.00', cobertura: '66.67', horas_aula: '2.0000000000000000', encontros_realizados: 1 });
    expect(await rows(`select p.id from gestao.presenca p join gestao.aula au on au.id=p.aula_id where au.agenda_id='${meetingB}'`)).toHaveLength(20);
    await expect(as(coord, () => db.exec(`select gestao.cadastrar_aluno_turma('${id(999)}','Não pode ficar órfão',14,'9º','2026-01-01')`))).rejects.toThrow(/não encontrada/);
    expect(await rows("select id from gestao.aluno where nome='Não pode ficar órfão'")).toEqual([]);
    expect(await as(member, () => rows(`select * from gestao.turma_indicadores where turma_id='${classB}'`))).toEqual([]);
  });
  it("revogação da turma corta acesso mesmo com alocação legada na mesma escola", async () => {
    await as(coord, () => db.exec(`update gestao.turma_bolsista set revogado_em=now() where turma_id='${classA}' and bolsista_id='${member}'`));
    try {
      expect(await as(member, () => rows(`select id from gestao.turma where id='${classA}'`))).toEqual([]);
      expect(await as(member, () => rows(`select id from gestao.aluno where id='${studentA}'`))).toEqual([]);
      await expect(as(member, () => db.exec(call([])))).rejects.toThrow(/Acesso negado/);
    } finally {
      await as(coord, () => db.exec(`update gestao.turma_bolsista set revogado_em=null where turma_id='${classA}' and bolsista_id='${member}'`));
    }
  });
  it("políticas globais permissivas do Storage não furam o bloqueio dos termos", async () => {
    await db.exec("create policy global_test on storage.objects for all to authenticated using(true) with check(true)");
    await expect(as(coord, () => db.exec("insert into storage.objects(bucket_id,name) values ('gestao-termos','nao-enviar.pdf')"))).rejects.toThrow(/row-level security/);
    await db.exec("insert into storage.objects(bucket_id,name) values ('gestao-termos','fixture-privada.pdf')");
    expect(await as(member, () => rows("select name from storage.objects where bucket_id='gestao-termos'"))).toEqual([]);
    expect(await as(outsider, () => rows("select name from storage.objects where bucket_id='gestao-termos'"))).toEqual([]);
    expect(await as(coord, () => rows("select name from storage.objects where bucket_id='gestao-termos'"))).toEqual([]);
    await db.exec("insert into storage.buckets(id,name,public) values ('outro-bucket','outro-bucket',true)");
    await as(outsider, () => db.exec("insert into storage.objects(bucket_id,name) values ('outro-bucket','fixture-publica.png')"));
    expect(await as(outsider, () => rows("select name from storage.objects where bucket_id='outro-bucket'"))).toEqual([{ name: "fixture-publica.png" }]);
  });
  it("funções mínimas de nomes não enumeram perfis de outras turmas", async () => {
    expect(await as(member, () => rows(`select * from gestao.turma_equipe('${classA}')`))).toEqual([{ id: member, nome: "Bolsista fictício A" }]);
    await expect(as(member, () => db.query(`select * from gestao.turma_equipe('${classB}')`))).rejects.toThrow(/Acesso negado/);
    await expect(as(member, () => db.query(`select * from gestao.chamada_autores('${classB}')`))).rejects.toThrow(/Acesso negado/);
    expect(await as(other, () => rows(`select * from gestao.chamada_autores('${classB}')`))).toEqual([{ id: other, nome: "Bolsista fictício B" }]);
  });
  it("legado só é marcado após conciliação explícita do aluno e reserva corretos", async () => {
    const [mat] = await rows<{ id: string }>(`select id from gestao.matricula where turma_id='${classA}'`);
    await expect(as(coord, () => db.exec(`update gestao.matricula set termo_status='legado_arquivado' where id='${mat.id}'`))).rejects.toThrow(/Concilie/);
    await as(coord, () => db.exec(`
      insert into gestao.reserva(id,escola_id,dias,horarios,modalidade,numero_alunos,serie,status) values ('${id(80)}','${school}','quinta','08h','LEGO',1,'9º','planejada');
      insert into gestao.reserva_termo(id,reserva_id,aluno_id,status) values ('${id(81)}','${id(80)}','${studentA}','arquivado'),('${id(82)}','${id(80)}','${studentB}','arquivado');
      update gestao.turma set reserva_id='${id(80)}' where id='${classA}';
    `));
    await expect(as(coord, () => db.exec(`select gestao.conciliar_termo_legado('${mat.id}','${id(82)}')`))).rejects.toThrow(/correspondência/);
    await as(coord, () => db.exec(`select gestao.conciliar_termo_legado('${mat.id}','${id(81)}')`));
    expect((await rows(`select termo_status from gestao.matricula where id='${mat.id}'`))[0]).toEqual({ termo_status: "legado_arquivado" });
    expect((await rows(`select arquivo_path,conferido_em from gestao.matricula_termo where matricula_id='${mat.id}'`))[0]).toEqual({ arquivo_path: null, conferido_em: null });
  });
  it("marcas sem comprovação e lotes alteráveis não são aceitos", async () => {
    await expect(as(member, () => db.exec(call([{ alunoId: studentA, presente: true }]).replace(', true)', ', false)')))).rejects.toThrow(/Confirme/);
    await expect(as(coord, () => db.exec("update gestao.importacao_matricula set assinatura='alterada'"))).rejects.toThrow(/permission denied/);
  });
  it("desligamento corta leituras e escritas sem apagar histórico", async () => {
    await as(coord, () => db.exec(`update gestao.papel_membro set desligado_em=now() where user_profile_id='${member}'`));
    expect(await as(member, () => rows("select * from gestao.turma"))).toEqual([]);
    await expect(as(member, () => db.exec(call([])))).rejects.toThrow(/Acesso negado/);
    expect(await rows(`select * from gestao.turma_bolsista where bolsista_id='${member}'`)).toHaveLength(1);
    expect((await rows<{ n: number }>("select count(*)::int n from gestao.registro_auditoria where tabela in ('turma','matricula','turma_bolsista')"))[0].n).toBeGreaterThan(0);
  });
  it("reaplicar depois das escritas não altera dados ou auditoria", async () => {
    const sql = "select (select count(*)::int from gestao.matricula) matriculas,(select count(*)::int from gestao.presenca) presencas,(select count(*)::int from gestao.registro_auditoria) auditoria";
    const before = await rows(sql);
    await db.exec(readFileSync(path,"utf8")); await db.exec(readFileSync(path,"utf8"));
    expect(await rows(sql)).toEqual(before);
  });
});
