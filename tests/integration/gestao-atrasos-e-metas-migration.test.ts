// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { comoUsuario, gestaoAte, sqlDaMigracao } from "./helpers/gestao";

/**
 * Atraso por pessoa e metas (20261115). Ana é responsável pelas metas; Caio é
 * bolsista sem meta; Ex foi desligado; Visitante não tem papel; Coord E2E é a
 * coordenação de teste.
 */

// Sem a dos artigos (pede `public.article`, alheia a esta); a última de novo: idempotência.
const MIGRATIONS = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
  sqlDaMigracao("20261114_gestao_numero_da_aula"),
  sqlDaMigracao("20261115_gestao_atrasos_e_metas"),
  sqlDaMigracao("20261115_gestao_atrasos_e_metas"),
];

const COORD = "7a000000-0000-4000-8000-000000000001";
const ANA = "7a000000-0000-4000-8000-000000000002";
const CAIO = "7a000000-0000-4000-8000-000000000003";
const EX = "7a000000-0000-4000-8000-000000000004";
const VISITANTE = "7a000000-0000-4000-8000-000000000005";
const COORD_E2E = "7a000000-0000-4000-8000-000000000006";
const ESCOLA = "7b000000-0000-4000-8000-000000000001";

describe("atrasos e metas (20261115)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const como = comoUsuario(db);

  async function linhas<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await db.query<T>(sql, params)).rows;
  }

  const salvar = (id: string | null, titulo: string, responsaveis: string[], prazo = "2099-01-10") =>
    linhas<{ id: string }>(`select gestao.salvar_meta($1, $2, null, $3, $4::uuid[]) as id`, [id, titulo, prazo, responsaveis]).then(
      (r) => r[0].id,
    );
  const responsaveis = async (meta: string) =>
    (
      await linhas<{ user_profile_id: string }>(
        `select user_profile_id::text from gestao.meta_responsavel where meta_id = $1 order by user_profile_id`,
        [meta],
      )
    ).map((r) => r.user_profile_id);

  beforeAll(async () => {
    const pessoas = [COORD, ANA, CAIO, EX, VISITANTE, COORD_E2E];
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
        ('${COORD}', true, false), ('${ANA}', false, true), ('${CAIO}', false, true),
        ('${EX}', false, true), ('${COORD_E2E}', true, false);
      update gestao.papel_membro set desligado_em = now() where user_profile_id = '${EX}';
      update gestao.papel_membro set teste = true where user_profile_id = '${COORD_E2E}';
      insert into gestao.escola (id, nome, categoria, cidade, teste) values
        ('${ESCOLA}', 'Escola real', 'estadual', 'Juiz de Fora', false);
    `);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  // -------------------------------------------------------------------------
  // Atraso
  // -------------------------------------------------------------------------

  async function alocacao(data: string): Promise<{ agenda: string; alocacao: string }> {
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    try {
      const agenda = (
        await linhas<{ id: string }>(
          `insert into gestao.agenda (data, escola_id, aulas, modalidade, inicio, fim)
           values ($1, $2, 'Lego', 'Lego', '08:00', '12:00') returning id`,
          [data, ESCOLA],
        )
      )[0].id;
      const id = (
        await linhas<{ id: string }>(
          `insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ($1, $2) returning id`,
          [agenda, ANA],
        )
      )[0].id;
      return { agenda, alocacao: id };
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

  const horas = (agenda: string) =>
    como(COORD, () =>
      linhas<{ horas: string }>(`select horas::text from gestao.v_carga where agenda_id = $1`, [agenda]),
    );

  it("a coordenação grava o atraso; as horas não mudam", async () => {
    const { agenda, alocacao: id } = await alocacao("2026-10-05");
    const antes = await horas(agenda);

    const gravadas = await como(COORD, () =>
      linhas(`update gestao.agenda_bolsista set atraso_minutos = 15 where id = $1 returning id`, [id]),
    );
    expect(gravadas).toHaveLength(1);
    expect(
      (await linhas<{ atraso_minutos: number }>(`select atraso_minutos from gestao.agenda_bolsista where id = $1`, [id]))[0]
        .atraso_minutos,
    ).toBe(15);
    expect(await horas(agenda)).toEqual(antes);
  });

  it("atraso fora de 1 a 600 é recusado", async () => {
    const { alocacao: id } = await alocacao("2026-10-06");
    for (const n of [0, 601]) {
      await expect(
        como(COORD, () => db.query(`update gestao.agenda_bolsista set atraso_minutos = $1 where id = $2`, [n, id])),
      ).rejects.toThrow(/check/);
    }
  });

  it("o bolsista não grava atraso, nem o próprio", async () => {
    const { alocacao: id } = await alocacao("2026-10-07");
    const gravadas = await como(ANA, () =>
      linhas(`update gestao.agenda_bolsista set atraso_minutos = 5 where id = $1 returning id`, [id]),
    );
    expect(gravadas).toEqual([]);
    expect(
      (await linhas<{ atraso_minutos: number | null }>(`select atraso_minutos from gestao.agenda_bolsista where id = $1`, [id]))[0]
        .atraso_minutos,
    ).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Metas
  // -------------------------------------------------------------------------

  it("a coordenação cria meta com responsáveis e, ao editar, a lista substitui a anterior", async () => {
    const id = await como(COORD, () => salvar(null, "Fechar o relatório anual", [ANA, CAIO]));
    expect(await responsaveis(id)).toEqual([ANA, CAIO].sort());

    const mesmo = await como(COORD, () => salvar(id, "Fechar o relatório anual de 2026", [ANA]));
    expect(mesmo).toBe(id);
    expect(await responsaveis(id)).toEqual([ANA]);
    const [meta] = await linhas<{ titulo: string; criado_por: string; concluida_em: string | null }>(
      `select titulo, criado_por::text, concluida_em from gestao.meta where id = $1`,
      [id],
    );
    expect(meta).toEqual({ titulo: "Fechar o relatório anual de 2026", criado_por: COORD, concluida_em: null });
  });

  it("meta sem responsável é recusada", async () => {
    await expect(como(COORD, () => salvar(null, "Sem ninguém", []))).rejects.toThrow(/ao menos um responsável/);
  });

  it("bolsista não cria nem edita meta", async () => {
    const id = await como(COORD, () => salvar(null, "Meta da coordenação", [ANA]));
    await expect(como(ANA, () => salvar(null, "Minha meta", [ANA]))).rejects.toThrow(/row-level security/);
    await expect(como(ANA, () => salvar(id, "Mudei", [ANA]))).rejects.toThrow(/apenas a coordenação edita metas/);
    await expect(
      como(ANA, () => db.query(`select gestao.salvar_meta($1, 'Mudei', null, '2099-01-10', $2::uuid[])`, [id, [ANA]])),
    ).rejects.toMatchObject({ code: "42501" });

    const alteradas = await como(ANA, () => linhas(`update gestao.meta set titulo = 'Mudei' where id = $1 returning id`, [id]));
    expect(alteradas).toEqual([]);
    await expect(
      como(ANA, () => db.query(`insert into gestao.meta_responsavel (meta_id, user_profile_id) values ($1, $2)`, [id, CAIO])),
    ).rejects.toThrow(/row-level security/);
  });

  it("concluir carimba a hora do banco; concluir de novo mantém; nulo reabre", async () => {
    const id = await como(COORD, () => salvar(null, "Concluir algo", [ANA]));
    await como(COORD, () => db.query(`update gestao.meta set concluida_em = '2000-01-01' where id = $1`, [id]));
    const [{ concluida_em: primeira, recente }] = await linhas<{ concluida_em: string; recente: boolean }>(
      `select concluida_em::text, concluida_em > now() - interval '1 minute' as recente from gestao.meta where id = $1`,
      [id],
    );
    expect(recente).toBe(true);

    await como(COORD, () => db.query(`update gestao.meta set concluida_em = '2001-01-01' where id = $1`, [id]));
    expect((await linhas<{ c: string }>(`select concluida_em::text as c from gestao.meta where id = $1`, [id]))[0].c).toBe(primeira);

    await como(COORD, () => db.query(`update gestao.meta set concluida_em = null where id = $1`, [id]));
    expect((await linhas<{ c: string | null }>(`select concluida_em as c from gestao.meta where id = $1`, [id]))[0].c).toBeNull();
  });

  it("andamento: responsável registra (com a própria autoria); quem não é responsável não", async () => {
    const id = await como(COORD, () => salvar(null, "Andamento", [ANA]));
    const [linha] = await como(ANA, () =>
      linhas<{ autor: string }>(
        `insert into gestao.meta_andamento (meta_id, autor, texto) values ($1, $2, 'Comecei') returning autor::text`,
        [id, CAIO],
      ),
    );
    expect(linha.autor).toBe(ANA);

    await expect(
      como(CAIO, () => db.query(`insert into gestao.meta_andamento (meta_id, texto) values ($1, 'Eu também')`, [id])),
    ).rejects.toThrow(/row-level security/);

    await como(COORD, () => db.query(`insert into gestao.meta_andamento (meta_id, texto) values ($1, 'Visto')`, [id]));

    // Meta concluída continua recebendo andamento.
    await como(COORD, () => db.query(`update gestao.meta set concluida_em = now() where id = $1`, [id]));
    await como(ANA, () => db.query(`insert into gestao.meta_andamento (meta_id, texto) values ($1, 'Depois de concluída')`, [id]));

    const lidos = await como(CAIO, () =>
      linhas<{ texto: string }>(`select texto from gestao.meta_andamento where meta_id = $1 order by criado_em, texto`, [id]),
    );
    expect(lidos.map((l) => l.texto).sort()).toEqual(["Comecei", "Depois de concluída", "Visto"]);
  });

  it("andamento não se edita nem se apaga", async () => {
    const id = await como(COORD, () => salvar(null, "Imutável", [ANA]));
    await como(ANA, () => db.query(`insert into gestao.meta_andamento (meta_id, texto) values ($1, 'Fiz')`, [id]));
    for (const uid of [ANA, COORD]) {
      await expect(como(uid, () => db.query(`update gestao.meta_andamento set texto = 'Outro' where meta_id = $1`, [id]))).rejects.toThrow(
        /permission denied/,
      );
      await expect(como(uid, () => db.query(`delete from gestao.meta_andamento where meta_id = $1`, [id]))).rejects.toThrow(
        /permission denied/,
      );
    }
  });

  it("desligado, sem papel e anônimo não leem metas", async () => {
    for (const uid of [EX, VISITANTE]) {
      expect(await como(uid, () => linhas(`select id from gestao.meta`))).toEqual([]);
      expect(await como(uid, () => linhas(`select meta_id from gestao.meta_responsavel`))).toEqual([]);
      expect(await como(uid, () => linhas(`select id from gestao.meta_andamento`))).toEqual([]);
    }
    await db.exec(`set role anon`);
    try {
      await expect(db.query(`select id from gestao.meta`)).rejects.toThrow(/permission denied/);
      await expect(db.query(`select gestao.salvar_meta(null, 'x', null, '2099-01-10', '{}')`)).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec(`reset role`);
    }
  });

  it("meta da conta de teste não aparece para a equipe real, e vice-versa", async () => {
    const id = await como(COORD_E2E, () => salvar(null, "Meta do E2E", [ANA]));
    expect(await como(ANA, () => linhas(`select id from gestao.meta where id = $1`, [id]))).toEqual([]);
    expect(await como(COORD, () => linhas(`select id from gestao.meta where id = $1`, [id]))).toEqual([]);
    expect(await como(ANA, () => linhas(`select meta_id from gestao.meta_responsavel where meta_id = $1`, [id]))).toEqual([]);

    const reais = await como(COORD_E2E, () => linhas<{ titulo: string }>(`select titulo from gestao.meta`));
    expect(reais.map((r) => r.titulo)).toEqual(["Meta do E2E"]);
  });
});
