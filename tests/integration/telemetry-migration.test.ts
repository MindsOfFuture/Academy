// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import {
  aggregateLearningEvents,
  type LearningEventSnapshotEnvelope,
} from "@/lib/api/learning-analytics";

const USER_ID = "123e4567-e89b-42d3-a456-426614174000";
const OTHER_USER_ID = "223e4567-e89b-42d3-a456-426614174000";
const SESSION_ID = "323e4567-e89b-42d3-a456-426614174000";
const EVENT_ID = "423e4567-e89b-42d3-a456-426614174000";
const MIGRATION = readFileSync("supabase/migrations/20260902_learning_event_telemetry.sql", "utf8");

function event(route = "/trilhas") {
  return [{
    event_id: EVENT_ID,
    occurred_at: "2026-09-02T12:00:00.000Z",
    session_id: SESSION_ID,
    event_name: "page_viewed",
    route,
    user_id: OTHER_USER_ID,
    metadata: {},
  }];
}

describe("migration de telemetria em PostgreSQL real", () => {
  const db = new PGlite();

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key);
      insert into auth.users (id) values ('${USER_ID}'), ('${OTHER_USER_ID}');
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;
      create table public.role (id integer primary key, name text not null);
      create table public.user_role (user_profile_id uuid not null, role_id integer not null);
    `);
    await db.exec(MIGRATION);
    await db.exec(MIGRATION);
    await db.exec("grant select, insert, update, delete on public.telemetry_learning_event to service_role");
  }, 30_000);

  afterAll(async () => {
    await db.close();
  });

  it("deriva identidade, deduplica retry e bloqueia rota com segmento livre", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${USER_ID}'`);
    const authenticatedUser = await db.query<{ user_id: string }>("select auth.uid()::text as user_id");
    expect(authenticatedUser.rows[0].user_id).toBe(USER_ID);
    const first = await db.query<{ inserted: number }>(
      "select public.ingest_learning_events($1::jsonb) as inserted",
      [JSON.stringify(event())],
    );
    const duplicate = await db.query<{ inserted: number }>(
      "select public.ingest_learning_events($1::jsonb) as inserted",
      [JSON.stringify(event())],
    );
    expect(first.rows[0].inserted).toBe(1);
    expect(duplicate.rows[0].inserted).toBe(0);

    for (const [route, eventId] of [
      ["/aluno/alice@example.com", "523e4567-e89b-42d3-a456-426614174000"],
      ["/aluno/12345678901", "623e4567-e89b-42d3-a456-426614174000"],
      ["/aluno/Maria-Silva", "723e4567-e89b-42d3-a456-426614174000"],
    ]) {
      await expect(db.query(
        "select public.ingest_learning_events($1::jsonb)",
        [JSON.stringify(event(route).map((item) => ({ ...item, event_id: eventId })))],
      )).rejects.toThrow();
    }

    await expect(db.exec(`
      insert into public.telemetry_learning_event (
        event_id, occurred_at, user_id, session_id, event_name, route
      ) values (
        '823e4567-e89b-42d3-a456-426614174000', now(), '${OTHER_USER_ID}',
        '${SESSION_ID}', 'page_viewed', '/course'
      )
    `)).rejects.toThrow(/row-level security/i);

    await db.exec("reset role");
    await db.exec("set role service_role");
    const stored = await db.query<{ user_id: string; total: number }>(
      "select min(user_id::text) as user_id, count(*)::int as total from public.telemetry_learning_event",
    );
    expect(stored.rows[0]).toEqual({ user_id: USER_ID, total: 1 });
    await db.exec("reset role");
  });

  it("mantém aluno sem leitura, alteração ou remoção e nega execução anônima", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${USER_ID}'`);
    await expect(db.query("select * from public.telemetry_learning_event")).rejects.toThrow(/permission denied/i);
    await expect(db.exec("update public.telemetry_learning_event set route = '/course'")).rejects.toThrow(/permission denied/i);
    await expect(db.exec("delete from public.telemetry_learning_event")).rejects.toThrow(/permission denied/i);
    await db.exec("reset role");

    await db.exec("set role anon");
    await expect(db.query(
      "select public.ingest_learning_events($1::jsonb)",
      [JSON.stringify(event())],
    )).rejects.toThrow(/permission denied/i);
    await db.exec("reset role");
  });
});

