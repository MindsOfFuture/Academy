// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Spec 014 — alocação de bolsistas nos encontros. A regra de validação do card
 * é lançar a amostra real do levantamento (docs/plans/levantamento-alocacao.md)
 * inteira e ver a carga bater; o resto prova as exceções, o histórico com antes
 * e depois e que nada que valeu é apagado.
 */

const MIGRATIONS = [
  "supabase/migrations/20260905_gestao_modelo_operacional.sql",
  "supabase/migrations/20260905_gestao_membro_rpc.sql",
  "supabase/migrations/20260923_gestao_fundacao.sql",
  "supabase/migrations/20260924_gestao_melhorias.sql",
  "supabase/migrations/20260928_gestao_papeis_acumulados.sql",
  "supabase/migrations/20260928_gestao_sem_valor_na_bolsa.sql",
].map((path) => readFileSync(path, "utf8"));
const ALOCACAO = readFileSync("supabase/migrations/20261009_gestao_alocacao.sql", "utf8");
const COBERTO_SEM_FK = readFileSync("supabase/migrations/20261009_gestao_alocacao_coberto_sem_fk.sql", "utf8");

const COORD = "10000000-0000-4000-8000-000000000001";
const A = (n: number) => `a0000000-0000-4000-8000-00000000000${n}`;
const B = (n: number) => `b0000000-0000-4000-8000-00000000000${n}`;
const ESCOLA = "40000000-0000-4000-8000-000000000001";
const ESCOLA2 = "40000000-0000-4000-8000-000000000002";

