// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { comoUsuario, gestaoAte, sqlDaMigracao } from "./helpers/gestao";

/**
 * Chamada dos alunos e produções no site (20261120). A turma "9º A" (Lego, 20
 * alunos) ganha lista; Ana está no encontro, Caio não.
 */

// Sem a dos artigos (pede `public.article`). A última de novo: idempotência.
const MIGRATIONS = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
  sqlDaMigracao("20261114_gestao_numero_da_aula"),
  sqlDaMigracao("20261115_gestao_atrasos_e_metas"),
  sqlDaMigracao("20261116_gestao_espacos"),
  sqlDaMigracao("20261117_gestao_pesquisa"),
  sqlDaMigracao("20261119_gestao_horas_alocadas"),
  sqlDaMigracao("20261119_gestao_cursos_da_turma"),
  sqlDaMigracao("20261120_gestao_producoes_no_site"),
  sqlDaMigracao("20261120_gestao_chamada"),
  sqlDaMigracao("20261120_gestao_producoes_no_site"),
  sqlDaMigracao("20261120_gestao_chamada"),
  sqlDaMigracao("20261121_gestao_artigo_e_do_site"),
  sqlDaMigracao("20261121_gestao_artigo_e_do_site"),
];

const COORD = "7c000000-0000-4000-8000-000000000001";
const ANA = "7c000000-0000-4000-8000-000000000002";
const CAIO = "7c000000-0000-4000-8000-000000000003";
const ESCOLA = "7d000000-0000-4000-8000-000000000001";
const TURMA = "7d000000-0000-4000-8000-000000000002";

