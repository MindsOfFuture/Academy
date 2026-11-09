// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { gestaoAntes, comoUsuario, sqlDaMigracao } from "./helpers/gestao";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Dados do E2E separados da equipe real (20261019). Prova em PostgreSQL real
 * que a coordenação real não vê membro nem escola de teste, que a conta de
 * teste não vê os reais, e que escola criada por conta de teste já nasce
 * marcada — o E2E continua achando tudo o que usa.
 */

const ATE_AQUI = gestaoAntes("20261019_gestao_dados_de_teste");
const DADOS_DE_TESTE = readFileSync("supabase/migrations/20261019_gestao_dados_de_teste.sql", "utf8");

const COORD = "30000000-0000-4000-8000-000000000001";
const BIA = "30000000-0000-4000-8000-000000000002";
const COORD_E2E = "30000000-0000-4000-8000-000000000003";
const BOLSISTA_E2E = "30000000-0000-4000-8000-000000000004";

describe("dados do E2E separados da equipe real (20261019)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });

  const como = comoUsuario(db);

  async function nomes(uid: string, sql: string): Promise<string[]> {
    const { rows } = await como(uid, () => db.query<{ nome: string }>(sql));
    return rows.map((l) => l.nome).sort();
  }

  beforeAll(async () => {
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

      create table public.user_profile (id uuid primary key, full_name text not null, email text not null);
      alter table public.user_profile enable row level security;
      create policy "Users view own profile" on public.user_profile
        for select to authenticated using (auth.uid() = id);
      grant usage on schema public to anon, authenticated;
      grant select on public.user_profile to authenticated;

      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text check (channel in ('email', 'in-app')),
        type text,
        payload jsonb,
        read_at timestamptz,
        created_at timestamptz default now()
      );
      alter table public.notification enable row level security;
      create policy "Own notifications only" on public.notification using (user_id = auth.uid());
      grant select, insert, update on public.notification to authenticated;

      insert into auth.users (id) values ('${COORD}'), ('${BIA}'), ('${COORD_E2E}'), ('${BOLSISTA_E2E}');
      insert into public.user_profile (id, full_name, email) values
        ('${COORD}', 'Cris Coordenação', 'cris@ufjf.br'),
        ('${BIA}', 'Bia Bolsista', 'bia@estudante.ufjf.br'),
        ('${COORD_E2E}', 'Coordenação E2E', 'coord-e2e@ufjf.br'),
        ('${BOLSISTA_E2E}', 'Bolsista E2E A', 'bolsista-e2e@ufjf.br');
    `);

    for (const sql of ATE_AQUI) await db.exec(sql);

    // Equipe e escolas cadastradas antes da mudança.
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false),
        ('${BIA}', false, true),
        ('${COORD_E2E}', true, false),
        ('${BOLSISTA_E2E}', false, true);
      insert into gestao.escola (nome, categoria, cidade) values
        ('Escola Real', 'estadual', 'Juiz de Fora'),
        ('Escola E2E 1', 'estadual', 'Juiz de Fora');
    `);

    await db.exec(DADOS_DE_TESTE);
    // Idempotência: roda de novo sem erro.
    await db.exec(DADOS_DE_TESTE);

    // Passo de dado, feito à parte em produção.
    await db.exec(`
      update gestao.papel_membro set teste = true where user_profile_id in ('${COORD_E2E}', '${BOLSISTA_E2E}');
      update gestao.escola set teste = true where nome = 'Escola E2E 1';
    `);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("a coordenação real vê só a equipe e as escolas reais", async () => {
    expect(await nomes(COORD, `select nome from gestao.equipe()`)).toEqual(["Bia Bolsista", "Cris Coordenação"]);
    expect(await nomes(COORD, `select nome from gestao.escola`)).toEqual(["Escola Real"]);
  });

  it("a conta de teste vê só a equipe e as escolas de teste", async () => {
    expect(await nomes(COORD_E2E, `select nome from gestao.equipe()`)).toEqual(["Bolsista E2E A", "Coordenação E2E"]);
    expect(await nomes(COORD_E2E, `select nome from gestao.escola`)).toEqual(["Escola E2E 1"]);
  });

  it("escola criada por conta de teste já nasce de teste; pela real, nasce real", async () => {
    await como(COORD_E2E, () => db.exec(`insert into gestao.escola (nome, categoria, cidade) values ('Escola E2E 2', 'estadual', 'JF')`));
    await como(COORD, () => db.exec(`insert into gestao.escola (nome, categoria, cidade) values ('Outra Real', 'estadual', 'JF')`));
    expect(await nomes(COORD_E2E, `select nome from gestao.escola`)).toEqual(["Escola E2E 1", "Escola E2E 2"]);
    expect(await nomes(COORD, `select nome from gestao.escola`)).toEqual(["Escola Real", "Outra Real"]);
  });

  it("a coordenação real não altera escola de teste", async () => {
    await como(COORD, () => db.exec(`update gestao.escola set cidade = 'X' where nome = 'Escola E2E 1'`));
    const { rows } = await db.query<{ cidade: string }>(`select cidade from gestao.escola where nome = 'Escola E2E 1'`);
    expect(rows[0].cidade).toBe("Juiz de Fora");
  });

  it("a equipe continua fechada para quem não é coordenação", async () => {
    await expect(como(BIA, () => db.query(`select * from gestao.equipe()`))).rejects.toThrow(/apenas a coordenação/);
  });

  it("limpeza do E2E (20261109) só apaga encontro de 2001 de escola e equipe de teste", async () => {
    await db.exec(sqlDaMigracao("20261109_gestao_limpar_encontros_de_teste"));
    await db.exec(sqlDaMigracao("20261109_gestao_limpar_encontros_de_teste")); // reexecutável
    const escola = async (nome: string) =>
      (await db.query<{ id: string }>(`select id from gestao.escola where nome = '${nome}'`)).rows[0].id;
    const [e2e, real] = [await escola("Escola E2E 1"), await escola("Escola Real")];
    const encontro = async (data: string, escolaId: string | null, pessoas: string[], criadoHa = '2 hours') => {
      const { rows } = await db.query<{ id: string }>(
        `insert into gestao.agenda (data, escola_id, aulas, modalidade, horario, inicio, fim, criado_em)
         values ($1, $2, '1', 'Lego', '8h', '08:00', '10:00', now() - $3::interval) returning id`,
        [data, escolaId, criadoHa],
      );
      for (const p of pessoas) {
        await db.query(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id, carga) values ($1, $2, '2h')`, [rows[0].id, p]);
      }
      return rows[0].id;
    };
    await db.exec(`set request.jwt.claim.sub = '${COORD_E2E}'`); // autoria dos encontros de preparação
    const apaga = [await encontro("2001-05-10", e2e, [BOLSISTA_E2E]), await encontro("2001-05-11", null, [BOLSISTA_E2E])];
    const fica = [
      await encontro("2001-05-12", real, []), // escola real
      await encontro("2026-05-10", e2e, [BOLSISTA_E2E]), // fora de 2001
      await encontro("2001-05-13", e2e, [BOLSISTA_E2E, BIA]), // pessoa real alocada
      await encontro("2001-05-14", e2e, [BOLSISTA_E2E], '5 minutes'), // de uma execução do CI ainda rodando
    ];

    await db.exec(`reset request.jwt.claim.sub`);
    await expect(como(COORD, () => db.query(`select gestao.limpar_encontros_de_teste()`))).rejects.toThrow(/só conta de teste/);
    await db.exec(`set role anon`);
    await expect(db.query(`select gestao.limpar_encontros_de_teste()`)).rejects.toThrow(/permission denied/).finally(() => db.exec(`reset role`));

    const { rows } = await como(COORD_E2E, () => db.query<{ n: number }>(`select gestao.limpar_encontros_de_teste() as n`));
    expect(rows[0].n).toBe(2);
    const restantes = (await db.query<{ id: string }>(`select id from gestao.agenda`)).rows.map((r) => r.id);
    expect(restantes.sort()).toEqual([...fica].sort());
    expect(restantes).not.toContain(apaga[0]);
  });
});
