// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { comoUsuario, gestaoAte, sqlDaMigracao } from "./helpers/gestao";

/**
 * Número da aula, alunos presentes e aulas realizadas na home (20261114). Ana
 * está nos encontros; Caio não. A coordenação registra em qualquer encontro.
 */

// Sem a dos artigos (pede `public.article`, alheia a esta); a última de novo: idempotência.
const MIGRATIONS = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
  sqlDaMigracao("20261114_gestao_numero_da_aula"),
  sqlDaMigracao("20261114_gestao_numero_da_aula"),
];

const COORD = "78000000-0000-4000-8000-000000000001";
const ANA = "78000000-0000-4000-8000-000000000002";
const CAIO = "78000000-0000-4000-8000-000000000003";
const ESCOLA = "79000000-0000-4000-8000-000000000001";
const ESCOLA_TESTE = "79000000-0000-4000-8000-000000000002";
const FECHOU = "79000000-0000-4000-8000-000000000003";

describe("número da aula e presentes (20261114)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const como = comoUsuario(db);

  /** Encontro com Ana na equipe; `concluir` só vale para data passada. */
  async function encontro(data: string, campos: { escola?: string | null; turma?: string | null; concluir?: boolean } = {}) {
    const { escola = ESCOLA, turma = null, concluir = false } = campos;
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    try {
      const id = (
        await db.query<{ id: string }>(
          `insert into gestao.agenda (data, escola_id, turma_id, aulas, modalidade, inicio, fim)
           values ($1, $2, $3, 'Lego', 'Lego', '08:00', '12:00') returning id`,
          [data, escola, turma],
        )
      ).rows[0].id;
      await db.query(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ($1, $2)`, [id, ANA]);
      if (concluir) await db.query(`update gestao.agenda set concluido_em = now() where id = $1`, [id]);
      return id;
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }
  /** SQL direto (sem RLS), com autoria da coordenação. */
  async function direto(sql: string) {
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    try {
      await db.exec(sql);
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }
  const presentes = (agenda: string, n: number | null) =>
    db.query(`select gestao.registrar_presentes($1, $2)`, [agenda, n]);
  const lidos = async (agenda: string) =>
    (await db.query<{ presentes: number | null }>(`select presentes from gestao.agenda where id = $1`, [agenda])).rows[0].presentes;
  async function aulasNaHome(): Promise<number> {
    await db.exec(`set role anon`);
    try {
      return (await db.query<{ aulas: number }>(`select aulas from public.numeros_da_home()`)).rows[0].aulas;
    } finally {
      await db.exec(`reset role`);
    }
  }
  const config = async (chave: string) =>
    (await db.query<{ value: string }>(`select value from public.system_config where key = $1`, [chave])).rows[0]?.value ?? null;

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
    for (const sql of MIGRATIONS) await db.exec(sql);

    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false), ('${ANA}', false, true), ('${CAIO}', false, true);
      insert into gestao.escola (id, nome, categoria, cidade, teste) values
        ('${ESCOLA}', 'Escola real', 'estadual', 'Juiz de Fora', false),
        ('${ESCOLA_TESTE}', 'Escola E2E', 'estadual', 'Juiz de Fora', true);
      insert into gestao.turma (id, escola_id, nome, modalidade, inicio, status, motivo) values
        ('${FECHOU}', '${ESCOLA}', 'Fechou', 'IA', '2026-01-01', 'nao_abriu', 'sem inscritos');
    `);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("importar grava o número da aula quando vem, e nulo quando não vem", async () => {
    const enc = (data: string, extra: Record<string, unknown> = {}) => ({
      data, inicio: "08:00", fim: "12:00", modalidade: "Lego", aulas: "Aula 05", escola_id: ESCOLA, escola_nova: null, ...extra,
    });
    await como(COORD, () =>
      db.query(`select gestao.importar_planilha($1, $2, $3)`, [
        "calendario.xlsx",
        "[]",
        JSON.stringify([enc("2099-05-04", { numero_aula: 5 }), enc("2099-05-05")]),
      ]),
    );
    const { rows } = await db.query<{ data: string; numero_aula: number | null }>(
      `select data::text, numero_aula from gestao.agenda where data between '2099-05-04' and '2099-05-05' order by data`,
    );
    expect(rows).toEqual([
      { data: "2099-05-04", numero_aula: 5 },
      { data: "2099-05-05", numero_aula: null },
    ]);
  });

  it("recusa número da aula zero e presentes negativos na tabela", async () => {
    await expect(direto(`update gestao.agenda set numero_aula = 0 where data = '2099-05-04'`)).rejects.toThrow(/check/);
    await expect(direto(`update gestao.agenda set presentes = -1 where data = '2099-05-04'`)).rejects.toThrow(/check/);
  });

  it("quem esteve registra e sobrescreve; a coordenação também; quem é de fora não", async () => {
    const id = await encontro("2026-10-05");
    await como(ANA, () => presentes(id, 18));
    expect(await lidos(id)).toBe(18);
    await como(ANA, () => presentes(id, 20));
    expect(await lidos(id)).toBe(20);
    await como(COORD, () => presentes(id, 0));
    expect(await lidos(id)).toBe(0);
    await expect(como(CAIO, () => presentes(id, 5))).rejects.toThrow(/só quem esteve no encontro ou a coordenação/);
    expect(await lidos(id)).toBe(0);
  });

  it("recusa número fora da faixa, encontro futuro, cancelado e sem escola nem turma", async () => {
    const id = await encontro("2026-10-06");
    await como(ANA, async () => {
      await expect(presentes(id, -1)).rejects.toThrow(/de 0 a 9999/);
      await expect(presentes(id, null)).rejects.toThrow(/de 0 a 9999/);
      await expect(presentes(id, 10000)).rejects.toThrow(/de 0 a 9999/);
    });

    const futuro = await encontro("2099-10-06");
    await expect(como(ANA, () => presentes(futuro, 3))).rejects.toThrow(/depois da hora de início/);

    const cancelado = await encontro("2026-10-07");
    await direto(`update gestao.agenda set cancelado_em = now(), motivo_cancelamento = 'Chuva' where id = '${cancelado}'`);
    await expect(como(COORD, () => presentes(cancelado, 3))).rejects.toThrow(/cancelado/);

    const semEscola = await encontro("2026-10-08", { escola: null });
    await expect(como(ANA, () => presentes(semEscola, 3))).rejects.toThrow(/escola ou turma/);
  });

  it("encontro concluído ainda recebe presentes; o anon não executa", async () => {
    const id = await encontro("2026-10-09", { concluir: true });
    await como(ANA, () => presentes(id, 12));
    expect(await lidos(id)).toBe(12);

    await db.exec(`set role anon`);
    try {
      await expect(presentes(id, 1)).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec(`reset role`);
    }
  });

  it("aulas na home: base + concluídos com escola real e turma que abriu", async () => {
    // Até aqui: 1 concluído (2026-10-09) na escola real.
    expect(await aulasNaHome()).toBe(1);
    await encontro("2026-10-10", { concluir: true });
    await encontro("2026-10-11", { escola: ESCOLA_TESTE, concluir: true });
    await encontro("2026-10-12", { escola: null, concluir: true });
    await encontro("2026-10-13", { turma: FECHOU, concluir: true });
    await encontro("2026-10-14");
    expect(await aulasNaHome()).toBe(2);

    await direto(`insert into public.system_config (key, value) values ('public_aulas_realizadas', '10')`);
    expect(await aulasNaHome()).toBe(12);
  });

  it("definir_numeros_do_site: dois argumentos não mexem nas aulas; três gravam; só a coordenação", async () => {
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
       where s.nspname = 'gestao' and p.proname = 'definir_numeros_do_site'`,
    );
    expect(rows[0].n).toBe(1);

    await como(COORD, () => db.query(`select gestao.definir_numeros_do_site(35, 1499)`));
    expect([await config("escolas_atendidas"), await config("alunos_atendidos"), await config("public_aulas_realizadas")]).toEqual([
      "35",
      "1499",
      "10",
    ]);

    await como(COORD, () => db.query(`select gestao.definir_numeros_do_site(35, 1499, 300)`));
    expect(await config("public_aulas_realizadas")).toBe("300");
    expect(await aulasNaHome()).toBe(302);

    await expect(como(COORD, () => db.query(`select gestao.definir_numeros_do_site(1, 1, -1)`))).rejects.toThrow(/entre 0 e 1.000.000/);
    await expect(como(COORD, () => db.query(`select gestao.definir_numeros_do_site(1, 1, 1000001)`))).rejects.toThrow(
      /entre 0 e 1.000.000/,
    );
    await expect(como(ANA, () => db.query(`select gestao.definir_numeros_do_site(1, 1, 1)`))).rejects.toThrow(/só a coordenação/);
    expect(await config("public_aulas_realizadas")).toBe("300");
  });
});
