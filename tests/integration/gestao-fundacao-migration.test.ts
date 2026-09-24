// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Spec 003 — fundação da gestão. Prova, em PostgreSQL real, a RLS fatiada por
 * papel e por alocação, o desligamento, a proteção da última coordenação e a
 * leitura de equipe que a RLS de `user_profile` não dá à coordenação.
 */

const MIGRATIONS = [
  "supabase/migrations/20260905_gestao_modelo_operacional.sql",
  "supabase/migrations/20260905_gestao_membro_rpc.sql",
  "supabase/migrations/20260923_gestao_fundacao.sql",
].map((path) => readFileSync(path, "utf8"));

const COORD = "10000000-0000-4000-8000-000000000001";
const COORD2 = "10000000-0000-4000-8000-000000000002";
const BOLSISTA = "20000000-0000-4000-8000-000000000001";
const OUTRO_BOLSISTA = "20000000-0000-4000-8000-000000000002";
const NOVATO = "30000000-0000-4000-8000-000000000001";
const ESCOLA_A = "40000000-0000-4000-8000-00000000000a";
const ESCOLA_B = "40000000-0000-4000-8000-00000000000b";
const AGENDA_A = "50000000-0000-4000-8000-00000000000a";
const AGENDA_B = "50000000-0000-4000-8000-00000000000b";
const AULA_A = "60000000-0000-4000-8000-00000000000a";
const AULA_B = "60000000-0000-4000-8000-00000000000b";
const ALUNO_A = "70000000-0000-4000-8000-00000000000a";
const ALUNO_B = "70000000-0000-4000-8000-00000000000b";

