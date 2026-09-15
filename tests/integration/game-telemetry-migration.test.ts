// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const MIGRATION = readFileSync("supabase/migrations/20260914_game_answer_telemetry.sql", "utf8");
const TELEMETRY_MIGRATION = readFileSync("supabase/migrations/20260902_learning_event_telemetry.sql", "utf8");

const ALUNO = "123e4567-e89b-42d3-a456-426614174000";
const OUTRO_ALUNO = "223e4567-e89b-42d3-a456-426614174000";
const ADMIN = "323e4567-e89b-42d3-a456-426614174000";
const PROFESSOR = "423e4567-e89b-42d3-a456-426614174000";

const SESSAO = "523e4567-e89b-42d3-a456-426614174000";
const SESSAO_DOIS = "623e4567-e89b-42d3-a456-426614174000";
const SESSAO_TRES = "823e4567-e89b-42d3-a456-426614174000";
const NAVEGACAO = "723e4567-e89b-42d3-a456-426614174000";
const RESPOSTA = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function sessao(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSAO,
    game_key: "cidadania-financeira",
    content_version: "2026-09-01",
    scope_key: "cidadao",
    client_session_id: NAVEGACAO,
    started_at: "2026-09-14T12:00:00.000Z",
    finished_at: null,
    status: "em_andamento",
    answered_count: 1,
    score: null,
    max_score: null,
    outcome_key: null,
    duration_seconds: 12,
    device_info: { viewportWidth: 390, viewportHeight: 844, browserLanguage: "pt-BR" },
    summary: {},
    ...overrides,
  };
}

function resposta(n: number, overrides: Record<string, unknown> = {}) {
  return {
    id: RESPOSTA(n),
    session_id: SESSAO,
    game_key: "cidadania-financeira",
    content_version: "2026-09-01",
    scope_key: "cidadao",
    step_index: n,
    question_key: `cenario-${n}`,
    answer_kind: "escolha",
    answer_key: "A",
    answer_keys: null,
    answer_number: null,
    answer_text: null,
    outcome: "correct",
    points: 10,
    elapsed_ms: 4200,
    answered_at: "2026-09-14T12:00:05.000Z",
    ...overrides,
  };
}

interface IngestResult {
  sessions: number;
  answers: number;
  sessions_rejected: number;
  answers_rejected: number;
}

async function ingest(db: PGlite, sessions: unknown[], answers: unknown[]): Promise<IngestResult> {
  const result = await db.query<{ ingest_game_events: IngestResult }>(
    "select public.ingest_game_events($1::jsonb, $2::jsonb)",
    [JSON.stringify(sessions), JSON.stringify(answers)],
  );
  return result.rows[0].ingest_game_events;
}