describe("snapshot transacional da telemetria em PostgreSQL real", () => {
  const db = new PGlite();
  const ADMIN_ID = "523e4567-e89b-42d3-a456-426614174000";
  const STUDENT_ID = "623e4567-e89b-42d3-a456-426614174000";
  const TEACHER_ID = "723e4567-e89b-42d3-a456-426614174000";
  const NO_ROLE_ID = "823e4567-e89b-42d3-a456-426614174000";
  const COURSE_A = "923e4567-e89b-42d3-a456-426614174000";
  const COURSE_B = "a23e4567-e89b-42d3-a456-426614174000";
  const LESSON_A = "b23e4567-e89b-42d3-a456-426614174000";
  const RECEIVED_AT = "2026-09-02T12:00:01.000Z";

  // A fixture ocupa event_id par; o lote concorrente usa event_id ímpar, então
  // nada colide e o ponto de inserção fica sob controle do teste.
  const eventId = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
  const ANCHOR = eventId(3002);
  const PAGE_ONE_CURSOR = eventId(1004);
  // 10 event_id caem na faixa que a primeira página já percorreu (> 1004) e 10
  // caem na faixa ainda não percorrida (< 1004): a travessia paginada enxerga
  // metade do lote; o snapshot transacional não pode enxergar nenhuma linha.
  const ALREADY_TRAVERSED = [1501, 1503, 1505, 1507, 1509, 1511, 1513, 1515, 1517, 1519];
  const NOT_YET_TRAVERSED = [985, 987, 989, 991, 993, 995, 997, 999, 1001, 1003];
  const CONCURRENT_IDS = [...ALREADY_TRAVERSED, ...NOT_YET_TRAVERSED].map(eventId);

  async function insertConcurrentBatch() {
    await db.query(`
      insert into public.telemetry_learning_event (
        event_id, occurred_at, received_at, user_id, session_id,
        event_name, route, course_id
      )
      select
        value::uuid,
        '2026-09-02T12:00:00.000Z'::timestamptz,
        '${RECEIVED_AT}'::timestamptz,
        '${STUDENT_ID}'::uuid,
        '${SESSION_ID}'::uuid,
        'course_opened',
        '/course',
        '${COURSE_B}'::uuid
      from unnest($1::text[]) as value
    `, [CONCURRENT_IDS]);
  }

  async function snapshot(params: {
    scope: string;
    id?: string | null;
    from?: string | null;
    to?: string | null;
    limit?: number;
  }): Promise<LearningEventSnapshotEnvelope> {
    const result = await db.query<{ snapshot: LearningEventSnapshotEnvelope }>(
      `select public.collect_learning_analytics_snapshot(
         $1::text, $2::uuid, $3::timestamptz, $4::timestamptz, $5::integer
       ) as snapshot`,
      [params.scope, params.id ?? null, params.from ?? null, params.to ?? null, params.limit ?? 100000],
    );
    return result.rows[0].snapshot;
  }

  beforeAll(async () => {
    await db.exec(`
      set time zone 'UTC';
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      insert into auth.users (id) values
        ('${ADMIN_ID}'), ('${STUDENT_ID}'), ('${TEACHER_ID}'), ('${NO_ROLE_ID}');
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;

      create table public.role (id integer primary key, name text not null);
      create table public.user_role (user_profile_id uuid not null, role_id integer not null);
      insert into public.role (id, name) values (1, 'student'), (2, 'teacher'), (3, 'admin');
      insert into public.user_role (user_profile_id, role_id) values
        ('${STUDENT_ID}', 1), ('${TEACHER_ID}', 2), ('${ADMIN_ID}', 3);
    `);
    await db.exec(MIGRATION);
    await db.exec(MIGRATION);
    await db.exec(`
      insert into public.telemetry_learning_event (
        event_id, occurred_at, received_at, user_id, session_id,
        event_name, route, course_id, lesson_id
      )
      select
        ('00000000-0000-4000-8000-' || lpad((1000 + value * 2)::text, 12, '0'))::uuid,
        '2026-09-02T12:00:00.000Z'::timestamptz,
        '${RECEIVED_AT}'::timestamptz,
        (case value when 1 then '${NO_ROLE_ID}' when 2 then '${TEACHER_ID}'
                    when 3 then '${ADMIN_ID}' else '${STUDENT_ID}' end)::uuid,
        '${SESSION_ID}'::uuid,
        case when value <= 600 then 'course_opened' else 'lesson_opened' end,
        '/course',
        '${COURSE_A}'::uuid,
        '${LESSON_A}'::uuid
      from generate_series(1, 1001) as value;
    `);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("prova que o ponto de inserção corrompe a travessia paginada", async () => {
    const page = async (operator: "<=" | "<", cursor: string) => {
      const result = await db.query<{ event_id: string }>(`
        select event_id::text
        from public.telemetry_learning_event
        where (received_at, event_id) ${operator} ('${RECEIVED_AT}'::timestamptz, $1::uuid)
        order by received_at desc, event_id desc
        limit 1000
      `, [cursor]);
      return result.rows.map((item) => item.event_id);
    };

    const pageOne = await page("<=", ANCHOR);
    expect(pageOne).toHaveLength(1000);
    expect(pageOne[pageOne.length - 1]).toBe(PAGE_ONE_CURSOR);

    await insertConcurrentBatch();
    const pageTwo = await page("<", PAGE_ONE_CURSOR);
    const traversed = [...pageOne, ...pageTwo];
    const leaked = CONCURRENT_IDS.filter((id) => traversed.includes(id));

    // Entrada parcial: metade do lote atravessa a fronteira das páginas e a
    // outra metade caiu numa faixa que a primeira página já tinha percorrido.
    expect(traversed).toHaveLength(1011);
    expect(leaked).toHaveLength(10);
    expect([...leaked].sort()).toEqual(NOT_YET_TRAVERSED.map(eventId).sort());

    await db.query("delete from public.telemetry_learning_event where event_id = any($1::uuid[])", [CONCURRENT_IDS]);
    const remaining = await db.query<{ total: number }>(
      "select count(*)::int as total from public.telemetry_learning_event",
    );
    expect(remaining.rows[0].total).toBe(1001);
  });

  it("lê o conjunto inteiro sob um único snapshot e deixa o lote pós-início inteiro de fora", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ADMIN_ID}'`);
    const before = await snapshot({ scope: "global" });
    await db.exec("reset role");

    await insertConcurrentBatch();

    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ADMIN_ID}'`);
    const after = await snapshot({ scope: "global" });
    await db.exec("reset role");

    const beforeIds = new Set(before.events.map((row) => row.event_id));
    const afterIds = new Set(after.events.map((row) => row.event_id));

    expect(before.overflow).toBe(false);
    expect(before.events).toHaveLength(1001);
    expect(beforeIds.size).toBe(1001);
    expect(CONCURRENT_IDS.filter((id) => beforeIds.has(id))).toHaveLength(0);

    // Tudo ou nada: nunca os 10 parciais que a travessia paginada deixaria entrar.
    expect(after.events).toHaveLength(1021);
    expect(afterIds.size).toBe(1021);
    expect(CONCURRENT_IDS.filter((id) => afterIds.has(id))).toHaveLength(20);

    const analytics = aggregateLearningEvents(before.events, new Set(before.student_user_ids));
    expect(analytics.totalInteractions).toBe(1001);
    expect(analytics.eventCounts).toMatchObject({ course_opened: 600, lesson_opened: 401 });
    expect(analytics.topCourses).toEqual([{ id: COURSE_A, accesses: 600 }]);
    expect(analytics.dailyInteractions).toEqual([{ day: "2026-09-02", interactions: 1001 }]);
    // Precedência de papéis: professor e admin fora, aluno e usuário sem papel dentro.
    expect([...before.student_user_ids].sort()).toEqual([NO_ROLE_ID, STUDENT_ID].sort());
    expect(analytics.activeStudents).toBe(2);
  });

  it("aplica escopo e período dentro do banco", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ADMIN_ID}'`);

    const byCourse = await snapshot({ scope: "course", id: COURSE_B });
    expect(byCourse.events).toHaveLength(20);
    expect(byCourse.events.every((row) => row.course_id === COURSE_B)).toBe(true);

    const byStudent = await snapshot({ scope: "student", id: TEACHER_ID });
    expect(byStudent.events).toHaveLength(1);
    expect(byStudent.student_user_ids).toEqual([]);

    const byPath = await snapshot({ scope: "path", id: COURSE_A });
    expect(byPath.events).toEqual([]);

    const outOfPeriod = await snapshot({
      scope: "global",
      from: "2026-09-03T00:00:00.000Z",
      to: "2026-09-04T00:00:00.000Z",
    });
    expect(outOfPeriod.overflow).toBe(false);
    expect(outOfPeriod.events).toEqual([]);
    expect(outOfPeriod.student_user_ids).toEqual([]);

    const inPeriod = await snapshot({
      scope: "global",
      from: "2026-09-02T00:00:00.000Z",
      to: "2026-09-03T00:00:00.000Z",
    });
    expect(inPeriod.events).toHaveLength(1021);

    await db.exec("reset role");
  });

  it("sinaliza estouro sem devolver linhas quando o teto é ultrapassado", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ADMIN_ID}'`);
    const overflowed = await snapshot({ scope: "global", limit: 1000 });
    expect(overflowed.overflow).toBe(true);
    expect(overflowed.events).toEqual([]);
    expect(overflowed.student_user_ids).toEqual([]);
    await db.exec("reset role");
  });

  it("nega anônimo, não autenticado e não administrador, e valida escopo, id e teto", async () => {
    await db.exec("set role anon");
    await expect(snapshot({ scope: "global" })).rejects.toThrow(/permission denied/i);
    await db.exec("reset role");

    await db.exec("set role authenticated; set request.jwt.claim.sub = ''");
    await expect(snapshot({ scope: "global" })).rejects.toThrow(/não autenticado/i);
    await db.exec("reset role");

    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${STUDENT_ID}'`);
    await expect(snapshot({ scope: "global" })).rejects.toThrow(/Acesso negado/i);
    await db.exec("reset role");

    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${TEACHER_ID}'`);
    await expect(snapshot({ scope: "global" })).rejects.toThrow(/Acesso negado/i);
    await db.exec("reset role");

    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${ADMIN_ID}'`);
    await expect(snapshot({ scope: "tudo" })).rejects.toThrow(/Escopo de Analytics inválido/i);
    await expect(snapshot({ scope: "course" })).rejects.toThrow(/Identificador de Analytics inválido/i);
    await expect(snapshot({ scope: "global", id: COURSE_A })).rejects.toThrow(/Identificador de Analytics inválido/i);
    await expect(snapshot({ scope: "global", limit: 0 })).rejects.toThrow(/Limite de Analytics inválido/i);
    await expect(snapshot({ scope: "global", limit: 100001 })).rejects.toThrow(/Limite de Analytics inválido/i);
    // A leitura segue exclusiva da RPC: a tabela continua sem SELECT para authenticated.
    await expect(db.query("select * from public.telemetry_learning_event")).rejects.toThrow(/permission denied/i);
    await db.exec("reset role");
  });
});