describe("migration da fundação da gestão (spec 003)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });

  /** Executa `fn` autenticado como `uid`, sempre voltando ao superusuário. */
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

  beforeAll(async () => {
    // Mesmo molde de tests/integration/gestao-migration.test.ts, com
    // `user_profile` protegida como em produção: cada um lê só o próprio perfil.
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

      create table public.user_profile (
        id uuid primary key,
        full_name text not null,
        email text not null
      );
      alter table public.user_profile enable row level security;
      create policy "Users view own profile" on public.user_profile
        for select to authenticated using (auth.uid() = id);
      grant usage on schema public to anon, authenticated;
      grant select on public.user_profile to authenticated;

      insert into auth.users (id) values
        ('${COORD}'), ('${COORD2}'), ('${BOLSISTA}'), ('${OUTRO_BOLSISTA}'), ('${NOVATO}');
      insert into public.user_profile (id, full_name, email) values
        ('${COORD}', 'Cris Coordenação', 'cris@ufjf.br'),
        ('${COORD2}', 'Segunda Coordenação', 'coord2@ufjf.br'),
        ('${BOLSISTA}', 'Bia Bolsista', 'bia@estudante.ufjf.br'),
        ('${OUTRO_BOLSISTA}', 'Outro Bolsista', 'outro@estudante.ufjf.br'),
        ('${NOVATO}', 'Nina Novata', 'Nina.Novata@estudante.ufjf.br');
    `);

    for (const sql of MIGRATIONS) await db.exec(sql);
    // Idempotência: a nova migration roda de novo sem erro.
    await db.exec(MIGRATIONS[2]);

    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, papel) values
        ('${COORD}', 'coordenacao'),
        ('${BOLSISTA}', 'bolsista'),
        ('${OUTRO_BOLSISTA}', 'bolsista');

      insert into gestao.escola (id, nome, categoria, cidade) values
        ('${ESCOLA_A}', 'Escola A', 'estadual', 'Juiz de Fora'),
        ('${ESCOLA_B}', 'Escola B', 'estadual', 'Juiz de Fora');

      insert into gestao.aluno (id, nome, idade, escola_id, categoria_escola, ano_escolar, modalidade, execucao, cidade) values
        ('${ALUNO_A}', 'Aluno A', 14, '${ESCOLA_A}', 'estadual', '9o ano', 'lego', 'presencial', 'Juiz de Fora'),
        ('${ALUNO_B}', 'Aluno B', 15, '${ESCOLA_B}', 'estadual', '1o ano', 'lego', 'presencial', 'Juiz de Fora');

      insert into gestao.agenda (id, data, escola_id, aulas, modalidade, horario) values
        ('${AGENDA_A}', '2026-10-01', '${ESCOLA_A}', 'sensores', 'lego', '08h-10h'),
        ('${AGENDA_B}', '2026-10-02', '${ESCOLA_B}', 'motores', 'lego', '08h-10h');

      insert into gestao.agenda_bolsista (agenda_id, bolsista_id, carga) values
        ('${AGENDA_A}', '${BOLSISTA}', '2h'),
        ('${AGENDA_B}', '${OUTRO_BOLSISTA}', '2h');

      insert into gestao.aula (id, agenda_id, titulo, realizada_em) values
        ('${AULA_A}', '${AGENDA_A}', 'Sensores', '2026-10-01'),
        ('${AULA_B}', '${AGENDA_B}', 'Motores', '2026-10-02');

      insert into gestao.reserva (escola_id, onibus, dias, horarios, modalidade, numero_alunos, serie, status)
        values ('${ESCOLA_A}', true, 'quarta', '08h', 'lego', 30, '9o ano', 'confirmada');
    `);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("bolsista não apaga escola, aluno nem aula (V3 corrigido)", async () => {
    const apagadas = await como(BOLSISTA, async () => ({
      escola: await linhas(`delete from gestao.escola returning id`),
      aluno: await linhas(`delete from gestao.aluno returning id`),
      aula: await linhas(`delete from gestao.aula returning id`),
    }));
    expect(apagadas).toEqual({ escola: [], aluno: [], aula: [] });
    const restantes = await linhas<{ n: number }>(`select count(*)::int as n from gestao.escola`);
    expect(restantes[0].n).toBe(2);
  });

  it("bolsista lê só os encontros, alunos e aulas do que está alocado", async () => {
    const visto = await como(BOLSISTA, async () => ({
      agendas: await linhas<{ id: string }>(`select id::text from gestao.agenda`),
      escolas: await linhas<{ id: string }>(`select id::text from gestao.escola`),
      alunos: await linhas<{ id: string }>(`select id::text from gestao.aluno`),
      aulas: await linhas<{ id: string }>(`select id::text from gestao.aula`),
      reservas: await linhas(`select id from gestao.reserva`),
      auditoria: await linhas(`select id from gestao.registro_auditoria`),
    }));
    expect(visto.agendas).toEqual([{ id: AGENDA_A }]);
    expect(visto.escolas).toEqual([{ id: ESCOLA_A }]);
    expect(visto.alunos).toEqual([{ id: ALUNO_A }]);
    expect(visto.aulas).toEqual([{ id: AULA_A }]);
    expect(visto.reservas).toEqual([]);
    expect(visto.auditoria).toEqual([]);
  });

  it("bolsista lança presença na própria aula e é barrado na alheia", async () => {
    await como(BOLSISTA, () =>
      db.exec(`insert into gestao.presenca (aula_id, aluno_id, presente, assinatura_status)
               values ('${AULA_A}', '${ALUNO_A}', true, 'assinado')`),
    );
    await expect(
      como(BOLSISTA, () =>
        db.exec(`insert into gestao.presenca (aula_id, aluno_id, presente, assinatura_status)
                 values ('${AULA_B}', '${ALUNO_B}', true, 'assinado')`),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("equipe e busca por e-mail são só da coordenação", async () => {
    await expect(como(BOLSISTA, () => db.query(`select * from gestao.equipe()`))).rejects.toThrow(
      /apenas a coordenação/,
    );
    await expect(
      como(BOLSISTA, () => db.query(`select * from gestao.buscar_usuario_por_email('cris@ufjf.br')`)),
    ).rejects.toThrow(/apenas a coordenação/);

    const equipe = await como(COORD, () =>
      linhas<{ nome: string; papel: string }>(`select nome, papel from gestao.equipe()`),
    );
    // Nome vem de user_profile mesmo com a RLS dele fechada para a coordenação.
    expect(equipe.map((m) => m.nome).sort()).toEqual(["Bia Bolsista", "Cris Coordenação", "Outro Bolsista"]);
  });

  it("busca por e-mail é exata, sem diferença de maiúsculas, e não aceita pedaço", async () => {
    const achado = await como(COORD, () =>
      linhas<{ id: string; papel: string | null }>(
        `select id::text, papel from gestao.buscar_usuario_por_email('  nina.novata@ESTUDANTE.ufjf.br ')`,
      ),
    );
    expect(achado).toEqual([{ id: NOVATO, papel: null }]);
    const pedaco = await como(COORD, () =>
      linhas(`select * from gestao.buscar_usuario_por_email('nina')`),
    );
    expect(pedaco).toEqual([]);
  });

  it("carimba quem concedeu o papel, ignorando o valor enviado", async () => {
    await como(COORD, () =>
      db.exec(`insert into gestao.papel_membro (user_profile_id, papel, concedido_por)
               values ('${NOVATO}', 'bolsista', '${BOLSISTA}')`),
    );
    const linha = await linhas<{ concedido_por: string }>(
      `select concedido_por::text from gestao.papel_membro where user_profile_id = '${NOVATO}'`,
    );
    expect(linha[0].concedido_por).toBe(COORD);
    // Nunca alocada: pode ser removida de vez.
    await como(COORD, () => db.exec(`delete from gestao.papel_membro where user_profile_id = '${NOVATO}'`));
  });

  it("remover de vez quem já foi alocado é recusado", async () => {
    await expect(
      como(COORD, () => db.exec(`delete from gestao.papel_membro where user_profile_id = '${OUTRO_BOLSISTA}'`)),
    ).rejects.toThrow(/foreign key|restrict/i);
  });

  it("valida a bolsa no banco e mostra ao bolsista só a própria", async () => {
    await expect(
      como(COORD, () =>
        db.exec(`insert into gestao.bolsa (bolsista_id, modalidade, carga_semanal_horas, valor_mensal, inicio, fim)
                 values ('${BOLSISTA}', 'graduacao', 41, 700, '2026-03-01', '2026-12-31')`),
      ),
    ).rejects.toThrow(/check constraint/i);
    await expect(
      como(COORD, () =>
        db.exec(`insert into gestao.bolsa (bolsista_id, modalidade, carga_semanal_horas, valor_mensal, inicio, fim)
                 values ('${BOLSISTA}', 'graduacao', 20, 700, '2026-12-01', '2026-03-01')`),
      ),
    ).rejects.toThrow(/bolsa_fim_depois_inicio/);

    await como(COORD, () =>
      db.exec(`insert into gestao.bolsa (bolsista_id, modalidade, carga_semanal_horas, valor_mensal, inicio, fim) values
               ('${BOLSISTA}', 'graduacao', 20, 700, '2026-01-01', '2099-12-31'),
               ('${OUTRO_BOLSISTA}', 'graduacao', 12, 400, '2026-01-01', '2099-12-31')`),
    );
    const doBolsista = await como(BOLSISTA, () =>
      linhas<{ bolsista_id: string }>(`select bolsista_id::text from gestao.bolsa`),
    );
    expect(doBolsista).toEqual([{ bolsista_id: BOLSISTA }]);

    const equipe = await como(COORD, () =>
      linhas<{ nome: string; carga: string | null }>(
        `select nome, carga_semanal_horas::text as carga from gestao.equipe() where papel = 'bolsista' order by nome`,
      ),
    );
    expect(equipe).toEqual([
      { nome: "Bia Bolsista", carga: "20.0" },
      { nome: "Outro Bolsista", carga: "12.0" },
    ]);
  });

  it("desligar corta o acesso na hora e preserva alocação e histórico (V5 corrigido)", async () => {
    await como(COORD, () =>
      db.exec(`update gestao.papel_membro set desligado_em = now() where user_profile_id = '${OUTRO_BOLSISTA}'`),
    );
    const depois = await como(OUTRO_BOLSISTA, async () => ({
      papel: (await linhas<{ p: string | null }>(`select public.gestao_membro_papel() as p`))[0].p,
      agendas: await linhas(`select id from gestao.agenda`),
      bolsa: await linhas(`select id from gestao.bolsa`),
    }));
    expect(depois).toEqual({ papel: null, agendas: [], bolsa: [] });

    const alocacao = await linhas<{ n: number }>(
      `select count(*)::int as n from gestao.agenda_bolsista where bolsista_id = '${OUTRO_BOLSISTA}'`,
    );
    expect(alocacao[0].n).toBe(1);

    // Reativar devolve o acesso.
    await como(COORD, () =>
      db.exec(`update gestao.papel_membro set desligado_em = null where user_profile_id = '${OUTRO_BOLSISTA}'`),
    );
    const reativado = await como(OUTRO_BOLSISTA, () => linhas(`select id from gestao.agenda`));
    expect(reativado).toHaveLength(1);
  });

  it("não deixa a coordenação sem ninguém ativo", async () => {
    const tentativas = [
      `update gestao.papel_membro set desligado_em = now() where user_profile_id = '${COORD}'`,
      `update gestao.papel_membro set papel = 'bolsista' where user_profile_id = '${COORD}'`,
      `delete from gestao.papel_membro where user_profile_id = '${COORD}'`,
    ];
    for (const sql of tentativas) {
      await expect(como(COORD, () => db.exec(sql))).rejects.toThrow(/ao menos uma pessoa ativa na coordenação/);
    }

    // Com uma segunda coordenação ativa, a primeira pode sair.
    await como(COORD, () =>
      db.exec(`insert into gestao.papel_membro (user_profile_id, papel) values ('${COORD2}', 'coordenacao')`),
    );
    await como(COORD2, () =>
      db.exec(`update gestao.papel_membro set desligado_em = now() where user_profile_id = '${COORD}'`),
    );
    const semAcesso = await como(COORD, () => linhas(`select id from gestao.escola`));
    expect(semAcesso).toEqual([]);
  });

  it("anônimo e autenticado sem papel não chegam a nada", async () => {
    await db.exec(`set role anon`);
    try {
      await expect(db.query(`select id from gestao.bolsa`)).rejects.toThrow(/permission denied/i);
      await expect(db.query(`select * from gestao.equipe()`)).rejects.toThrow(/permission denied/i);
    } finally {
      await db.exec(`reset role`);
    }
    const semPapel = await como(NOVATO, async () => ({
      escola: await linhas(`select id from gestao.escola`),
      bolsa: await linhas(`select id from gestao.bolsa`),
    }));
    expect(semPapel).toEqual({ escola: [], bolsa: [] });
  });
});
