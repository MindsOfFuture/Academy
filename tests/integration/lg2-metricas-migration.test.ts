// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const BASE = readFileSync("supabase/migrations/20260902_learning_event_telemetry.sql", "utf8");
const ROTAS = readFileSync("supabase/migrations/20260914_game_answer_telemetry.sql", "utf8");
const MIGRATION = readFileSync("supabase/migrations/20261106_lg2_metricas.sql", "utf8");

const ADMIN = "123e4567-e89b-42d3-a456-426614174000";
const ALUNA = "223e4567-e89b-42d3-a456-426614174000";
const ALUNO = "323e4567-e89b-42d3-a456-426614174000";
const ANTIGO = "423e4567-e89b-42d3-a456-426614174000";
const SESSAO = "523e4567-e89b-42d3-a456-426614174000";
interface Metricas {
  novosCadastros: number;
  acessosPorProduto: { rota: string; usuarios: number; acessos: number }[];
  lg2: { usuarios: number; jornadaConcluida: number; porModulo: { modulo: number; abriram: number; concluiram: number }[] };
}
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

let seq = 0;
function evento(eventName: string, route: string, metadata: unknown = {}, extra: Record<string, unknown> = {}) {
  seq += 1;
  return {
    event_id: id(seq),
    occurred_at: "2026-11-06T12:00:00.000Z",
    session_id: SESSAO,
    event_name: eventName,
    route,
    metadata,
    ...extra,
  };
}