describe("chamada e produções no site (20261120)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const como = comoUsuario(db);

  const definir = (nomes: string[], atualizar = true) =>
    como(COORD, async () =>
      (await db.query<{ n: number }>(`select gestao.definir_alunos($1, $2, $3) as n`, [TURMA, nomes, atualizar])).rows[0].n,
    );
  const ativos = async () =>
    (
      await db.query<{ nome: string }>(
        `select nome from gestao.aluno_turma where turma_id = $1 and ativo order by nome`,
        [TURMA],
      )
    ).rows.map((r) => r.nome);
  const nAlunos = async () =>
    (await db.query<{ n: number | null }>(`select n_alunos as n from gestao.turma_curso where turma_id = $1`, [TURMA])).rows[0].n;
  const idDe = async (nome: string) =>
    (await db.query<{ id: string }>(`select id from gestao.aluno_turma where turma_id = $1 and nome = $2`, [TURMA, nome])).rows[0].id;

  async function encontro(data: string): Promise<string> {
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    try {
      const id = (
        await db.query<{ id: string }>(
          `insert into gestao.agenda (data, escola_id, turma_id, aulas, modalidade, inicio, fim)
           values ($1, $2, $3, 'Lego', 'Lego', '08:00', '12:00') returning id`,
          [data, ESCOLA, TURMA],
        )
      ).rows[0].id;
      await db.query(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ($1, $2)`, [id, ANA]);
      return id;
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

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
        ('${ESCOLA}', 'Escola real', 'estadual', 'Juiz de Fora', false);
      insert into gestao.turma (id, escola_id, nome, modalidade, inicio, n_alunos) values
        ('${TURMA}', '${ESCOLA}', '9º A', 'Lego', '2026-03-01', 20);
    `);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("lista vazia não mexe no número de alunos; com nomes, o número vira o total", async () => {
    expect(await definir([])).toBe(0);
    expect(await nAlunos()).toBe(20);
    expect(await definir(["Bia", " Caio ", "bia", "", "Duda"])).toBe(3);
    expect(await ativos()).toEqual(["Bia", "Caio", "Duda"]);
    expect(await nAlunos()).toBe(3);
  });

  it("trocar a lista desativa quem saiu e reativa quem voltou; sem atualizar, o número fica", async () => {
    await como(COORD, () => db.query(`update gestao.turma_curso set n_alunos = 40 where turma_id = $1`, [TURMA]));
    expect(await definir(["Bia", "Eva"], false)).toBe(2);
    expect(await ativos()).toEqual(["Bia", "Eva"]);
    expect(await nAlunos()).toBe(40);
    expect(await definir(["Bia", "Caio", "Eva"])).toBe(3);
    expect(await ativos()).toEqual(["Bia", "Caio", "Eva"]);
  });

  it("só a coordenação define a lista", async () => {
    await expect(
      como(ANA, () => db.query(`select gestao.definir_alunos($1, $2)`, [TURMA, ["Zé"]])),
    ).rejects.toThrow(/só a coordenação/);
  });

  it("chamada: quem esteve desmarca quem faltou; grava faltas e presentes, e refaz por cima", async () => {
    const id = await encontro("2026-10-05");
    const caio = await idDe("Caio");
    const eva = await idDe("Eva");
    expect(await como(ANA, async () => (await db.query(`select id from gestao.aluno_turma`)).rows.length)).toBe(4);

    await como(ANA, () => db.query(`select gestao.registrar_chamada($1, $2)`, [id, [caio, eva]]));
    const presentes = async () => (await db.query<{ p: number }>(`select presentes as p from gestao.agenda where id = $1`, [id])).rows[0].p;
    expect(await presentes()).toBe(1);
    await como(ANA, () => db.query(`select gestao.registrar_chamada($1, $2)`, [id, [eva]]));
    expect(await presentes()).toBe(2);
    expect(await como(ANA, async () => (await db.query(`select aluno_id from gestao.falta_aluno`)).rows)).toEqual([{ aluno_id: eva }]);

    // Eva sai da lista: refazer a chamada não apaga a falta que ela já tinha.
    await definir(["Bia", "Caio"]);
    await como(ANA, () => db.query(`select gestao.registrar_chamada($1, $2)`, [id, [caio]]));
    const faltas = await como(ANA, async () =>
      (await db.query<{ aluno_id: string }>(`select aluno_id from gestao.falta_aluno order by aluno_id`)).rows.map((r) => r.aluno_id),
    );
    expect(faltas.sort()).toEqual([caio, eva].sort());
    expect(await presentes()).toBe(1);
    await definir(["Bia", "Caio", "Eva"]);
  });

  it("encontro que não existe diz isso", async () => {
    await expect(
      como(ANA, () => db.query(`select gestao.registrar_chamada($1, $2)`, ["7e000000-0000-4000-8000-000000000000", []])),
    ).rejects.toThrow(/encontro não encontrado/);
  });

  it("chamada recusa quem não esteve, aluno de fora da lista e escrita direta nas faltas", async () => {
    const id = await encontro("2026-10-06");
    const bia = await idDe("Bia");
    await expect(como(CAIO, () => db.query(`select gestao.registrar_chamada($1, $2)`, [id, [bia]]))).rejects.toThrow(
      /só quem esteve no encontro ou a coordenação/,
    );
    const fora = await como(COORD, async () => {
      await db.query(`select gestao.definir_alunos($1, $2)`, [TURMA, ["Bia", "Caio", "Eva", "Gil"]]);
      await db.query(`select gestao.definir_alunos($1, $2)`, [TURMA, ["Bia", "Caio", "Eva"]]);
      return idDe("Gil");
    });
    await expect(como(ANA, () => db.query(`select gestao.registrar_chamada($1, $2)`, [id, [fora]]))).rejects.toThrow(
      /fora da lista/,
    );
    await expect(
      como(ANA, () => db.query(`insert into gestao.falta_aluno (agenda_id, aluno_id) values ($1, $2)`, [id, bia])),
    ).rejects.toThrow(/permission denied/);
  });

  it("artigo não é mais tipo de produção: é o do site", async () => {
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    try {
      await expect(
        db.query(`insert into gestao.producao_pesquisa (tipo, titulo, autores, data) values ('artigo_publicado', 'X', 'Ana', '2026-11-01')`),
      ).rejects.toThrow(/check/);
    } finally {
      await db.exec(`reset request.jwt.claim.sub`);
    }
  });

  it("produções: o visitante lê todas menos as do E2E; vídeo é tipo válido", async () => {
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.producao_pesquisa (tipo, titulo, autores, data, link, teste) values
        ('video', 'Robótica na escola', 'Ana e Bia', '2026-11-01', 'https://youtu.be/x', false),
        ('substack', 'Post antigo', 'Caio', '2026-10-01', null, false),
        ('ebook', 'Do E2E', 'Teste', '2026-11-02', null, true);
    `);
    await db.exec(`reset request.jwt.claim.sub`);
    await db.exec(`set role anon`);
    try {
      const { rows } = await db.query<{ titulo: string; tipo: string }>(`select titulo, tipo from public.producoes_do_site()`);
      expect(rows).toEqual([
        { titulo: "Robótica na escola", tipo: "video" },
        { titulo: "Post antigo", tipo: "substack" },
      ]);
    } finally {
      await db.exec(`reset role`);
    }
  });
});
