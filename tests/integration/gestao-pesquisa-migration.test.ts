// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { comoUsuario, gestaoAte, sqlDaMigracao } from "./helpers/gestao";

/**
 * Pesquisa (20261117): reuniões e produções. Bia e Leo são bolsistas;
 * Desligado saiu do projeto; Sem papel nunca entrou; Teste é a coordenação do E2E.
 */

// Sem a dos artigos (pede `public.article`, alheia a esta).
const ANTES = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
  sqlDaMigracao("20261114_gestao_numero_da_aula"),
  sqlDaMigracao("20261115_gestao_atrasos_e_metas"),
  sqlDaMigracao("20261116_gestao_espacos"),
];
const PESQUISA = sqlDaMigracao("20261117_gestao_pesquisa");

const COORD = "7e000000-0000-4000-8000-000000000001";
const BIA = "7e000000-0000-4000-8000-000000000002";
const LEO = "7e000000-0000-4000-8000-000000000003";
const DESLIGADO = "7e000000-0000-4000-8000-000000000004";
const SEM_PAPEL = "7e000000-0000-4000-8000-000000000005";
const TESTE = "7e000000-0000-4000-8000-000000000006";

/** Como criar uma linha válida e qual coluna de texto editar, por tabela. */
const TABELAS = [
  {
    tabela: "reuniao_pesquisa",
    inserir: `insert into gestao.reuniao_pesquisa (data, participantes, feito, criado_por)
              values ('2026-11-01', 'Bia e Leo', 'Leitura do artigo', $1)`,
    campo: "feito",
  },
  {
    tabela: "producao_pesquisa",
    inserir: `insert into gestao.producao_pesquisa (tipo, titulo, autores, data, criado_por)
              values ('relatorio', 'Relatório parcial', 'Bia, Leo', '2026-11-01', $1)`,
    campo: "titulo",
  },
] as const;