describe("métricas do LG2 em PostgreSQL real", () => {
  const db = new PGlite();

  async function como(uid: string) {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  }
  async function enviar(eventos: unknown[]) {
    const r = await db.query<{ n: number }>("select public.ingest_learning_events($1::jsonb) as n", [JSON.stringify(eventos)]);
    return r.rows[0].n;
  }

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key, created_at timestamptz not null default now());
      insert into auth.users (id, created_at) values
        ('${ADMIN}', '2026-01-10T00:00:00Z'),
        ('${ALUNA}', '2026-11-02T00:00:00Z'),
        ('${ALUNO}', '2026-11-05T00:00:00Z'),
        ('${ANTIGO}', '2026-09-20T00:00:00Z');
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;
      create table public.role (id integer primary key, name text not null);
      create table public.user_role (user_profile_id uuid not null, role_id integer not null);
      insert into public.role values (1, 'admin'), (2, 'student');
      insert into public.user_role values ('${ADMIN}', 1), ('${ALUNA}', 2), ('${ALUNO}', 2);
    `);
    await db.exec(BASE);
    await db.exec(ROTAS);
    await db.exec(MIGRATION);
    await db.exec(MIGRATION);
  }, 30_000);

  afterAll(async () => {
    await db.close();
  });

  it("aceita os eventos novos válidos e os antigos continuam aceitos", async () => {
    await como(ALUNA);
    expect(await enviar([
      evento("lg2_module_opened", "/lg2", { modulo: 1 }),
      evento("lg2_module_completed", "/lg2", { modulo: 1 }),
      evento("lg2_module_opened", "/lg2", { modulo: 10 }),
      evento("lg2_journey_completed", "/lg2/jornada"),
      evento("page_viewed", "/protected/modulos/laboratorio-de-gestao"),
      evento("page_viewed", "/protected/modulos/laboratorio-de-gestao"),
      evento("resource_opened", "/course", { resourceType: "video" }, { course_id: id(900), lesson_id: id(901) }),
      evento("certificate_generated", "/course", { source: "emissao" }, { course_id: id(900) }),
    ])).toBe(8);
    await db.exec("reset role");
  });

  it.each([
    ["módulo 0", "lg2_module_opened", "/lg2", { modulo: 0 }],
    ["módulo 11", "lg2_module_completed", "/lg2", { modulo: 11 }],
    ["módulo em texto", "lg2_module_opened", "/lg2", { modulo: "3" }],
    ["módulo fracionado", "lg2_module_opened", "/lg2", { modulo: 2.5 }],
    ["campo extra", "lg2_module_opened", "/lg2", { modulo: 3, resposta: "x" }],
    ["sem módulo", "lg2_module_completed", "/lg2", {}],
    ["jornada com metadata", "lg2_journey_completed", "/lg2/jornada", { modulo: 1 }],
    ["rota de módulo livre", "lg2_module_opened", "/lg2/turma-a/m01", { modulo: 1 }],
    ["evento fora do catálogo", "lg2_answer_saved", "/lg2", {}],
  ])("rejeita %s", async (_nome, nome, rota, metadata) => {
    await como(ALUNA);
    await expect(enviar([evento(nome, rota, metadata)])).rejects.toThrow(/check constraint|violates/);
    await db.exec("reset role");
  });

  it("deixa um só CHECK de metadata, com o nome original", async () => {
    const r = await db.query<{ conname: string }>(`
      select conname from pg_constraint
      where conrelid = 'public.telemetry_learning_event'::regclass and contype = 'c'
        and pg_get_constraintdef(oid) like '%resourceType%'`);
    expect(r.rows.map((x) => x.conname)).toEqual(["telemetry_learning_event_check"]);
  });

  it("nega quem não é administrador", async () => {
    await db.exec("select set_config('request.jwt.claim.sub', '', false)");
    await expect(db.query("select public.get_site_metrics(null, null)")).rejects.toThrow("Usuário não autenticado.");
    await como(ALUNA);
    await expect(db.query("select public.get_site_metrics(null, null)"))
      .rejects.toThrow("Acesso negado. Permissões de administrador necessárias.");
    await db.exec("reset role");
    await db.exec("set role anon");
    await expect(db.query("select public.get_site_metrics(null, null)")).rejects.toThrow(/permission denied/);
    await db.exec("reset role");
  });

  it("devolve as contagens certas para o administrador", async () => {
    await como(ALUNO);
    await enviar([
      evento("lg2_module_opened", "/lg2", { modulo: 1 }),
      evento("lg2_module_opened", "/lg2", { modulo: 1 }),
      evento("lg2_module_opened", "/lg2", { modulo: 2 }),
      evento("lg2_module_completed", "/lg2", { modulo: 2 }),
      evento("page_viewed", "/protected/modulos/educacao-financeira"),
    ]);
    await db.exec("reset role");
    // Evento fora do período: não pode contar.
    await db.exec(`
      insert into public.telemetry_learning_event
        (event_id, occurred_at, received_at, user_id, session_id, event_name, route, metadata)
      values ('${id(999)}', '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z', '${ANTIGO}', '${SESSAO}',
              'lg2_module_completed', '/lg2', '{"modulo":5}');
    `);

    await como(ADMIN);
    const r = await db.query<{ m: Metricas }>(
      "select public.get_site_metrics('2026-11-01T00:00:00Z', now() + interval '1 day') as m",
    );
    await db.exec("reset role");
    const m = r.rows[0].m;
    expect(m.novosCadastros).toBe(2);
    expect(m.acessosPorProduto).toEqual([
      { rota: "/protected/modulos/educacao-financeira", usuarios: 1, acessos: 1 },
      { rota: "/protected/modulos/educacao-financeira/financity", usuarios: 0, acessos: 0 },
      { rota: "/protected/modulos/educacao-financeira/cidadania-financeira", usuarios: 0, acessos: 0 },
      { rota: "/protected/modulos/laboratorio-de-gestao", usuarios: 1, acessos: 2 },
      { rota: "/lg2", usuarios: 2, acessos: 5 },
    ]);
    expect(m.lg2.usuarios).toBe(2);
    expect(m.lg2.jornadaConcluida).toBe(1);
    expect(m.lg2.porModulo).toHaveLength(10);
    expect(m.lg2.porModulo[0]).toEqual({ modulo: 1, abriram: 2, concluiram: 1 });
    expect(m.lg2.porModulo[1]).toEqual({ modulo: 2, abriram: 1, concluiram: 1 });
    expect(m.lg2.porModulo[4]).toEqual({ modulo: 5, abriram: 0, concluiram: 0 });
    expect(m.lg2.porModulo[9]).toEqual({ modulo: 10, abriram: 1, concluiram: 0 });
    expect(JSON.stringify(m)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);

    await como(ADMIN);
    const tudo = await db.query<{ m: Metricas }>("select public.get_site_metrics(null, null) as m");
    await db.exec("reset role");
    expect(tudo.rows[0].m.novosCadastros).toBe(4);
    expect(tudo.rows[0].m.lg2.porModulo[4]).toEqual({ modulo: 5, abriram: 0, concluiram: 1 });
  });
});
