// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { comoUsuario, gestaoAte, sqlDaMigracao } from "./helpers/gestao";

/**
 * Horas alocadas na carga e cursos da turma (20261119). A turma "9º A" existe
 * antes da migração, com 20 alunos de Lego; depois volta para Python. Ana tem
 * um encontro passado e outros no futuro.
 */

// Sem a dos artigos (pede `public.article`). Os dados entram antes das 20261119,
// para provar a cópia das turmas que já existem.
const ANTES = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
  sqlDaMigracao("20261114_gestao_numero_da_aula"),
  sqlDaMigracao("20261115_gestao_atrasos_e_metas"),
  sqlDaMigracao("20261116_gestao_espacos"),
];
// A última de novo: idempotência.
const NOVAS = [
  sqlDaMigracao("20261119_gestao_horas_alocadas"),
  sqlDaMigracao("20261119_gestao_cursos_da_turma"),
  sqlDaMigracao("20261119_gestao_cursos_da_turma"),
];

const COORD = "7a000000-0000-4000-8000-000000000001";
const ANA = "7a000000-0000-4000-8000-000000000002";
const CAIO = "7a000000-0000-4000-8000-000000000003";
const ESCOLA = "7b000000-0000-4000-8000-000000000001";
const TURMA = "7b000000-0000-4000-8000-000000000002";

describe("horas alocadas e cursos da turma (20261119)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const como = comoUsuario(db);

  /** SQL direto (sem RLS), com autoria da coordenação. */
  async function direto(sql: string) {
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    try {
      await db.exec(sql);
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

  async function encontro(data: string, pessoas: string[]): Promise<string> {
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    try {
      const id = (
        await db.query<{ id: string }>(
          `insert into gestao.agenda (data, escola_id, turma_id, aulas, modalidade, inicio, fim)
           values ($1, $2, $3, 'Lego', 'Lego', '08:00', '12:00') returning id`,
          [data, ESCOLA, TURMA],
        )
      ).rows[0].id;
      for (const p of pessoas) await db.query(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ($1, $2)`, [id, p]);
      return id;
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

  async function carga(pessoa: string, de: string, ate: string) {
    const { rows } = await db.query<{ horas: string; alocadas: string }>(
      `select coalesce(sum(horas), 0)::text as horas, coalesce(sum(horas_alocadas), 0)::text as alocadas
       from gestao.v_carga where bolsista_id = $1 and data between $2 and $3`,
      [pessoa, de, ate],
    );
    return { horas: Number(rows[0].horas), alocadas: Number(rows[0].alocadas) };
  }

  async function alunosNaHome(): Promise<number> {
    await db.exec(`set role anon`);
    try {
      return (await db.query<{ alunos: number }>(`select alunos from public.numeros_da_home()`)).rows[0].alunos;
    } finally {
      await db.exec(`reset role`);
    }
  }

  const cursos = async (turma: string) =>
    (
      await db.query<{ modalidade: string; n_alunos: number | null }>(
        `select modalidade, n_alunos from gestao.turma_curso where turma_id = $1 order by inicio`,
        [turma],
      )
    ).rows;

  beforeAll(async () => {
    const pessoas = [COORD, ANA, CAIO];
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

      create table public.user_profile (id uuid primary key, full_name text not null, email text not null, document text);
      alter table public.user_profile enable row level security;
      create table public.system_config (key text primary key, value text, updated_at timestamptz);
      grant usage on schema public to anon, authenticated;
      grant select on public.user_profile to authenticated;
      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text, type text, payload jsonb, read_at timestamptz, created_at timestamptz default now()
      );
      alter table public.notification enable row level security;
      grant select, insert, update on public.notification to authenticated;

      insert into auth.users (id) values ${pessoas.map((p) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name, email) values
        ${pessoas.map((p, i) => `('${p}', 'Pessoa ${i}', 'p${i}@ufjf.br')`).join(", ")};
    `);
    for (const sql of ANTES) await db.exec(sql);
    await direto(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false), ('${ANA}', false, true), ('${CAIO}', false, true);
      insert into gestao.escola (id, nome, categoria, cidade, teste) values
        ('${ESCOLA}', 'Escola real', 'estadual', 'Juiz de Fora', false);
      insert into gestao.turma (id, escola_id, nome, modalidade, inicio, n_alunos) values
        ('${TURMA}', '${ESCOLA}', '9º A', 'Lego', '2026-03-01', 20);
    `);
    for (const sql of NOVAS) await db.exec(sql);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("encontro futuro entra nas alocadas e não nas cumpridas; o passado nas duas", async () => {
    await encontro("2026-10-05", [ANA]);
    await encontro("2099-10-05", [ANA]);
    expect(await carga(ANA, "2026-10-01", "2026-10-31")).toEqual({ horas: 4, alocadas: 4 });
    expect(await carga(ANA, "2099-10-01", "2099-10-31")).toEqual({ horas: 0, alocadas: 4 });
  });

  it("falta não é alocada; a cobertura futura vai para quem cobriu", async () => {
    const id = await encontro("2099-11-05", [ANA]);
    await direto(`update gestao.agenda_bolsista set situacao = 'faltou_avisou', coberto_por = '${CAIO}' where agenda_id = '${id}'`);
    expect(await carga(ANA, "2099-11-01", "2099-11-30")).toEqual({ horas: 0, alocadas: 0 });
    expect(await carga(CAIO, "2099-11-01", "2099-11-30")).toEqual({ horas: 0, alocadas: 4 });
  });

  it("a turma que já existia vira turma com um curso, sem duplicar ao rodar de novo", async () => {
    expect(await cursos(TURMA)).toEqual([{ modalidade: "Lego", n_alunos: 20 }]);
    expect(await alunosNaHome()).toBe(20);
  });

  it("a mesma turma em Python conta de novo; turma nova já nasce com o curso", async () => {
    await como(COORD, () =>
      db.query(
        `insert into gestao.turma_curso (turma_id, modalidade, inicio, n_alunos) values ($1, 'Python', '2027-02-01', 18)`,
        [TURMA],
      ),
    );
    const nova = await como(COORD, async () =>
      (
        await db.query<{ id: string }>(
          `insert into gestao.turma (escola_id, nome, modalidade, inicio, n_alunos) values ($1, '8º B', 'IA', '2026-08-01', 30) returning id`,
          [ESCOLA],
        )
      ).rows[0].id,
    );
    expect(await cursos(TURMA)).toEqual([
      { modalidade: "Lego", n_alunos: 20 },
      { modalidade: "Python", n_alunos: 18 },
    ]);
    expect(await cursos(nova)).toEqual([{ modalidade: "IA", n_alunos: 30 }]);
    expect(await alunosNaHome()).toBe(68);

    // Turma que não abriu sai do total com todos os cursos dela.
    await direto(`update gestao.turma set status = 'nao_abriu', motivo = 'sem inscritos' where id = '${TURMA}'`);
    expect(await alunosNaHome()).toBe(30);
  });

  it("bolsista não lê nem grava cursos", async () => {
    await expect(
      como(ANA, () =>
        db.query(`insert into gestao.turma_curso (turma_id, modalidade, inicio) values ($1, 'Python', '2027-02-01')`, [TURMA]),
      ),
    ).rejects.toThrow(/row-level security/);
    expect(await como(ANA, async () => (await db.query(`select id from gestao.turma_curso`)).rows)).toEqual([]);
  });
});