describe("migration da alocação (spec 014)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });

  async function como<T>(uid: string, fn: () => Promise<T>): Promise<T> {
    await db.exec(`set role authenticated`);
    await db.exec(`set request.jwt.claim.sub = '${uid}'`);
    try {
      return await fn();
    } finally {
      await db.exec(`reset role`);
      await db.exec(`reset request.jwt.claim.sub`);
    }
  }

  async function linhas<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    return (await db.query<T>(sql)).rows;
  }

  async function um<T = Record<string, unknown>>(sql: string): Promise<T> {
    return (await linhas<T>(sql))[0];
  }

  async function turma(nome: string, modalidade: string, escola = ESCOLA): Promise<string> {
    return (
      await um<{ id: string }>(
        `insert into gestao.turma (escola_id, nome, modalidade, inicio)
         values ('${escola}', '${nome}', '${modalidade}', '2026-09-01') returning id`,
      )
    ).id;
  }

  /** Uma linha da mensagem de alocação: encontro + equipe. */
  async function encontro(
    data: string,
    inicio: string,
    fim: string,
    modalidade: string,
    equipe: string[],
    turmaId: string | null,
  ): Promise<string> {
    const { id } = await um<{ id: string }>(
      `insert into gestao.agenda (data, escola_id, turma_id, aulas, modalidade, inicio, fim)
       values ('${data}', '${ESCOLA}', ${turmaId ? `'${turmaId}'` : "null"}, '${modalidade}', '${modalidade}', '${inicio}', '${fim}')
       returning id`,
    );
    for (const pessoa of equipe) {
      await db.exec(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ('${id}', '${pessoa}')`);
    }
    return id;
  }

  async function horas(bolsista: string, de: string, ate: string): Promise<number> {
    const { h } = await um<{ h: string }>(
      `select coalesce(sum(horas), 0)::text as h from gestao.v_carga
       where bolsista_id = '${bolsista}' and data between '${de}' and '${ate}'`,
    );
    return Number(h);
  }

  async function alocacao(agenda: string, bolsista: string): Promise<string> {
    return (
      await um<{ id: string }>(
        `select id from gestao.agenda_bolsista where agenda_id = '${agenda}' and bolsista_id = '${bolsista}'`,
      )
    ).id;
  }

  beforeAll(async () => {
    const pessoas = [COORD, ...[1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((n) => [A(n), B(n)])];
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
      alter table public.user_profile enable row level security;
      create policy "Users view own profile" on public.user_profile
        for select to authenticated using (auth.uid() = id);
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
    await db.exec(ALOCACAO);
    await db.exec(COBERTO_SEM_FK);
    // Idempotência.
    await db.exec(ALOCACAO);
    await db.exec(COBERTO_SEM_FK);

    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values
        ('${COORD}', true, false),
        ${pessoas.slice(1).map((p) => `('${p}', false, true)`).join(", ")};
      insert into gestao.escola (id, nome, categoria, cidade) values
        ('${ESCOLA}', 'Escola 1', 'estadual', 'Juiz de Fora'),
        ('${ESCOLA2}', 'Escola 2', 'estadual', 'Juiz de Fora');
    `);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("amostra 1 do levantamento (21/09 a 02/10) cabe inteira e a carga bate", async () => {
    await como(COORD, async () => {
      const legoSeg = await turma("Lego segunda", "Lego");
      const legoTer = await turma("Lego competição", "Lego");
      const ia = await turma("IA + empreendedorismo", "IA");
      const ef = await turma("Educação Financeira", "Educação Financeira");

      await encontro("2026-09-21", "13:00", "17:00", "Lego", [A(1), A(2), A(3), A(4), A(5)], legoSeg);
      await encontro("2026-09-22", "13:00", "17:00", "Lego (competição)", [A(1), A(2), A(6), A(7), A(8)], legoTer);
      await encontro("2026-09-24", "08:00", "12:00", "IA + empreendedorismo", [A(5), A(9), A(7), A(6), A(8)], ia);
      await encontro("2026-09-28", "13:00", "14:00", "Lego", [A(1), A(2), A(3), A(4), A(5)], legoSeg);
      await encontro("2026-09-29", "08:00", "12:00", "Educação Financeira", [A(9), A(3), A(6), A(7), A(8)], ef);
      await encontro("2026-09-30", "08:00", "12:00", "Educação Financeira (encerramento)", [A(5), A(9), A(4), A(7), A(8)], ef);
      await encontro("2026-10-01", "08:00", "12:00", "IA + empreendedorismo", [A(5), A(9), A(7), A(6), A(8)], ia);
      await encontro("2026-10-02", "09:30", "12:00", "Apresentação Saci", [A(5), A(3), A(4), A(6), A(9)], null);
    });

    // Tabela "Carga no período" do levantamento.
    const esperado: Record<number, number> = { 1: 9, 2: 9, 3: 11.5, 4: 11.5, 5: 19.5, 6: 18.5, 7: 20, 8: 20, 9: 18.5 };
    for (const [n, h] of Object.entries(esperado)) {
      expect(await horas(A(Number(n)), "2026-09-21", "2026-10-02"), `A${n}`).toBe(h);
    }

    const { horario } = await um<{ horario: string }>(`select horario from gestao.agenda where data = '2026-10-02'`);
    expect(horario).toBe("9h30 às 12h");
  });

  it("amostra 2: chegada atrasada fica parcial, com quem cobriu, e a tarefa sem turma conta", async () => {
    await como(COORD, async () => {
      const lego = await turma("Lego 2", "Lego");
      // "Organizar as caixas" não tinha fim na mensagem; a coordenação informa ao lançar.
      await encontro("2026-10-05", "10:00", "12:00", "Organizar as caixas", [B(1), B(2)], null);
      await encontro("2026-10-05", "13:00", "17:00", "Lego", [B(3), B(4), B(5), B(6), B(7)], lego);
      const terca = await encontro("2026-10-06", "13:00", "17:00", "Lego (competição)", [B(2), B(5), B(6), B(8), B(4)], lego);
      await encontro("2026-10-08", "08:00", "12:00", "IA", [B(9), B(1), B(3), B(8)], null);

      await db.exec(
        `update gestao.agenda_bolsista set inicio = '14:00', fim = '17:00', coberto_por = '${B(2)}',
           motivo = 'aula na faculdade até 14h'
         where agenda_id = '${terca}' and bolsista_id = '${B(4)}'`,
      );
      const { carga } = await um<{ carga: string }>(
        `select carga from gestao.agenda_bolsista where agenda_id = '${terca}' and bolsista_id = '${B(4)}'`,
      );
      expect(carga).toBe("3h");
    });

    expect(await horas(B(4), "2026-10-05", "2026-10-09")).toBe(7);
    expect(await horas(B(2), "2026-10-05", "2026-10-09")).toBe(6);
  });

  it("alocação aponta para a equipe por uma relação só, e quem cobriu precisa ser da equipe", async () => {
    // Duas chaves para `papel_membro` tornam ambíguo o embed do indicador 6 no
    // PostgREST ("more than one relationship was found") e derrubam a tela "Hoje".
    const { n } = await um<{ n: number }>(
      `select count(*)::int as n from pg_constraint
       where contype = 'f' and conrelid = 'gestao.agenda_bolsista'::regclass
         and confrelid = 'gestao.papel_membro'::regclass`,
    );
    expect(n).toBe(1);

    await como(COORD, async () => {
      const id = await encontro("2026-10-22", "13:00", "17:00", "Lego", [B(1)], null);
      await expect(
        db.exec(
          `update gestao.agenda_bolsista set coberto_por = '30000000-0000-4000-8000-000000000099' where agenda_id = '${id}'`,
        ),
      ).rejects.toThrow(/precisa ser da equipe/);
    });
  });

  it("encontro sem fim e parcial fora do horário são recusados", async () => {
    await como(COORD, async () => {
      await expect(
        db.exec(
          `insert into gestao.agenda (data, escola_id, aulas, modalidade, inicio)
           values ('2026-10-20', '${ESCOLA}', 'x', 'Lego', '10:00')`,
        ),
      ).rejects.toThrow(/início e o fim/);

      const id = await encontro("2026-10-21", "13:00", "17:00", "Lego", [B(1)], null);
      await expect(
        db.exec(`update gestao.agenda_bolsista set inicio = '12:00', fim = '15:00' where agenda_id = '${id}'`),
      ).rejects.toThrow(/caber dentro do encontro/);
    });
  });

  it("falta, substituição e retirada: a hora vai para quem esteve", async () => {
    await como(COORD, async () => {
      const id = await encontro("2026-09-15", "08:00", "12:00", "Lego", [B(5), B(6), B(7)], null);

      await db.exec(`update gestao.agenda_bolsista set situacao = 'faltou_sem_aviso' where id = '${await alocacao(id, B(5))}'`);
      await db.query(`select gestao.substituir_alocacao($1, $2, 'afastamento')`, [await alocacao(id, B(6)), B(8)]);
      await expect(
        db.exec(`update gestao.agenda_bolsista set situacao = 'retirada' where id = '${await alocacao(id, B(7))}'`),
      ).rejects.toThrow(/retirada_com_motivo/);

      // Trocar a pessoa da alocação não vale: o histórico precisa dizer quem saiu.
      await db.exec(`update gestao.agenda_bolsista set bolsista_id = '${B(9)}' where id = '${await alocacao(id, B(7))}'`);
    });

    expect(await horas(B(5), "2026-09-15", "2026-09-15")).toBe(0);
    expect(await horas(B(6), "2026-09-15", "2026-09-15")).toBe(0);
    expect(await horas(B(8), "2026-09-15", "2026-09-15")).toBe(4);
    expect(await horas(B(7), "2026-09-15", "2026-09-15")).toBe(4);
    const substituida = await um<{ situacao: string; coberto_por: string }>(
      `select situacao, coberto_por from gestao.agenda_bolsista ab
       join gestao.agenda a on a.id = ab.agenda_id where a.data = '2026-09-15' and bolsista_id = '${B(6)}'`,
    );
    expect(substituida).toEqual({ situacao: "substituida", coberto_por: B(8) });
  });

  it("turma que não abriu, encontro cancelado e encontro futuro não contam, e continuam visíveis", async () => {
    await como(COORD, async () => {
      const t = await turma("Não abriu", "Lego", ESCOLA2);
      await encontro("2026-09-10", "08:00", "12:00", "Lego", [B(9)], t);
      await expect(db.exec(`update gestao.turma set status = 'nao_abriu' where id = '${t}'`)).rejects.toThrow(
        /nao_abriu_com_motivo/,
      );
      await db.exec(`update gestao.turma set status = 'nao_abriu', motivo = 'escola não confirmou' where id = '${t}'`);

      const cancelado = await encontro("2026-09-11", "08:00", "12:00", "Lego", [B(9)], null);
      await expect(
        db.exec(`update gestao.agenda set cancelado_em = now() where id = '${cancelado}'`),
      ).rejects.toThrow(/motivo/);
      await db.exec(
        `update gestao.agenda set cancelado_em = now(), motivo_cancelamento = 'chuva' where id = '${cancelado}'`,
      );
      await expect(
        db.exec(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ('${cancelado}', '${B(8)}')`),
      ).rejects.toThrow(/cancelado/);

      await encontro("2999-01-04", "08:00", "12:00", "Lego", [B(9)], null);
    });

    expect(await horas(B(9), "2026-09-10", "2026-09-11")).toBe(0);
    expect(await horas(B(9), "2999-01-01", "2999-12-31")).toBe(0);
    const { n } = await um<{ n: number }>(
      `select count(*)::int as n from gestao.v_carga where bolsista_id = '${B(9)}' and data between '2026-09-10' and '2026-09-11'`,
    );
    expect(n).toBe(2);
  });

  it("histórico guarda quem, quando, antes e depois — e ninguém o escreve à mão", async () => {
    const id = await como(COORD, async () => {
      const agenda = await encontro("2026-09-16", "08:00", "12:00", "Lego", [B(1)], null);
      const aloc = await alocacao(agenda, B(1));
      await db.exec(`update gestao.agenda_bolsista set situacao = 'faltou_avisou' where id = '${aloc}'`);
      return aloc;
    });

    const registro = await um<{ autor: string; antes: { situacao: string }; depois: { situacao: string } }>(
      `select autor, antes, depois from gestao.registro_auditoria
       where tabela = 'agenda_bolsista' and registro_id = '${id}' and acao = 'update'`,
    );
    expect(registro.autor).toBe(COORD);
    expect(registro.antes.situacao).toBe("prevista");
    expect(registro.depois.situacao).toBe("faltou_avisou");

    await como(COORD, async () => {
      await expect(
        db.exec(
          `insert into gestao.registro_auditoria (tabela, registro_id, acao, autor)
           values ('agenda', '${id}', 'delete', '${COORD}')`,
        ),
      ).rejects.toThrow(/permission denied/);
    });
  });

  it("encerrar, nunca apagar: nem a coordenação apaga encontro, alocação ou turma", async () => {
    await como(COORD, async () => {
      for (const tabela of ["agenda", "agenda_bolsista", "turma", "afastamento"]) {
        await expect(db.exec(`delete from gestao.${tabela}`), tabela).rejects.toThrow(/permission denied/);
      }
    });
  });

  it("bolsista não cria turma, não aloca e não vê afastamento", async () => {
    await como(COORD, async () => {
      await db.exec(
        `insert into gestao.afastamento (bolsista_id, inicio, fim, motivo) values ('${B(3)}', '2026-10-10', '2026-10-20', 'provas')`,
      );
    });
    await como(B(1), async () => {
      await expect(
        db.exec(`insert into gestao.turma (escola_id, nome, modalidade, inicio) values ('${ESCOLA}', 'X', 'Lego', '2026-10-01')`),
      ).rejects.toThrow(/row-level security/);
      const agenda = (await um<{ id: string }>(`select agenda_id as id from gestao.agenda_bolsista limit 1`)).id;
      await expect(
        db.exec(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ('${agenda}', '${A(1)}')`),
      ).rejects.toThrow(/row-level security/);
      expect(await linhas(`select * from gestao.afastamento`)).toHaveLength(0);
    });
  });
});
