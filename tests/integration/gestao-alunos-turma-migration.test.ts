// @vitest-environment node
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const PREVIAS = [
  "20260905_gestao_modelo_operacional.sql", "20260905_gestao_membro_rpc.sql", "20260923_gestao_fundacao.sql",
  "20260924_gestao_melhorias.sql", "20260928_gestao_papeis_acumulados.sql", "20260928_gestao_sem_valor_na_bolsa.sql",
  "20261009_gestao_alocacao.sql", "20261009_gestao_alocacao_coberto_sem_fk.sql", "20261009_gestao_agenda_sem_escola.sql",
  "20261009_gestao_substituir_quem_ja_esta.sql", "20261009_gestao_substituto_de_fora.sql", "20261009_gestao_remover_do_encontro.sql",
  "20261009_gestao_concluir_encontro.sql", "20261009_gestao_concluir_depois_do_inicio.sql", "20261009_gestao_horas_de_quem_cobriu.sql",
  "20261009_gestao_gestor_lembrete.sql", "20261009_gestao_lembrete_no_modelo.sql",
  "20261009_gestao_buscar_usuarios.sql",
].map((nome) => readFileSync(`supabase/migrations/${nome}`, "utf8"));
const NOVA = readFileSync("supabase/migrations/20261010_gestao_alunos_turma.sql", "utf8");
const COORD = "10000000-0000-4000-8000-000000000001";
const BOLSISTA = "10000000-0000-4000-8000-000000000002";
const SEM_PAPEL = "10000000-0000-4000-8000-000000000003";
const ESCOLA = "40000000-0000-4000-8000-000000000001";

describe("matrículas de alunos da turma", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  async function como<T>(uid: string, fn: () => Promise<T>): Promise<T> {
    await db.exec("set role authenticated");
    await db.exec(`set request.jwt.claim.sub = '${uid}'`);
    try { return await fn(); } finally { await db.exec("reset role"); await db.exec("reset request.jwt.claim.sub"); }
  }
  beforeAll(async () => {
    await db.exec(`
      create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      create schema auth; create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      create table public.user_profile (id uuid primary key, full_name text not null, email text not null);
      alter table public.user_profile enable row level security;
      create policy "Users view own profile" on public.user_profile for select to authenticated using (auth.uid() = id);
      grant usage on schema public to anon, authenticated; grant select on public.user_profile to authenticated;
      insert into auth.users values ('${COORD}'), ('${BOLSISTA}'), ('${SEM_PAPEL}');
      insert into public.user_profile values ('${COORD}', 'Coordenação', 'c@x'), ('${BOLSISTA}', 'Bolsista', 'b@x'), ('${SEM_PAPEL}', 'Sem papel', 's@x');
    `);
    for (const migration of PREVIAS) await db.exec(migration);
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista) values ('${COORD}', true, false), ('${BOLSISTA}', false, true)`);
    await db.exec(`insert into gestao.escola (id, nome, categoria, cidade) values ('${ESCOLA}', 'Escola', 'estadual', 'Juiz de Fora')`);
    await db.exec("reset request.jwt.claim.sub");
    await db.exec(NOVA);
    await db.exec(NOVA);
  }, 60_000);
  afterAll(async () => db.close());

  it("coordenação cadastra aluno com dados da turma, bloqueia duplicidade ativa e mantém finalização; demais papéis não leem nem escrevem", async () => {
    const turma = await como(COORD, async () => (await db.query<{ id: string }>(`insert into gestao.turma (escola_id, nome, modalidade, inicio) values ('${ESCOLA}', 'Turma A', 'Lego', '2026-01-01') returning id`)).rows[0].id);
    let alunoId = "";
    await como(COORD, async () => {
      alunoId = (await db.query<{ id: string }>(`select gestao.cadastrar_aluno_turma('${turma}', 'Ana', 12, '7º ano') as id`)).rows[0].id;
      const linha = (await db.query<{ escola_id: string; modalidade: string; cidade: string }>(`select escola_id, modalidade, cidade from gestao.aluno where id = '${alunoId}'`)).rows[0];
      expect(linha).toEqual({ escola_id: ESCOLA, modalidade: "Lego", cidade: "Juiz de Fora" });
      await db.exec("reset role");
      await expect(db.query(`insert into gestao.matricula (turma_id, aluno_id, criado_por) values ('${turma}', '${alunoId}', '${COORD}')`)).rejects.toThrow(/duplicate key/);
      await db.exec("set role authenticated");
      const matricula = (await db.query<{ id: string }>(`select id from gestao.matricula where aluno_id = '${alunoId}'`)).rows[0].id;
      await db.query(`select gestao.finalizar_matricula('${matricula}', 'Mudou de escola')`);
      const historico = (await db.query<{ situacao: string; finalizada_por: string; motivo: string }>(`select situacao, finalizada_por, motivo from gestao.matricula where id = '${matricula}'`)).rows[0];
      expect(historico).toEqual({ situacao: "finalizada", finalizada_por: COORD, motivo: "Mudou de escola" });
      await expect(db.exec(`delete from gestao.matricula where id = '${matricula}'`)).rejects.toThrow(/permission denied/);
    });
    for (const uid of [BOLSISTA, SEM_PAPEL]) await como(uid, async () => {
      expect((await db.query(`select * from gestao.matricula`)).rows).toHaveLength(0);
      expect((await db.query(`select * from gestao.aluno where id = '${alunoId}'`)).rows).toHaveLength(0);
      await expect(db.query(`select gestao.cadastrar_aluno_turma('${turma}', 'Bia', 10, '5º ano')`)).rejects.toThrow(/apenas a coordenação/);
      await expect(db.query(`select gestao.finalizar_matricula((select id from gestao.matricula limit 1), 'Motivo')`)).rejects.toThrow(/apenas a coordenação/);
    });
    const removidos = (await db.query<{ n: number }>(`select count(*)::int as n from gestao.matricula where aluno_id = '${alunoId}'`)).rows[0].n;
    expect(removidos).toBe(1);
  });
});