describe("pesquisa (20261117)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const como = comoUsuario(db);

  async function linhas<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await db.query<T>(sql, params)).rows;
  }

  beforeAll(async () => {
    const pessoas = [COORD, BIA, LEO, DESLIGADO, SEM_PAPEL, TESTE];
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

    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false), ('${BIA}', false, true), ('${LEO}', false, true),
        ('${DESLIGADO}', false, true), ('${TESTE}', true, false);
      update gestao.papel_membro set desligado_em = now() where user_profile_id = '${DESLIGADO}';
      update gestao.papel_membro set teste = true where user_profile_id = '${TESTE}';
    `);
    await db.exec(`reset request.jwt.claim.sub`);

    // Duas vezes: idempotência.
    await db.exec(PESQUISA);
    await db.exec(PESQUISA);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  describe.each(TABELAS)("$tabela", ({ tabela, inserir, campo }) => {
    const criar = (uid: string) =>
      como(uid, () =>
        linhas<{ id: string; criado_por: string; teste: boolean }>(`${inserir} returning id, criado_por::text, teste`, [COORD]),
      ).then((r) => r[0]);

    const editar = (uid: string, id: string, valor: string) =>
      como(uid, () => linhas(`update gestao.${tabela} set ${campo} = $2 where id = $1 returning id`, [id, valor]));

    it("bolsista cria; a autoria vem do banco e o registro nasce real", async () => {
      const linha = await criar(BIA);
      expect(linha.criado_por).toBe(BIA); // enviou COORD, o banco gravou quem criou
      expect(linha.teste).toBe(false);
    });

    it("membros leem; desligado e sem papel não leem nem criam", async () => {
      const { id } = await criar(LEO);
      for (const uid of [COORD, BIA, LEO]) {
        expect(await como(uid, () => linhas(`select id from gestao.${tabela} where id = $1`, [id]))).toHaveLength(1);
      }
      for (const uid of [DESLIGADO, SEM_PAPEL]) {
        expect(await como(uid, () => linhas(`select id from gestao.${tabela}`))).toEqual([]);
        await expect(criar(uid)).rejects.toThrow(/row-level security/);
      }
    });

    it("quem criou edita; outro bolsista não; a coordenação edita a de outro", async () => {
      const { id } = await criar(BIA);
      expect(await editar(BIA, id, "Texto revisto")).toHaveLength(1);
      const [datas] = await linhas<{ mudou: boolean }>(
        `select atualizado_em > criado_em as mudou from gestao.${tabela} where id = $1`,
        [id],
      );
      expect(datas.mudou).toBe(true);

      expect(await editar(LEO, id, "Texto do Leo")).toHaveLength(0);
      expect(await editar(COORD, id, "Texto da coordenação")).toHaveLength(1);
      const [linha] = await linhas<{ valor: string; criado_por: string }>(
        `select ${campo} as valor, criado_por::text from gestao.${tabela} where id = $1`,
        [id],
      );
      expect(linha).toEqual({ valor: "Texto da coordenação", criado_por: BIA });
    });

    it("quem criou não apaga; a coordenação apaga e fica na auditoria", async () => {
      const { id } = await criar(BIA);
      expect(await como(BIA, () => linhas(`delete from gestao.${tabela} where id = $1 returning id`, [id]))).toHaveLength(0);
      expect(await como(COORD, () => linhas(`delete from gestao.${tabela} where id = $1 returning id`, [id]))).toHaveLength(1);
      expect(
        await linhas(`select autor::text from gestao.registro_auditoria where tabela = $1 and registro_id = $2 and acao = 'delete'`, [
          tabela,
          id,
        ]),
      ).toEqual([{ autor: COORD }]);
    });

    it("registro do E2E e registro real não se veem (teste_separado)", async () => {
      const deTeste = await criar(TESTE);
      expect(deTeste.teste).toBe(true);
      expect(await como(BIA, () => linhas(`select id from gestao.${tabela} where id = $1`, [deTeste.id]))).toEqual([]);
      expect(await como(COORD, () => linhas(`select id from gestao.${tabela} where id = $1`, [deTeste.id]))).toEqual([]);
      const vistos = await como(TESTE, () => linhas<{ teste: boolean }>(`select teste from gestao.${tabela}`));
      expect(vistos.every((l) => l.teste)).toBe(true);
    });

    it("anônimo não tem privilégio", async () => {
      await db.exec(`set role anon`);
      try {
        await expect(db.query(`select id from gestao.${tabela}`)).rejects.toThrow(/permission denied/);
      } finally {
        await db.exec(`reset role`);
      }
    });
  });

  it("reunião: texto de 1 caractere é recusado; desdobramentos nulo passa", async () => {
    const inserir = (participantes: string, feito: string) =>
      como(BIA, () =>
        linhas(
          `insert into gestao.reuniao_pesquisa (data, participantes, feito, desdobramentos) values ('2026-11-02', $1, $2, null) returning id`,
          [participantes, feito],
        ),
      );
    await expect(inserir("B", "Leitura")).rejects.toThrow(/check/);
    await expect(inserir("Bia", "  L ")).rejects.toThrow(/check/);
    await expect(inserir("Bia", "Leitura")).resolves.toHaveLength(1);
  });

  it("produção: tipo inválido, título curto e link ftp:// são recusados; onde e link nulos passam", async () => {
    const inserir = (tipo: string, titulo: string, link: string | null) =>
      como(BIA, () =>
        linhas(
          `insert into gestao.producao_pesquisa (tipo, titulo, autores, data, onde, link)
           values ($1, $2, 'Bia', '2026-11-02', null, $3) returning id`,
          [tipo, titulo, link],
        ),
      );
    await expect(inserir("livro", "Título", null)).rejects.toThrow(/check/);
    await expect(inserir("ebook", "T", null)).rejects.toThrow(/check/);
    await expect(inserir("ebook", "Título", "ftp://exemplo.org")).rejects.toThrow(/check/);
    await expect(inserir("ebook", "Título", null)).resolves.toHaveLength(1);
    await expect(inserir("substack", "Título", "https://exemplo.org/post")).resolves.toHaveLength(1);
  });
});
