// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { gestaoAte, sqlDaMigracao, comoUsuario } from "./helpers/gestao";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Link de comprovação direto do relatório (20261112). Ana e Beto estão no
 * encontro; Caio não. Grava só o link: nota e conclusão ficam como estavam.
 */

// Só depende da 20261110; a última de novo: idempotência.
const MIGRATIONS = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
];

const COORD = "74000000-0000-4000-8000-000000000001";
const ANA = "74000000-0000-4000-8000-000000000002";
const BETO = "74000000-0000-4000-8000-000000000003";
const CAIO = "74000000-0000-4000-8000-000000000004";
const ESCOLA = "75000000-0000-4000-8000-000000000001";

describe("link de comprovação no relatório (20261112)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  let encontro = "";
  let futuro = "";
  let cancelado = "";

  const como = comoUsuario(db);
  const link = (valor: string | null, agenda = encontro) =>
    db.query(`select gestao.escrever_link_comprovacao($1, $2)`, [agenda, valor]);
  const daAna = async () =>
    (
      await db.query<{ nota_encerramento: string | null; link_comprovacao: string | null; concluido_em: string | null }>(
        `select ab.nota_encerramento, ab.link_comprovacao, a.concluido_em
         from gestao.agenda_bolsista ab join gestao.agenda a on a.id = ab.agenda_id
         where ab.agenda_id = '${encontro}' and ab.bolsista_id = '${ANA}'`,
      )
    ).rows[0];

  const novoEncontro = async (data: string) => {
    const id = (
      await db.query<{ id: string }>(
        `insert into gestao.agenda (data, escola_id, aulas, modalidade, inicio, fim)
         values ('${data}', '${ESCOLA}', 'Lego', 'Lego', '08:00', '12:00') returning id`,
      )
    ).rows[0].id;
    await db.exec(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ('${id}', '${ANA}'), ('${id}', '${BETO}')`);
    return id;
  };

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
    encontro = await novoEncontro("2026-10-05");
    futuro = await novoEncontro("2099-01-05");
    cancelado = await novoEncontro("2026-10-06");
    await db.exec(`update gestao.agenda set cancelado_em = now(), motivo_cancelamento = 'Chuva forte' where id = '${cancelado}'`);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("grava o link sem as bordas e não escreve nota nem conclui o encontro", async () => {
    await como(ANA, () => link("  https://drive.google.com/x  "));
    expect(await daAna()).toEqual({ nota_encerramento: null, link_comprovacao: "https://drive.google.com/x", concluido_em: null });
  });

  it("com nota já escrita, troca o link e a nota fica como estava", async () => {
    await como(ANA, () =>
      db.query(`select gestao.escrever_nota_encerramento($1, $2, $3)`, [encontro, "Turma animada, 18 alunos.", "https://a.org/1"]),
    );
    await como(ANA, () => link("https://a.org/2"));
    const ana = await daAna();
    expect(ana.nota_encerramento).toBe("Turma animada, 18 alunos.");
    expect(ana.link_comprovacao).toBe("https://a.org/2");
  });

  it("recusa link inválido e o anterior permanece", async () => {
    await como(ANA, async () => {
      await expect(link("drive.google.com/x")).rejects.toThrow(/http:\/\/ ou https:\/\//);
      await expect(link("https://a.org/com espaço")).rejects.toThrow(/sem espaços/);
    });
    expect((await daAna()).link_comprovacao).toBe("https://a.org/2");
  });

  it("vazio apaga o link", async () => {
    await como(ANA, () => link("   "));
    expect((await daAna()).link_comprovacao).toBeNull();
  });

  it("quem não esteve no encontro não informa link", async () => {
    await expect(como(CAIO, () => link("https://a.org/3"))).rejects.toThrow(/só quem esteve no encontro/);
  });

  it("encontro que não começou ou cancelado não recebe link", async () => {
    await como(ANA, async () => {
      await expect(link("https://a.org/4", futuro)).rejects.toThrow(/depois da hora de início/);
      await expect(link("https://a.org/4", cancelado)).rejects.toThrow(/cancelado/);
    });
  });
});
