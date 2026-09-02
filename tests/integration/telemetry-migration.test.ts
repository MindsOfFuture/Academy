// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import {
  aggregateLearningEvents,
  collectLearningEventSnapshot,
  type LearningEventRow,
  type LearningEventSnapshotPage,
} from "@/lib/api/learning-analytics";

const USER_ID = "123e4567-e89b-42d3-a456-426614174000";
const OTHER_USER_ID = "223e4567-e89b-42d3-a456-426614174000";
const SESSION_ID = "323e4567-e89b-42d3-a456-426614174000";
const EVENT_ID = "423e4567-e89b-42d3-a456-426614174000";

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
  const migration = readFileSync("supabase/migrations/20260902_learning_event_telemetry.sql", "utf8");

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key);
      insert into auth.users (id) values ('${USER_ID}'), ('${OTHER_USER_ID}');
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth to anon, authenticated;
    `);
    await db.exec(migration);
    await db.exec(migration);
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

describe("snapshot paginado da telemetria em PostgreSQL real", () => {
  const db = new PGlite();
  const COURSE_A = "923e4567-e89b-42d3-a456-426614174000";
  const COURSE_B = "a23e4567-e89b-42d3-a456-426614174000";

  beforeAll(async () => {
    await db.exec(`
      create table telemetry_snapshot_fixture (
        event_id uuid primary key,
        occurred_at timestamptz not null,
        received_at timestamptz not null,
        user_id uuid not null,
        session_id uuid not null,
        event_name text not null,
        route text not null,
        learning_path_id uuid,
        course_id uuid,
        lesson_id uuid,
        activity_id uuid,
        metadata jsonb not null default '{}'::jsonb
      );

      insert into telemetry_snapshot_fixture (
        event_id, occurred_at, received_at, user_id, session_id,
        event_name, route, course_id
      )
      select
        ('00000000-0000-4000-8000-' || lpad(value::text, 12, '0'))::uuid,
        '2026-09-02T12:00:00.000Z'::timestamptz,
        '2026-09-02T12:00:01.000Z'::timestamptz,
        '${USER_ID}'::uuid,
        '${SESSION_ID}'::uuid,
        case when value <= 600 then 'course_opened' else 'lesson_opened' end,
        '/course',
        '${COURSE_A}'::uuid
      from generate_series(1, 1001) as value;
    `);
  }, 30_000);

  afterAll(async () => {
    await db.close();
  });

  it("mantém um snapshot único com empates e inserções entre páginas", async () => {
    let insertedConcurrentRows = false;

    const fetchPage = async ({ limit, upperBound, after }: LearningEventSnapshotPage) => {
      const conditions: string[] = [];
      const params: unknown[] = [];
      const cursor = after ?? upperBound;
      if (cursor) {
        params.push(cursor.receivedAt, cursor.eventId);
        conditions.push(`(received_at, event_id) ${after ? "<" : "<="} ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
      }
      params.push(limit);

      const result = await db.query<LearningEventRow>(`
        select
          event_id::text,
          occurred_at::text,
          received_at::text,
          user_id::text,
          session_id::text,
          event_name,
          route,
          learning_path_id::text,
          course_id::text,
          lesson_id::text,
          activity_id::text,
          metadata
        from telemetry_snapshot_fixture
        ${conditions.length > 0 ? `where ${conditions.join(" and ")}` : ""}
        order by received_at desc, event_id desc
        limit $${params.length}
      `, params);

      if (upperBound && !after && !insertedConcurrentRows) {
        insertedConcurrentRows = true;
        await db.exec(`
          insert into telemetry_snapshot_fixture (
            event_id, occurred_at, received_at, user_id, session_id,
            event_name, route, course_id
          )
          select
            ('10000000-0000-4000-8000-' || lpad(value::text, 12, '0'))::uuid,
            '2026-09-02T13:00:00.000Z'::timestamptz,
            '2026-09-02T13:00:01.000Z'::timestamptz,
            '${OTHER_USER_ID}'::uuid,
            '${SESSION_ID}'::uuid,
            'course_opened',
            '/course',
            '${COURSE_B}'::uuid
          from generate_series(1, 20) as value;
        `);
      }

      return result.rows;
    };

    const rows = await collectLearningEventSnapshot(fetchPage);
    const analytics = aggregateLearningEvents(rows);
    const uniqueEventIds = new Set(rows.map((row) => row.event_id));
    const rowsByCourse = rows.reduce<Record<string, number>>((counts, row) => {
      if (row.course_id) counts[row.course_id] = (counts[row.course_id] ?? 0) + 1;
      return counts;
    }, {});
    const databaseCounts = await db.query<{ course_id: string; total: number }>(`
      select course_id::text, count(*)::int as total
      from telemetry_snapshot_fixture
      group by course_id
      order by course_id
    `);

    expect(rows).toHaveLength(1001);
    expect(uniqueEventIds.size).toBe(1001);
    expect(rowsByCourse).toEqual({ [COURSE_A]: 1001 });
    expect(analytics.eventCounts).toMatchObject({ course_opened: 600, lesson_opened: 401 });
    expect(analytics.topCourses).toEqual([{ id: COURSE_A, accesses: 600 }]);
    expect(databaseCounts.rows).toEqual([
      { course_id: COURSE_A, total: 1001 },
      { course_id: COURSE_B, total: 20 },
    ]);
  });
});
