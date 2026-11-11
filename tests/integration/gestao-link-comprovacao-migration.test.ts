// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { gestaoAte, sqlDaMigracao, comoUsuario } from "./helpers/gestao";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Link de comprovação na nota de encerramento (20261110). Ana e Beto estão no
 * encontro; Caio não. O link é opcional, validado no banco e lido pelos colegas.
 */

// A última de novo: idempotência.
const MIGRATIONS = [...gestaoAte("20261110_gestao_link_de_comprovacao"), sqlDaMigracao("20261110_gestao_link_de_comprovacao")];

const COORD = "72000000-0000-4000-8000-000000000001";
const ANA = "72000000-0000-4000-8000-000000000002";
const BETO = "72000000-0000-4000-8000-000000000003";
const CAIO = "72000000-0000-4000-8000-000000000004";
const ESCOLA = "73000000-0000-4000-8000-000000000001";

describe("link de comprovação (20261110)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  let encontro = "";

  const como = comoUsuario(db);
  const nota = (texto: string, link?: string | null) =>
    link === undefined
      ? db.query(`select gestao.escrever_nota_encerramento($1, $2)`, [encontro, texto])
      : db.query(`select gestao.escrever_nota_encerramento($1, $2, $3)`, [encontro, texto, link]);
  const daAna = async () =>
    (
      await db.query<{ nota_encerramento: string | null; link_comprovacao: string | null }>(
        `select nota_encerramento, link_comprovacao from gestao.agenda_bolsista where agenda_id = '${encontro}' and bolsista_id = '${ANA}'`,
      )
    ).rows[0];

  beforeAll(async () => {
    const pessoas = [COORD, ANA, BETO, CAIO];
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

      insert into auth.users (id) values ${pessoas.map((p) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name, email) values
        ${pessoas.map((p, i) => `('${p}', 'Pessoa ${i}', 'p${i}@ufjf.br')`).join(", ")};
    `);
    for (const sql of MIGRATIONS) await db.exec(sql);

    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false), ('${ANA}', false, true), ('${BETO}', false, true), ('${CAIO}', false, true);
      insert into gestao.escola (id, nome, categoria, cidade) values ('${ESCOLA}', 'Escola 1', 'estadual', 'Juiz de Fora');
    `);
    encontro = (
      await db.query<{ id: string }>(
        `insert into gestao.agenda (data, escola_id, aulas, modalidade, inicio, fim)
         values ('2026-10-05', '${ESCOLA}', 'Lego', 'Lego', '08:00', '12:00') returning id`,
      )
    ).rows[0].id;
    await db.exec(
      `insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ('${encontro}', '${ANA}'), ('${encontro}', '${BETO}')`,
    );
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("sobra uma função só, e a chamada com dois argumentos continua valendo, sem link", async () => {
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
       where s.nspname = 'gestao' and p.proname = 'escrever_nota_encerramento'`,
    );
    expect(rows[0].n).toBe(1);

    await como(ANA, () => nota("Turma animada, 18 alunos."));
    expect(await daAna()).toEqual({ nota_encerramento: "Turma animada, 18 alunos.", link_comprovacao: null });
  });

  it("guarda o link sem as bordas e recusa link inválido sem mexer na nota", async () => {
    await como(ANA, async () => {
      await nota("Montamos o robô seguidor.", "  https://drive.google.com/x  ");
      await expect(nota("Outra nota qualquer.", "drive.google.com/x")).rejects.toThrow(/http:\/\/ ou https:\/\//);
      await expect(nota("Outra nota qualquer.", "https://a.org/com espaço")).rejects.toThrow(/sem espaços/);
    });
    expect(await daAna()).toEqual({ nota_encerramento: "Montamos o robô seguidor.", link_comprovacao: "https://drive.google.com/x" });
  });

  it("colega do encontro lê o link; quem é de fora não lê nada", async () => {
    const { rows } = await como(BETO, () =>
      db.query(`select link_comprovacao from gestao.agenda_bolsista where agenda_id = '${encontro}' and bolsista_id = '${ANA}'`),
    );
    expect(rows).toEqual([{ link_comprovacao: "https://drive.google.com/x" }]);

    const fora = await como(CAIO, () => db.query(`select * from gestao.agenda_bolsista where agenda_id = '${encontro}'`));
    expect(fora.rows).toHaveLength(0);
  });

  it("salvar sem link apaga o anterior", async () => {
    await como(ANA, () => nota("Montamos o robô seguidor.", ""));
    expect((await daAna()).link_comprovacao).toBeNull();
  });
});
