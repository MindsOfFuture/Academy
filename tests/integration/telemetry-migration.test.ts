// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

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
