// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Spec 012 — a mesma pessoa na coordenação e como bolsista. Prova em
 * PostgreSQL real que o papel antigo é preservado, que quem tem os dois usa a
 * gestão como coordenação e é bolsista para bolsa e aviso, e que as travas da
 * spec 003 (última coordenação, ao menos um papel) continuam valendo.
 */

const ATE_AQUI = [
  "supabase/migrations/20260905_gestao_modelo_operacional.sql",
  "supabase/migrations/20260905_gestao_membro_rpc.sql",
  "supabase/migrations/20260923_gestao_fundacao.sql",
  "supabase/migrations/20260924_gestao_melhorias.sql",
].map((path) => readFileSync(path, "utf8"));
const PAPEIS = readFileSync("supabase/migrations/20260928_gestao_papeis_acumulados.sql", "utf8");

const COORD = "10000000-0000-4000-8000-000000000001";
const COORD2 = "10000000-0000-4000-8000-000000000002";
const BIA = "20000000-0000-4000-8000-000000000001";

type Papeis = { coordenacao: boolean; bolsista: boolean };

describe("migration dos papéis acumulados (spec 012)", () => {
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

  async function papeisDe(uid: string): Promise<Papeis> {
    const [linha] = await linhas<Papeis>(
      `select coordenacao, bolsista from gestao.papel_membro where user_profile_id = '${uid}'`,
    );
    return linha;
  }

  async function papelEfetivo(uid: string): Promise<string | null> {
    return como(uid, async () => (await linhas<{ p: string | null }>(`select public.gestao_membro_papel() as p`))[0].p);
  }

  let auditoriaAntes = 0;
  let atualizadoAntes = "";

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

      create table public.user_profile (id uuid primary key, full_name text not null, email text not null);
      alter table public.user_profile enable row level security;
      create policy "Users view own profile" on public.user_profile
        for select to authenticated using (auth.uid() = id);
      grant usage on schema public to anon, authenticated;
      grant select on public.user_profile to authenticated;

      create table public.notification (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.user_profile (id) on delete cascade,
        channel text check (channel in ('email', 'in-app')),
        type text,
        payload jsonb,
        read_at timestamptz,
        created_at timestamptz default now()
      );
      alter table public.notification enable row level security;
      create policy "Own notifications only" on public.notification using (user_id = auth.uid());
      grant select, insert, update on public.notification to authenticated;

      insert into auth.users (id) values ('${COORD}'), ('${COORD2}'), ('${BIA}');
      insert into public.user_profile (id, full_name, email) values
        ('${COORD}', 'Cris Coordenação', 'cris@ufjf.br'),
        ('${COORD2}', 'Segunda Coordenação', 'coord2@ufjf.br'),
        ('${BIA}', 'Bia Bolsista', 'bia@estudante.ufjf.br');
    `);

    for (const sql of ATE_AQUI) await db.exec(sql);

    // Equipe como está em produção antes da mudança: um papel por pessoa.
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, papel) values
        ('${COORD}', 'coordenacao'),
        ('${BIA}', 'bolsista');
    `);
    await db.exec(`reset request.jwt.claim.sub`);

    auditoriaAntes = (await linhas<{ n: number }>(`select count(*)::int as n from gestao.registro_auditoria`))[0].n;
    atualizadoAntes = (
      await linhas<{ t: string }>(`select atualizado_em::text as t from gestao.papel_membro where user_profile_id = '${COORD}'`)
    )[0].t;

    await db.exec(PAPEIS);
    // Idempotência: roda de novo sem erro e sem mexer no que já foi copiado.
    await db.exec(PAPEIS);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("preserva o papel de quem já estava na equipe, sem registrar ação de ninguém", async () => {
    expect(await papeisDe(COORD)).toEqual({ coordenacao: true, bolsista: false });
    expect(await papeisDe(BIA)).toEqual({ coordenacao: false, bolsista: true });
    expect(await papelEfetivo(COORD)).toBe("coordenacao");
    expect(await papelEfetivo(BIA)).toBe("bolsista");

    const auditoria = (await linhas<{ n: number }>(`select count(*)::int as n from gestao.registro_auditoria`))[0].n;
    expect(auditoria).toBe(auditoriaAntes);
    const atualizado = (
      await linhas<{ t: string }>(`select atualizado_em::text as t from gestao.papel_membro where user_profile_id = '${COORD}'`)
    )[0].t;
    expect(atualizado).toBe(atualizadoAntes);
  });

  it("a coordenação vira também bolsista: usa a gestão como coordenação e pode ter bolsa", async () => {
    await como(COORD, () => db.exec(`update gestao.papel_membro set bolsista = true where user_profile_id = '${COORD}'`));

    expect(await papelEfetivo(COORD)).toBe("coordenacao");
    await como(COORD, () =>
      db.exec(`insert into gestao.bolsa (bolsista_id, modalidade, carga_semanal_horas, valor_mensal, inicio, fim)
               values ('${COORD}', 'mestrado', 20, 1500, '2026-01-01', '2099-12-31')`),
    );
    const equipe = await como(COORD, () =>
      linhas<{ nome: string; coordenacao: boolean; bolsista: boolean; carga: string | null }>(
        `select nome, coordenacao, bolsista, carga_semanal_horas::text as carga from gestao.equipe() order by nome`,
      ),
    );
    expect(equipe).toEqual([
      { nome: "Bia Bolsista", coordenacao: false, bolsista: true, carga: null },
      { nome: "Cris Coordenação", coordenacao: true, bolsista: true, carga: "20.0" },
    ]);

    // Como bolsista, lê a própria bolsa pela mesma regra de qualquer bolsista.
    const propria = await como(COORD, () =>
      linhas<{ ok: boolean }>(`select gestao.usuario_com_papel('bolsista') as ok`),
    );
    expect(propria[0].ok).toBe(true);
  });

  it("a busca por e-mail mostra os papéis que a pessoa já tem", async () => {
    const achado = await como(COORD, () =>
      linhas<Papeis>(`select coordenacao, bolsista from gestao.buscar_usuario_por_email('BIA@estudante.ufjf.br')`),
    );
    expect(achado).toEqual([{ coordenacao: false, bolsista: true }]);
  });

  it("ninguém fica sem papel: para tirar o acesso, é desligar", async () => {
    await expect(
      como(COORD, () =>
        db.exec(`update gestao.papel_membro set bolsista = false where user_profile_id = '${BIA}'`),
      ),
    ).rejects.toThrow(/papel_membro_algum_papel/);
    expect(await papeisDe(BIA)).toEqual({ coordenacao: false, bolsista: true });
  });

  it("bolsista não dá papel a ninguém, nem a si mesmo", async () => {
    await como(BIA, () => db.exec(`update gestao.papel_membro set coordenacao = true where user_profile_id = '${BIA}'`));
    expect(await papeisDe(BIA)).toEqual({ coordenacao: false, bolsista: true });
  });

  it("o pedido de melhoria avisa quem tem coordenação ativa, inclusive quem também é bolsista", async () => {
    await como(BIA, () =>
      db.exec(`insert into gestao.melhoria (autor, titulo, area, problema, proposta)
               values ('${BIA}', 'Chamada offline', 'gestao',
                       'Na escola sem sinal a chamada não carrega.', 'Guardar no celular.')`),
    );
    const avisados = await linhas<{ user_id: string }>(
      `select user_id::text from public.notification where type = 'melhoria_nova'`,
    );
    expect(avisados).toEqual([{ user_id: COORD }]);
  });

  it("a última coordenação não sai da coordenação, mesmo sendo bolsista; com outra, sai e fica bolsista", async () => {
    await expect(
      como(COORD, () =>
        db.exec(`update gestao.papel_membro set coordenacao = false where user_profile_id = '${COORD}'`),
      ),
    ).rejects.toThrow(/ao menos uma pessoa ativa na coordenação/);

    await como(COORD, () =>
      db.exec(`insert into gestao.papel_membro (user_profile_id, coordenacao) values ('${COORD2}', true)`),
    );
    await como(COORD2, () =>
      db.exec(`update gestao.papel_membro set coordenacao = false where user_profile_id = '${COORD}'`),
    );

    expect(await papelEfetivo(COORD)).toBe("bolsista");
    await expect(como(COORD, () => db.query(`select * from gestao.equipe()`))).rejects.toThrow(/apenas a coordenação/);
    const bolsa = await como(COORD, () => linhas(`select id from gestao.bolsa`));
    expect(bolsa).toHaveLength(1);
  });
});
