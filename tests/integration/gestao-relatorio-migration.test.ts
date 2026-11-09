// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { gestaoAntes, sqlDaMigracao, comoUsuario } from "./helpers/gestao";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Relatório (20261108). Prova em PostgreSQL real quem vê a atividade: quem
 * cadastrou e a coordenação, nunca outro bolsista nem a coordenação de teste
 * (E2E). Ninguém cadastra em nome de outro, e quem não é membro não cadastra.
 */

const MIGRATIONS = [
  ...gestaoAntes("20261108_gestao_relatorio"),
  // As do relatório duas vezes cada: idempotência.
  ...(["20261108_gestao_relatorio", "20261108_gestao_relatorio_coordenacao", "20261108_gestao_relatorio_editar", "20261108_gestao_relatorio_comprovacao"] as const)
    .flatMap((nome) => [sqlDaMigracao(nome), sqlDaMigracao(nome)]),
];

const COORD = "60000000-0000-4000-8000-000000000001";
const BIA = "60000000-0000-4000-8000-000000000002";
const CAIO = "60000000-0000-4000-8000-000000000003";
const DE_FORA = "60000000-0000-4000-8000-000000000004";
const COORD_E2E = "60000000-0000-4000-8000-000000000005";

describe("atividades privadas do relatório (20261108)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });

  const como = comoUsuario(db);

  async function nomes(uid: string): Promise<string[]> {
    const { rows } = await como(uid, () =>
      db.query<{ nome: string }>(`select nome from gestao.atividade_relatorio order by nome`),
    );
    return rows.map((r) => r.nome);
  }

  beforeAll(async () => {
    const pessoas = [COORD, BIA, CAIO, DE_FORA, COORD_E2E];
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
      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid references public.user_profile (id), channel text, type text, payload jsonb,
        read_at timestamptz, created_at timestamptz default now()
      );
      create table public.system_config (key text primary key, value text);
      grant usage on schema public to anon, authenticated;

      insert into auth.users (id) values ${pessoas.map((p) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name, email) values
        ${pessoas.map((p, i) => `('${p}', 'Pessoa ${i}', 'p${i}@ufjf.br')`).join(", ")};
    `);
    for (const sql of MIGRATIONS) await db.exec(sql);

    await db.exec(`
      set request.jwt.claim.sub = '${COORD}';
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false), ('${BIA}', false, true), ('${CAIO}', false, true);
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista, teste) values ('${COORD_E2E}', true, false, true);
      reset request.jwt.claim.sub;
    `);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("o bolsista vê só as suas; a coordenação vê as da equipe; a coordenação de teste, nenhuma", async () => {
    await como(BIA, () => db.exec(`insert into gestao.atividade_relatorio (nome, data) values ('Material da Bia', '2026-11-04')`));
    await como(COORD, () => db.exec(`insert into gestao.atividade_relatorio (nome, data) values ('Reunião da coordenação', '2026-11-05')`));

    expect(await nomes(BIA)).toEqual(["Material da Bia"]);
    expect(await nomes(CAIO)).toEqual([]);
    expect(await nomes(COORD)).toEqual(["Material da Bia", "Reunião da coordenação"]);
    expect(await nomes(COORD_E2E)).toEqual([]);
  });

  it("ninguém cadastra em nome de outra pessoa", async () => {
    await expect(
      como(CAIO, () =>
        db.exec(`insert into gestao.atividade_relatorio (user_profile_id, nome, data) values ('${BIA}', 'Forjada', '2026-11-04')`),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("quem não é da gestão não cadastra", async () => {
    await expect(
      como(DE_FORA, () => db.exec(`insert into gestao.atividade_relatorio (nome, data) values ('Intrusa', '2026-11-04')`)),
    ).rejects.toThrow(/row-level security/);
  });

  describe("editar e apagar", () => {
    // Datas pelo mês de Brasília, como a regra: dia 10 deste mês e do anterior.
    const ESTE_MES = `(date_trunc('month', now() at time zone 'America/Sao_Paulo')::date + 9)`;
    const MES_PASSADO = `(date_trunc('month', now() at time zone 'America/Sao_Paulo')::date - interval '1 month' + interval '9 days')::date`;

    async function atividade(dono: string, nome: string, data: string): Promise<string> {
      // Como superusuário: cadastrar em mês passado não é o que se testa aqui.
      return (
        await db.query<{ id: string }>(
          `insert into gestao.atividade_relatorio (user_profile_id, nome, data) values ('${dono}', '${nome}', ${data}) returning id`,
        )
      ).rows[0].id;
    }

    async function afetadas(uid: string, sql: string): Promise<number> {
      return (await como(uid, () => db.query(sql))).affectedRows ?? 0;
    }

    it("o dono edita e apaga atividade de mês aberto", async () => {
      const id = await atividade(BIA, "Aberta", ESTE_MES);
      expect(await afetadas(BIA, `update gestao.atividade_relatorio set nome = 'Aberta editada' where id = '${id}'`)).toBe(1);
      expect(await afetadas(BIA, `update gestao.atividade_relatorio set comprovacao = 'https://drive/ata' where id = '${id}'`)).toBe(1);
      expect(await afetadas(BIA, `delete from gestao.atividade_relatorio where id = '${id}'`)).toBe(1);
    });

    it("mês que terminou não muda: nem editar nem apagar", async () => {
      const id = await atividade(BIA, "Fechada", MES_PASSADO);
      expect(await afetadas(BIA, `update gestao.atividade_relatorio set nome = 'x' where id = '${id}'`)).toBe(0);
      expect(await afetadas(BIA, `update gestao.atividade_relatorio set comprovacao = 'x' where id = '${id}'`)).toBe(0);
      expect(await afetadas(BIA, `delete from gestao.atividade_relatorio where id = '${id}'`)).toBe(0);
    });

    it("a edição não leva a atividade para um mês fechado", async () => {
      const id = await atividade(BIA, "Vai voltar", ESTE_MES);
      await expect(
        como(BIA, () => db.exec(`update gestao.atividade_relatorio set data = ${MES_PASSADO} where id = '${id}'`)),
      ).rejects.toThrow(/row-level security/);
    });

    it("ninguém mexe na atividade de outra pessoa — nem a coordenação; e o dono não troca", async () => {
      const id = await atividade(BIA, "Da Bia", ESTE_MES);
      expect(await afetadas(CAIO, `update gestao.atividade_relatorio set nome = 'x' where id = '${id}'`)).toBe(0);
      expect(await afetadas(COORD, `delete from gestao.atividade_relatorio where id = '${id}'`)).toBe(0);
      await expect(
        como(BIA, () => db.exec(`update gestao.atividade_relatorio set user_profile_id = '${CAIO}' where id = '${id}'`)),
      ).rejects.toThrow(/permission denied/);
    });
  });
});