describe("respostas de jogo em PostgreSQL real", () => {
  const db = new PGlite();

  beforeAll(async () => {
    await db.exec(`
      set time zone 'UTC';
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key);
      insert into auth.users (id) values
        ('${ALUNO}'), ('${OUTRO_ALUNO}'), ('${ADMIN}'), ('${PROFESSOR}');
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;
      create table public.role (id integer primary key, name text not null);
      create table public.user_role (user_profile_id uuid not null, role_id integer not null);
      insert into public.role (id, name) values (1, 'admin'), (2, 'teacher'), (3, 'student');
      insert into public.user_role (user_profile_id, role_id) values
        ('${ADMIN}', 1), ('${PROFESSOR}', 2), ('${ALUNO}', 3), ('${OUTRO_ALUNO}', 3);
    `);
    await db.exec(TELEMETRY_MIGRATION);
    // Aplicar duas vezes prova que a migration é reexecutável sem estrago.
    await db.exec(MIGRATION);
    await db.exec(MIGRATION);
    await db.exec(`
      grant select on public.game_session to service_role;
      grant select on public.game_answer to service_role;
      -- A função roda com privilégio próprio; em produção o dono é o superusuário
      -- do projeto. Aqui o dono já é quem criou as tabelas, então nada a fazer.
    `);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("grava a partida e as respostas do aluno autenticado, sem duplicar no retry", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ALUNO}'`);

    const first = await ingest(db, [sessao()], [resposta(1)]);
    expect(first).toEqual({ sessions: 1, answers: 1, sessions_rejected: 0, answers_rejected: 0 });

    // O mesmo lote reenviado pelo cliente não pode virar linha nova.
    const retry = await ingest(db, [sessao()], [resposta(1)]);
    expect(retry.answers).toBe(0);

    await db.exec("reset role");
    await db.exec("set role service_role");
    const stored = await db.query<{ total: number; dono: string }>(
      "select count(*)::int as total, min(user_id::text) as dono from public.game_answer",
    );
    expect(stored.rows[0]).toEqual({ total: 1, dono: ALUNO });
    await db.exec("reset role");
  });

  it("fecha a partida e mantém o desfecho quando um lote atrasado chega depois", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ALUNO}'`);

    await ingest(
      db,
      [sessao({
        finished_at: "2026-09-14T12:10:00.000Z",
        status: "concluida",
        answered_count: 25,
        score: 180,
        max_score: 250,
        outcome_key: "especialista",
        duration_seconds: 600,
      })],
      [resposta(2)],
    );

    // Lote fora de ordem: chega depois do fim, com contagem menor.
    await ingest(db, [sessao({ answered_count: 3 })], [resposta(3)]);

    await db.exec("reset role");
    await db.exec("set role service_role");
    const session = await db.query<{
      status: string; answered_count: number; score: number; outcome_key: string;
    }>("select status, answered_count, score, outcome_key from public.game_session where id = $1", [SESSAO]);
    expect(session.rows[0]).toEqual({
      status: "concluida",
      answered_count: 25,
      score: 180,
      outcome_key: "especialista",
    });
    await db.exec("reset role");
  });

  it("recusa resposta apontando para partida de outro aluno", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${OUTRO_ALUNO}'`);
    const result = await ingest(
      db,
      [sessao({ id: SESSAO_DOIS, game_key: "primeiro-passo", scope_key: "etapa-1" })],
      [resposta(9, { session_id: SESSAO })],
    );
    expect(result.answers).toBe(0);

    await db.exec("reset role");
    await db.exec("set role service_role");
    const leak = await db.query<{ total: number }>(
      "select count(*)::int as total from public.game_answer where user_id = $1",
      [OUTRO_ALUNO],
    );
    expect(leak.rows[0].total).toBe(0);
    await db.exec("reset role");
  });

  it("mantém o aluno sem leitura, alteração ou remoção do acervo", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ALUNO}'`);
    await expect(db.query("select * from public.game_answer")).rejects.toThrow(/permission denied/i);
    await expect(db.exec("delete from public.game_answer")).rejects.toThrow(/permission denied/i);
    await expect(db.exec("update public.game_answer set points = 999")).rejects.toThrow(/permission denied/i);
    await expect(db.query("select * from public.game_session")).rejects.toThrow(/permission denied/i);
    await db.exec("reset role");

    await db.exec("set role anon");
    await expect(ingest(db, [sessao()], [])).rejects.toThrow(/permission denied/i);
    await db.exec("reset role");
  });

  it("impede o aluno de gravar partida em nome de outro", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ALUNO}'`);
    // O aluno não tem privilégio direto sobre a tabela: a recusa vem antes mesmo
    // de a política de linha ser avaliada.
    await expect(db.exec(`
      insert into public.game_session (
        id, user_id, game_key, content_version, client_session_id, started_at, status, answered_count
      ) values (
        'd23e4567-e89b-42d3-a456-426614174000', '${OUTRO_ALUNO}', 'primeiro-passo',
        '2026-09-07', '${NAVEGACAO}', now(), 'em_andamento', 0
      )
    `)).rejects.toThrow(/permission denied/i);

    // Pela função, o user_id do lote é ignorado: vale sempre quem está logado.
    await ingest(db, [sessao({ id: "e23e4567-e89b-42d3-a456-426614174000" })], []);
    await db.exec("reset role");
    await db.exec("set role service_role");
    const dono = await db.query<{ user_id: string }>(
      "select user_id::text as user_id from public.game_session where id = $1",
      ["e23e4567-e89b-42d3-a456-426614174000"],
    );
    expect(dono.rows[0].user_id).toBe(ALUNO);
    await db.exec("reset role");
  });

  it("não deixa um aluno sobrescrever a partida de outro com a mesma chave", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${OUTRO_ALUNO}'`);
    const tentativa = await ingest(db, [sessao({ id: SESSAO, score: 999 })], []);
    expect(tentativa.sessions).toBe(0);
    expect(tentativa.sessions_rejected).toBe(1);
    await db.exec("reset role");

    await db.exec("set role service_role");
    const intacta = await db.query<{ user_id: string; score: number }>(
      "select user_id::text as user_id, score from public.game_session where id = $1",
      [SESSAO],
    );
    expect(intacta.rows[0].user_id).toBe(ALUNO);
    expect(intacta.rows[0].score).toBe(180);
    await db.exec("reset role");
  });

  it("recusa jogo fora do catálogo e status incoerente", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ALUNO}'`);

    // Linha inválida é ignorada sem derrubar o lote; nada é gravado.
    const foraDoCatalogo = await ingest(
      db,
      [sessao({ id: "923e4567-e89b-42d3-a456-426614174000", game_key: "jogo-inexistente" })],
      [],
    );
    expect(foraDoCatalogo.sessions).toBe(0);
    expect(foraDoCatalogo.sessions_rejected).toBe(1);

    const statusIncoerente = await ingest(
      db,
      [sessao({ id: "a23e4567-e89b-42d3-a456-426614174000", status: "concluida", finished_at: null })],
      [],
    );
    expect(statusIncoerente.sessions).toBe(0);
    expect(statusIncoerente.sessions_rejected).toBe(1);
    await db.exec("reset role");
  });

  it("exporta para administrador, esconde texto quando pedido e nega os demais papéis", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ALUNO}'`);
    await ingest(
      db,
      [sessao({ id: SESSAO_TRES, game_key: "primeiro-passo", content_version: "2026-09-07", scope_key: "etapa-1" })],
      [resposta(11, {
        session_id: SESSAO_TRES,
        game_key: "primeiro-passo",
        content_version: "2026-09-07",
        scope_key: "etapa-1",
        question_key: "oque",
        answer_kind: "texto",
        answer_key: null,
        answer_text: "bolos caseiros por encomenda",
        outcome: null,
        points: null,
      })],
    );
    await expect(db.query("select public.export_game_answers()")).rejects.toThrow(/Acesso negado/i);
    await db.exec("reset role");

    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${PROFESSOR}'`);
    await expect(db.query("select public.export_game_answers()")).rejects.toThrow(/Acesso negado/i);
    await db.exec("reset role");

    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ADMIN}'`);
    const comTexto = await db.query<{ export_game_answers: { total: number; rows: Record<string, unknown>[] } }>(
      "select public.export_game_answers('primeiro-passo', null, null, true, 100, 0)",
    );
    const linhaComTexto = comTexto.rows[0].export_game_answers.rows[0];
    expect(linhaComTexto.answer_text).toBe("bolos caseiros por encomenda");
    expect(linhaComTexto.session_status).toBe("em_andamento");

    const semTexto = await db.query<{ export_game_answers: { rows: Record<string, unknown>[] } }>(
      "select public.export_game_answers('primeiro-passo', null, null, false, 100, 0)",
    );
    expect(semTexto.rows[0].export_game_answers.rows[0].answer_text).toBeNull();

    const resumo = await db.query<{ summarize_game_sessions: Record<string, unknown>[] }>(
      "select public.summarize_game_sessions()",
    );
    const jogos = resumo.rows[0].summarize_game_sessions.map((linha) => linha.game_key);
    expect(jogos).toContain("cidadania-financeira");
    expect(jogos).toContain("primeiro-passo");
    await db.exec("reset role");
  });

  it("aceita as rotas dos módulos na telemetria semântica já existente", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ALUNO}'`);
    const evento = [{
      event_id: "b23e4567-e89b-42d3-a456-426614174000",
      occurred_at: "2026-09-14T12:00:00.000Z",
      session_id: NAVEGACAO,
      event_name: "page_viewed",
      route: "/protected/modulos/educacao-financeira/financity",
      metadata: {},
    }];
    const inserido = await db.query<{ ingest_learning_events: number }>(
      "select public.ingest_learning_events($1::jsonb)",
      [JSON.stringify(evento)],
    );
    expect(inserido.rows[0].ingest_learning_events).toBe(1);
    await db.exec("reset role");
  });
});
