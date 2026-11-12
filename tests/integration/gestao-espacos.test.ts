// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { comoUsuario, gestaoAte, sqlDaMigracao } from "./helpers/gestao";

/**
 * Agenda por espaço (20261116). Ana e Caio são bolsistas; Coord E2E é a
 * coordenação de teste. Antes da migração já existe um encontro com a Ana, para
 * conferir os valores padrão.
 */

// Sem a dos artigos (pede `public.article`, alheia a esta).
const ANTES = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
  sqlDaMigracao("20261114_gestao_numero_da_aula"),
  sqlDaMigracao("20261115_gestao_atrasos_e_metas"),
];
const ESPACOS = sqlDaMigracao("20261116_gestao_espacos");

const COORD = "7c000000-0000-4000-8000-000000000001";
const ANA = "7c000000-0000-4000-8000-000000000002";
const CAIO = "7c000000-0000-4000-8000-000000000003";
const COORD_E2E = "7c000000-0000-4000-8000-000000000004";
const ESCOLA = "7d000000-0000-4000-8000-000000000001";

describe("agenda por espaço (20261116)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const como = comoUsuario(db);
  let antigo = { agenda: "", alocacao: "" };

  async function linhas<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await db.query<T>(sql, params)).rows;
  }

  /** Grava como `uid` sem trocar de papel (preparação, fora da RLS). */
  async function preparar<T>(uid: string, fn: () => Promise<T>): Promise<T> {
    await db.exec(`set request.jwt.claim.sub = '${uid}'`);
    try {
      return await fn();
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

  const encontro = (data: string, campos: { escola?: string | null; espaco?: string | null; tipo?: string; criadoHa?: string } = {}) =>
    linhas<{ id: string }>(
      `insert into gestao.agenda (data, escola_id, aulas, modalidade, inicio, fim, espaco_id, tipo, criado_em)
       values ($1, $2, 'Lego', 'Lego', '08:00', '12:00', $3, coalesce($4, 'aula'), now() - $5::interval) returning id`,
      [data, campos.escola === undefined ? ESCOLA : campos.escola, campos.espaco ?? null, campos.tipo ?? null, campos.criadoHa ?? "0 minutes"],
    ).then((r) => r[0].id);

  const alocar = (agenda: string, pessoa: string, funcao = "apoio") =>
    linhas<{ id: string }>(
      `insert into gestao.agenda_bolsista (agenda_id, bolsista_id, funcao) values ($1, $2, $3) returning id`,
      [agenda, pessoa, funcao],
    ).then((r) => r[0].id);

  const criarEspaco = (uid: string, nome: string) =>
    como(uid, () => linhas<{ id: string }>(`insert into gestao.espaco (nome) values ($1) returning id`, [nome])).then(
      (r) => r[0].id,
    );

  beforeAll(async () => {
    const pessoas = [COORD, ANA, CAIO, COORD_E2E];
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

    await preparar(COORD, async () => {
      await db.exec(`
        insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
          ('${COORD}', true, false), ('${ANA}', false, true), ('${CAIO}', false, true), ('${COORD_E2E}', true, false);
        update gestao.papel_membro set teste = true where user_profile_id = '${COORD_E2E}';
        insert into gestao.escola (id, nome, categoria, cidade, teste) values
          ('${ESCOLA}', 'Escola real', 'estadual', 'Juiz de Fora', false);
      `);
      // Encontro gravado antes da migração: sem tipo nem função.
      const agenda = (
        await linhas<{ id: string }>(
          `insert into gestao.agenda (data, escola_id, aulas, modalidade, inicio, fim)
           values ('2026-10-01', $1, 'Lego', 'Lego', '08:00', '12:00') returning id`,
          [ESCOLA],
        )
      )[0].id;
      const alocacao = (
        await linhas<{ id: string }>(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ($1, $2) returning id`, [
          agenda,
          ANA,
        ])
      )[0].id;
      antigo = { agenda, alocacao };
    });

    // Duas vezes: idempotência.
    await db.exec(ESPACOS);
    await db.exec(ESPACOS);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("linhas de antes da migração ficam como aula e apoio", async () => {
    expect((await linhas<{ tipo: string }>(`select tipo from gestao.agenda where id = $1`, [antigo.agenda]))[0].tipo).toBe("aula");
    expect(
      (await linhas<{ funcao: string }>(`select funcao from gestao.agenda_bolsista where id = $1`, [antigo.alocacao]))[0].funcao,
    ).toBe("apoio");
  });

  it("tipo e função fora da lista são recusados", async () => {
    await expect(preparar(COORD, () => encontro("2026-10-02", { tipo: "festa" }))).rejects.toThrow(/agenda_tipo/);
    await expect(preparar(COORD, () => alocar(antigo.agenda, CAIO, "chefe"))).rejects.toThrow(/agenda_bolsista_funcao/);
  });

  it("a coordenação cria, edita e desativa; o bolsista lê e não grava; ninguém apaga", async () => {
    const id = await criarEspaco(COORD, "Sala 1");
    const editadas = await como(COORD, () =>
      linhas(`update gestao.espaco set nome = 'Sala 101', ativo = false where id = $1 returning id`, [id]),
    );
    expect(editadas).toHaveLength(1);
    expect(await linhas(`select nome, ativo from gestao.espaco where id = $1`, [id])).toEqual([{ nome: "Sala 101", ativo: false }]);

    expect(await como(ANA, () => linhas<{ nome: string }>(`select nome from gestao.espaco where id = $1`, [id]))).toEqual([
      { nome: "Sala 101" },
    ]);
    await expect(criarEspaco(ANA, "Sala da Ana")).rejects.toThrow(/row-level security/);
    expect(await como(ANA, () => linhas(`update gestao.espaco set nome = 'Mudei' where id = $1 returning id`, [id]))).toHaveLength(0);

    for (const uid of [COORD, ANA]) {
      await expect(como(uid, () => db.query(`delete from gestao.espaco where id = $1`, [id]))).rejects.toThrow(/permission denied/);
    }
  });

  it("nome repetido (caixa ou espaços) e nome de 1 ou 81 caracteres são recusados", async () => {
    await criarEspaco(COORD, "Laboratório");
    await expect(criarEspaco(COORD, "laboratório")).rejects.toThrow(/espaco_nome_unico/);
    await expect(criarEspaco(COORD, "  LABORATÓRIO ")).rejects.toThrow(/espaco_nome_unico/);
    await expect(criarEspaco(COORD, "A")).rejects.toThrow(/check/);
    await expect(criarEspaco(COORD, "x".repeat(81))).rejects.toThrow(/check/);
    await expect(criarEspaco(COORD, "x".repeat(80))).resolves.toBeTruthy();
  });

  it("responsável e apoio contam as mesmas horas em encontro sem escola", async () => {
    const espaco = await criarEspaco(COORD, "Sala de impressão");
    const agenda = await preparar(COORD, async () => {
      const id = await encontro("2026-10-03", { escola: null, espaco, tipo: "impressao" });
      await alocar(id, ANA, "responsavel");
      await alocar(id, CAIO, "apoio");
      return id;
    });
    const horas = await como(COORD, () =>
      linhas<{ bolsista_id: string; horas: string }>(
        `select bolsista_id::text, horas::text from gestao.v_carga where agenda_id = $1 order by bolsista_id`,
        [agenda],
      ),
    );
    expect(horas).toEqual([
      { bolsista_id: ANA, horas: "4.00" },
      { bolsista_id: CAIO, horas: "4.00" },
    ]);
  });

  it("quem substitui um responsável entra como responsável", async () => {
    const id = await preparar(COORD, async () => alocar(await encontro("2026-10-04"), ANA, "responsavel"));
    const nova = await como(COORD, () =>
      linhas<{ id: string }>(`select gestao.substituir_alocacao($1, $2, null) as id`, [id, CAIO]),
    );
    expect(
      await linhas(`select bolsista_id::text, funcao from gestao.agenda_bolsista where id = $1`, [nova[0].id]),
    ).toEqual([{ bolsista_id: CAIO, funcao: "responsavel" }]);
  });

  it("espaço em uso não se apaga; a limpeza do E2E apaga encontro de teste com espaço", async () => {
    const usado = await criarEspaco(COORD, "Auditório");
    await preparar(COORD, () => encontro("2026-10-05", { espaco: usado }));
    await expect(db.query(`delete from gestao.espaco where id = $1`, [usado])).rejects.toThrow(/foreign key/);

    const deTeste = await criarEspaco(COORD_E2E, "Sala E2E");
    const agenda = await preparar(COORD_E2E, () => encontro("2001-05-10", { escola: null, espaco: deTeste, criadoHa: "2 hours" }));
    const { rows } = await como(COORD_E2E, () => db.query<{ n: number }>(`select gestao.limpar_encontros_de_teste() as n`));
    expect(rows[0].n).toBe(1);
    expect(await linhas(`select id from gestao.agenda where id = $1`, [agenda])).toHaveLength(0);
  });

  it("espaço de teste e espaço real não se veem (teste_separado)", async () => {
    await criarEspaco(COORD_E2E, "Sala separada");
    await criarEspaco(COORD, "Sala separada"); // mesmo nome: o índice separa por `teste`
    const nomes = (uid: string) =>
      como(uid, () => linhas<{ nome: string; teste: boolean }>(`select nome, teste from gestao.espaco where nome = 'Sala separada'`));
    expect(await nomes(COORD)).toEqual([{ nome: "Sala separada", teste: false }]);
    expect(await nomes(COORD_E2E)).toEqual([{ nome: "Sala separada", teste: true }]);
  });
});
