// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { sqlDaMigracao } from "./helpers/gestao";

const COORD = "10000000-0000-4000-8000-000000000001";
const BOLSISTA = "20000000-0000-4000-8000-000000000001";
const PARTICIPANTE = "30000000-0000-4000-8000-000000000001";

describe("resumo do teste por nome e CPF", () => {
  const db = new PGlite();
  const como = async <T>(uid: string, sql: string) => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${uid}'`);
    try { return (await db.query<T>(sql)).rows; } finally { await db.exec("reset role; reset request.jwt.claim.sub"); }
  };

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin; create role authenticated nologin; create role service_role nologin;
      create schema auth; create table auth.users (id uuid primary key);
      insert into auth.users values ('${COORD}'), ('${BOLSISTA}'), ('${PARTICIPANTE}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create function public.gestao_membro_papel() returns text language sql stable as $$
        select case auth.uid() when '${COORD}' then 'coordenacao' when '${BOLSISTA}' then 'bolsista' else null end
      $$;
      create table public.telemetry_learning_event (
        user_id uuid, event_name text, metadata jsonb not null default '{}'::jsonb,
        occurred_at timestamptz not null default now()
      );
      grant usage on schema public to authenticated;
    `);
    await db.exec(sqlDaMigracao("20261111_teste_nome_cpf"));
    await db.exec(`
      insert into public.teste_participante (user_id, nome, cpf, acessos) values ('${PARTICIPANTE}', 'Ana', '52998224725', 2);
      insert into public.telemetry_learning_event (user_id, event_name, metadata) values
        ('${PARTICIPANTE}', 'lg2_module_opened', '{"modulo": 1}'),
        ('${PARTICIPANTE}', 'lg2_module_opened', '{"modulo": 1}'),
        ('${PARTICIPANTE}', 'lg2_module_opened', '{"modulo": 2}'),
        ('${PARTICIPANTE}', 'lg2_module_completed', '{"modulo": 1}'),
        ('${PARTICIPANTE}', 'lg2_journey_completed', '{}');
    `);
  });
  afterAll(() => db.close());

  it("devolve o progresso da jornada somente para coordenação", async () => {
    const coord = await como<{ nome: string; modulos_abertos: number; modulos_concluidos: number; jornada_concluida: boolean }>(COORD, "select nome, modulos_abertos, modulos_concluidos, jornada_concluida from public.gestao_testes_resumo()");
    expect(coord).toEqual([{ nome: "Ana", modulos_abertos: 2, modulos_concluidos: 1, jornada_concluida: true }]);
    expect(await como(BOLSISTA, "select * from public.gestao_testes_resumo()" )).toEqual([]);
    await expect(como(COORD, "select * from public.teste_participante")).rejects.toThrow(/permission denied/);
  });
});
