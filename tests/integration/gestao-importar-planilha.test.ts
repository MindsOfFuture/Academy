// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { comoUsuario, gestaoAte, sqlDaMigracao } from "./helpers/gestao";

/**
 * Importação da planilha em lote reversível (20261113). A coordenação importa
 * encontros e escolas novas; desfazer apaga o lote inteiro ou nada.
 */

// Sem a dos artigos (pede `public.article`, alheia a esta); a última de novo: idempotência.
const MIGRATIONS = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
];

const COORD = "76000000-0000-4000-8000-000000000001";
const ANA = "76000000-0000-4000-8000-000000000002";
const ANTIGA = "77000000-0000-4000-8000-000000000001";

type Resumo = Record<string, number | string>;

describe("importar planilha (20261113)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const como = comoUsuario(db);

  const importar = (escolas: unknown[], encontros: unknown[], uid = COORD) =>
    como(uid, async () =>
      (
        await db.query<{ r: Resumo }>(`select gestao.importar_planilha($1, $2, $3) as r`, [
          "calendario.xlsx",
          JSON.stringify(escolas),
          JSON.stringify(encontros),
        ])
      ).rows[0].r,
    );
  const desfazer = (id: string, uid = COORD) =>
    como(uid, async () => (await db.query<{ r: Resumo }>(`select gestao.desfazer_importacao($1) as r`, [id])).rows[0].r);
  const contar = async (sql: string) => Number((await db.query<{ n: number }>(`select count(*)::int as n from ${sql}`)).rows[0].n);

  const nova = { nome: "E.E. de Belmiro Braga", categoria: "estadual", cidade: "Belmiro Braga" };
  const enc = (data: string, extra: Record<string, unknown> = {}) => ({
    data, inicio: "08:00", fim: "12:00", modalidade: "Lego", aulas: "Aulas 01 e 02", escola_id: null, escola_nova: null, ...extra,
  });

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

      create table public.user_profile (id uuid primary key, full_name text not null, email text not null, document text);
      alter table public.user_profile enable row level security;
      create table public.system_config (key text primary key, value text);
      grant usage on schema public to anon, authenticated;
      grant select on public.user_profile to authenticated;
      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text, type text, payload jsonb, read_at timestamptz, created_at timestamptz default now()
      );
      alter table public.notification enable row level security;
      grant select, insert, update on public.notification to authenticated;

      insert into auth.users (id) values ('${COORD}'), ('${ANA}');
      insert into public.user_profile (id, full_name, email) values
        ('${COORD}', 'Coord', 'c@ufjf.br'), ('${ANA}', 'Ana', 'a@ufjf.br');
    `);
    for (const sql of MIGRATIONS) await db.exec(sql);

    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false), ('${ANA}', false, true);
      insert into gestao.escola (id, nome, categoria, cidade) values ('${ANTIGA}', 'E.M. Antiga', 'municipal', 'Juiz de Fora');
    `);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  let primeiro = "";

  it("cria escolas e encontros no lote; o passado entra concluído, o futuro não", async () => {
    const r = await importar(
      [nova, { nome: " e.m. antiga ", categoria: "municipal", cidade: "Juiz de Fora" }],
      [
        enc("2020-03-02", { escola_nova: "E.E. de Belmiro Braga" }),
        enc("2099-03-02", { escola_nova: "E.E. de Belmiro Braga" }),
        enc("2099-03-03", { escola_nova: "E.M. Antiga" }),
        enc("2099-03-04", { escola_id: ANTIGA, inicio: "14:00", fim: "17:00" }),
        enc("2099-03-05", { modalidade: "Treinamento", aulas: "Treinamento" }),
      ],
    );
    primeiro = String(r.id);
    expect(r).toMatchObject({ encontros: 5, pulados: 0, escolas: 1, concluidos: 1 });

    const linhas = (
      await db.query<{ data: string; criado_por: string; concluido: boolean; escola: string | null; horario: string }>(
        `select a.data::text, a.criado_por, a.concluido_em is not null as concluido, e.nome as escola, a.horario
         from gestao.agenda a left join gestao.escola e on e.id = a.escola_id
         where a.importacao_id = '${primeiro}' order by a.data`,
      )
    ).rows;
    expect(linhas.map((l) => [l.data, l.concluido, l.escola])).toEqual([
      ["2020-03-02", true, "E.E. de Belmiro Braga"],
      ["2099-03-02", false, "E.E. de Belmiro Braga"],
      ["2099-03-03", false, "E.M. Antiga"],
      ["2099-03-04", false, "E.M. Antiga"],
      ["2099-03-05", false, null],
    ]);
    expect(linhas.every((l) => l.criado_por === COORD)).toBe(true);
    expect(linhas[0].horario).toBe("8h às 12h");

    const escola = (
      await db.query<{ importacao_id: string; criado_por: string }>(
        `select importacao_id, criado_por from gestao.escola where nome = 'E.E. de Belmiro Braga'`,
      )
    ).rows;
    expect(escola).toEqual([{ importacao_id: primeiro, criado_por: COORD }]);
    const lote = (await db.query<{ criado_por: string; resumo: Resumo }>(`select criado_por, resumo from gestao.importacao`)).rows[0];
    expect(lote.criado_por).toBe(COORD);
    expect(lote.resumo).toEqual({ encontros: 5, pulados: 0, escolas: 1, concluidos: 1 });
  });

  it("reimportar o mesmo não cria nada nem deixa lote vazio", async () => {
    await expect(importar([nova], [enc("2099-03-02", { escola_nova: "E.E. de Belmiro Braga" })])).rejects.toThrow(
      "gestao: nada novo para importar",
    );
    expect(await contar("gestao.importacao")).toBe(1);
  });

  let segundo = "";

  it("pula o que já existe e grava o resto", async () => {
    const r = await importar([], [enc("2099-03-04", { escola_id: ANTIGA, inicio: "14:00", fim: "17:00" }), enc("2099-04-01", { escola_id: ANTIGA })]);
    segundo = String(r.id);
    expect(r).toMatchObject({ encontros: 1, pulados: 1, escolas: 0 });
  });

  it("bolsista não importa nem desfaz", async () => {
    await expect(importar([], [enc("2099-05-01")], ANA)).rejects.toMatchObject({ code: "42501" });
    await expect(desfazer(primeiro, ANA)).rejects.toMatchObject({ code: "42501" });
  });

  it("recusa desfazer se algum encontro do lote já tem equipe, e nada some", async () => {
    await como(COORD, () =>
      db.exec(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id)
               select id, '${ANA}' from gestao.agenda where importacao_id = '${segundo}'`),
    );
    await expect(desfazer(segundo)).rejects.toThrow("gestao: 1 encontro desta importação já tem equipe, aula ou relatório");
    expect(await contar(`gestao.agenda where importacao_id = '${segundo}'`)).toBe(1);
    expect(await contar(`gestao.importacao where desfeita_em is not null`)).toBe(0);
  });

  it("desfazer apaga os encontros, a escola criada sem uso e marca o lote; escola usada fora e pré-existente ficam", async () => {
    // Um encontro lançado à mão na escola nova: ela não pode sumir.
    await como(COORD, () =>
      db.exec(`insert into gestao.agenda (data, escola_id, aulas, modalidade, inicio, fim)
               select '2099-06-01', id, 'Lego', 'Lego', '08:00', '12:00' from gestao.escola where nome = 'E.E. de Belmiro Braga'`),
    );
    const r = await desfazer(primeiro);
    expect(r).toMatchObject({ apagados: 5, escolas_apagadas: 0, escolas_mantidas: 1, encontros: 5 });
    expect(await contar(`gestao.agenda where importacao_id = '${primeiro}'`)).toBe(0);
    expect(await contar(`gestao.escola where nome = 'E.E. de Belmiro Braga'`)).toBe(1);
    expect(await contar(`gestao.escola where id = '${ANTIGA}'`)).toBe(1);
    expect(await contar(`gestao.importacao where id = '${primeiro}' and desfeita_em is not null`)).toBe(1);
    await expect(desfazer(primeiro)).rejects.toThrow("gestao: esta importação já foi desfeita");
  });

  it("escola criada pelo lote e sem uso some ao desfazer", async () => {
    const r = await importar([{ nome: "Escola Saci", categoria: "outra", cidade: "Juiz de Fora" }], [enc("2099-07-01", { escola_nova: "Escola Saci" })]);
    expect(await desfazer(String(r.id))).toMatchObject({ apagados: 1, escolas_apagadas: 1, escolas_mantidas: 0 });
    expect(await contar(`gestao.escola where nome = 'Escola Saci'`)).toBe(0);
  });
});
