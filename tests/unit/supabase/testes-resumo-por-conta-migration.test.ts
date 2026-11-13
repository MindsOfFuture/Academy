// @vitest-environment node
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const sql = (nome: string) => readFileSync(`supabase/migrations/${nome}.sql`, "utf8");

const COORD = "10000000-0000-4000-8000-000000000001";
const BOLSISTA = "20000000-0000-4000-8000-000000000001";
const LEGADO = "30000000-0000-4000-8000-000000000001";
const CONTA = "40000000-0000-4000-8000-000000000001";
const SEM_LG2 = "50000000-0000-4000-8000-000000000001";

type Linha = { user_id: string; nome: string; cpf: string | null; acessos: number; ultimo_acesso_em: Date; modulos_abertos: number; modulos_concluidos: number; jornada_concluida: boolean };

describe("resumo dos testes por conta (20261113)", () => {
  const db = new PGlite();
  const como = async <T>(uid: string, consulta: string) => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${uid}'`);
    try { return (await db.query<T>(consulta)).rows; } finally { await db.exec("reset role; reset request.jwt.claim.sub"); }
  };

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin; create role authenticated nologin; create role service_role nologin;
      create schema auth; create table auth.users (id uuid primary key);
      insert into auth.users values ('${COORD}'), ('${BOLSISTA}'), ('${LEGADO}'), ('${CONTA}'), ('${SEM_LG2}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create function public.gestao_membro_papel() returns text language sql stable as $$
        select case auth.uid() when '${COORD}' then 'coordenacao' when '${BOLSISTA}' then 'bolsista' else null end
      $$;
      create table public.user_profile (id uuid primary key, full_name text);
      insert into public.user_profile values ('${LEGADO}', 'Nome do Perfil'), ('${CONTA}', 'Bruna Costa'), ('${SEM_LG2}', 'Sem LG2');
      create table public.telemetry_learning_event (
        user_id uuid, event_name text, metadata jsonb not null default '{}'::jsonb,
        occurred_at timestamptz not null default now()
      );
      grant usage on schema public to authenticated;
    `);
    await db.exec(sql("20261111_teste_nome_cpf"));
    await db.exec(sql("20261113_testes_resumo_por_conta"));
    await db.exec(`
      insert into public.teste_participante (user_id, nome, cpf, acessos, ultimo_acesso_em)
        values ('${LEGADO}', 'Ana', '52998224725', 5, '2026-11-11T12:00:00Z');
      insert into public.telemetry_learning_event (user_id, event_name, metadata, occurred_at) values
        ('${LEGADO}', 'lg2_module_opened', '{"modulo": 1}', '2026-11-10T12:00:00Z'),
        ('${CONTA}', 'lg2_module_opened', '{"modulo": 1}', '2026-11-12T12:00:00Z'),
        ('${CONTA}', 'lg2_module_opened', '{"modulo": 1}', '2026-11-12T13:00:00Z'),
        ('${CONTA}', 'lg2_module_opened', '{"modulo": 2}', '2026-11-13T12:00:00Z'),
        ('${CONTA}', 'lg2_module_completed', '{"modulo": 1}', '2026-11-13T12:30:00Z'),
        ('${CONTA}', 'lg2_journey_completed', '{}', '2026-11-13T14:00:00Z'),
        ('${SEM_LG2}', 'lesson_opened', '{}', '2026-11-13T15:00:00Z'),
        (null, 'lg2_module_opened', '{"modulo": 3}', '2026-11-13T16:00:00Z');
    `);
  }, 120_000); // PGlite sobe o Postgres em WASM: lento em máquina carregada.
  afterAll(() => db.close());

  it("lista contas com eventos do LG2 e as linhas antigas, sem exigir CPF", async () => {
    const linhas = await como<Linha>(COORD, "select * from public.gestao_testes_resumo()");
    expect(linhas.map((l) => l.user_id)).toEqual([CONTA, LEGADO]);
    const [conta, legado] = linhas;
    expect(conta).toMatchObject({ nome: "Bruna Costa", cpf: null, acessos: 2, modulos_abertos: 2, modulos_concluidos: 1, jornada_concluida: true });
    expect(new Date(conta.ultimo_acesso_em).toISOString()).toBe("2026-11-13T14:00:00.000Z");
    // Nome e acessos do cadastro antigo prevalecem quando maiores.
    expect(legado).toMatchObject({ nome: "Ana", cpf: "52998224725", acessos: 5, modulos_abertos: 1, modulos_concluidos: 0, jornada_concluida: false });
    expect(new Date(legado.ultimo_acesso_em).toISOString()).toBe("2026-11-11T12:00:00.000Z");
  });

  it("continua só para a coordenação", async () => {
    expect(await como(BOLSISTA, "select * from public.gestao_testes_resumo()")).toEqual([]);
    expect(await como(CONTA, "select * from public.gestao_testes_resumo()")).toEqual([]);
  });

  it("mantém security definer e search_path vazio", async () => {
    const { rows } = await db.query<{ prosecdef: boolean; proconfig: string[] }>(
      "select prosecdef, proconfig from pg_proc where proname = 'gestao_testes_resumo'",
    );
    expect(rows).toEqual([{ prosecdef: true, proconfig: ['search_path=""'] }]);
  });
});
