// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

/**
 * Lembrete de etapas do Empreenda+ (20261119, spec 027). Só o papel
 * gestao_lembrete lê e marca; o link de parar funciona sem login.
 */
const PROGRESSO = readFileSync("supabase/migrations/20261113_lg2_progresso.sql", "utf8");
const MIGRATION = readFileSync("supabase/migrations/20261119_lg2_lembretes.sql", "utf8");
const NOMES_SIMPLES = readFileSync("supabase/migrations/20261120_lg2_lembretes_nomes_simples.sql", "utf8");

const ANA = "8b000000-0000-4000-8000-000000000001"; // 2 etapas pela jornada, parada há 5 dias
const BETO = "8b000000-0000-4000-8000-000000000002"; // só eventos (sem progresso salvo), parado
const CRIS = "8b000000-0000-4000-8000-000000000003"; // concluiu as 10
const DUDA = "8b000000-0000-4000-8000-000000000004"; // usou ontem
const EDU = "8b000000-0000-4000-8000-000000000005"; // nunca abriu o LG2
const FABI = "8b000000-0000-4000-8000-000000000006"; // jornada com texto quebrado
const GABI = "8b000000-0000-4000-8000-000000000007"; // conta escondida da antiga entrada de teste
const PESSOAS = [ANA, BETO, CRIS, DUDA, EDU, FABI, GABI];

// Terça, 17/11/2026, 14h em Brasília (17h UTC).
const AGORA = "2026-11-17T17:00:00Z";
const dias = (n: number, base = AGORA) => new Date(Date.parse(base) + n * 86_400_000).toISOString();

type Pendente = {
  user_id: string;
  email: { from: string; to: string[]; subject: string; html: string; text: string; headers: Record<string, string> };
};

describe("lembrete de etapas do Empreenda+ (20261119)", () => {
  const db = new PGlite();

  async function comoLembrete<T>(fn: () => Promise<T>): Promise<T> {
    await db.exec("set role gestao_lembrete");
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
    }
  }
  const pendentes = (agora = AGORA, redir = "") =>
    comoLembrete(async () =>
      (
        await db.query<Pendente>(
          "select user_id::text, email from public.lg2_lembretes_pendentes('Minds <a@b>', 'https://academy.test/', $1, $2::timestamptz)",
          [redir, agora],
        )
      ).rows,
    );
  const marcar = (id: string, quando: string) =>
    db.exec(`insert into public.lg2_lembrete_enviado (user_id, enviado_em) values ('${id}', '${quando}')`);
  const evento = (uid: string, nome: string, modulo: number, quando: string) =>
    db.exec(
      `insert into public.telemetry_learning_event (user_id, event_name, metadata, occurred_at)
       values ('${uid}', '${nome}', '{"modulo": ${modulo}}', '${quando}')`,
    );

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
      grant usage on schema public to anon, authenticated;

      create table public.user_profile (id uuid primary key, full_name text, email text);
      alter table public.user_profile enable row level security;
      create table public.telemetry_learning_event (
        event_id uuid primary key default gen_random_uuid(),
        user_id uuid,
        event_name text not null,
        metadata jsonb not null default '{}',
        occurred_at timestamptz not null default now()
      );
      alter table public.telemetry_learning_event enable row level security;

      insert into auth.users (id) values ${PESSOAS.map((p) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name, email) values
        ('${ANA}', 'Ana<b>Souza</b> Lima', 'ana@x.br'),
        ('${BETO}', '', 'beto@x.br'),
        ('${CRIS}', 'Cris', 'cris@x.br'),
        ('${DUDA}', 'Duda', 'duda@x.br'),
        ('${EDU}', 'Edu', 'edu@x.br'),
        ('${FABI}', 'Fabi', 'fabi@x.br'),
        ('${GABI}', 'Gabi', 'teste+4e19b50b@teste.mindsofthefuture.com.br');
    `);
    await db.exec(PROGRESSO);
    await db.exec(MIGRATION);
    await db.exec(MIGRATION); // idempotente
    await db.exec(NOMES_SIMPLES);
    await db.exec(NOMES_SIMPLES); // idempotente

    // A jornada guarda cada chave do localStorage como texto JSON.
    const jornada = (feitos: number[]) => JSON.stringify(JSON.stringify({ v: 1, feitos, atual: 1 }));
    await db.exec(`
      insert into public.lg2_progresso (user_id, dados, atualizado_em) values
        ('${ANA}', '{"lg2-jornada": ${jornada([1, 2])}}', '${dias(-5)}'),
        ('${CRIS}', '{"lg2-jornada": ${jornada([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])}}', '${dias(-5)}'),
        ('${DUDA}', '{"lg2-jornada": ${jornada([1])}}', '${dias(-1)}'),
        ('${FABI}', '{"lg2-jornada": "{quebrado"}', '${dias(-4)}');
    `);
    await evento(ANA, "lg2_module_completed", 3, dias(-6)); // concluiu a 3 fora da jornada
    await evento(BETO, "lg2_module_opened", 1, dias(-10));
    await evento(DUDA, "lg2_module_opened", 2, dias(-1));
    await evento(GABI, "lg2_module_opened", 1, dias(-10)); // parada, mas e-mail inventado
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("escolhe só quem parou com etapas faltando, e monta o e-mail certo", async () => {
    const r = await pendentes();
    expect(r.map((x) => x.user_id)).toEqual([ANA, BETO, FABI]);

    const ana = r[0].email;
    expect(ana.to).toEqual(["ana@x.br"]);
    expect(ana.from).toBe("Minds <a@b>");
    expect(ana.subject).toBe("Sua trilha no Empreenda+ está esperando por você");
    // Junta jornada (1, 2) e evento (3); faltam 4 a 10.
    expect(ana.html).toContain("<strong>3 de 10 etapas</strong>");
    expect(ana.html).toContain("Etapa 4: Produto, por que comprar de você e teste da ideia");
    expect(ana.html).not.toContain("proposta de valor");
    expect(ana.html).not.toContain("Etapa 3:");
    expect(ana.html).toContain("Olá, Ana&#60;b&#62;Souza&#60;/b&#62;!");
    expect(ana.html).not.toContain("<b>Souza");
    expect(ana.html).toContain('href="https://academy.test/lg2/jornada/index.html"');
    expect(ana.html).toMatch(/https:\/\/academy\.test\/lembretes\/sair\?t=[0-9a-f-]{36}/);
    expect(ana.html).toContain("FACC/UFJF");
    expect(ana.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(ana.headers["List-Unsubscribe"]).toMatch(/^<https:\/\/academy\.test\/api\/lembretes\/sair\?t=[0-9a-f-]{36}>$/);
    expect(ana.text).toContain("Você já concluiu 3 de 10 etapas");

    const beto = r[1].email;
    expect(beto.html).toContain("Olá, tudo bem!");
    expect(beto.html).toContain("ainda não concluiu nenhuma etapa");
    expect(beto.html).toContain("Etapa 1: Você e a sua ideia de negócio");
  });

  it("redireciona tudo quando RESEND_TEST_RECIPIENT está preenchida", async () => {
    const r = await pendentes(AGORA, "teste@x.br");
    expect(new Set(r.flatMap((x) => x.email.to))).toEqual(new Set(["teste@x.br"]));
  });

  it("não envia fora do horário de Brasília", async () => {
    expect(await pendentes("2026-11-17T23:30:00Z")).toEqual([]); // 20h30
    expect(await pendentes("2026-11-17T11:00:00Z")).toEqual([]); // 8h
  });

  it("3 lembretes no máximo por período parado; voltar a usar zera", async () => {
    await comoLembrete(() => db.query("select public.lg2_marcar_lembrete_enviado($1)", [ANA]).then(() => undefined));
    await db.exec(`update public.lg2_lembrete_enviado set enviado_em = '${dias(-1)}' where user_id = '${ANA}'`);
    expect((await pendentes()).map((x) => x.user_id)).not.toContain(ANA); // 1º há 1 dia

    expect((await pendentes(dias(7))).map((x) => x.user_id)).toContain(ANA); // 7 dias depois do 1º
    await marcar(ANA, dias(7));
    expect((await pendentes(dias(14))).map((x) => x.user_id)).not.toContain(ANA);
    const terceiro = (await pendentes(dias(22))).find((x) => x.user_id === ANA);
    expect(terceiro?.email.subject).toBe("Último lembrete: seu plano de negócio no Empreenda+");
    await marcar(ANA, dias(22));
    expect((await pendentes(dias(60))).map((x) => x.user_id)).not.toContain(ANA);

    // Voltou a usar depois dos lembretes: novo período, começa do 1º.
    await evento(ANA, "lg2_module_opened", 4, dias(61));
    expect((await pendentes(dias(63))).map((x) => x.user_id)).not.toContain(ANA);
    const denovo = (await pendentes(dias(65))).find((x) => x.user_id === ANA);
    expect(denovo?.email.subject).toBe("Sua trilha no Empreenda+ está esperando por você");
  });

  it("assunto de quem está perto do fim", async () => {
    await evento(BETO, "lg2_module_completed", 1, dias(-10));
    for (const m of [2, 3, 4, 5, 6, 7, 8]) await evento(BETO, "lg2_module_completed", m, dias(-10));
    const beto = (await pendentes()).find((x) => x.user_id === BETO);
    expect(beto?.email.subject).toBe("Falta pouco: 2 etapas no Empreenda+");
  });

  it("parar pelo link: sem login, token errado não faz nada", async () => {
    const token = (await db.query<{ token: string }>(`select token::text from public.lg2_lembrete where user_id = '${FABI}'`)).rows[0].token;
    await db.exec("set role anon");
    try {
      const errado = await db.query<{ ok: boolean }>("select public.lg2_lembrete_sair('00000000-0000-4000-8000-000000000000') as ok");
      expect(errado.rows[0].ok).toBe(false);
      const certo = await db.query<{ ok: boolean }>("select public.lg2_lembrete_sair($1::uuid) as ok", [token]);
      expect(certo.rows[0].ok).toBe(true);
      await expect(db.query("select * from public.lg2_lembrete")).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
    expect((await pendentes()).map((x) => x.user_id)).not.toContain(FABI);
  });

  it("só o papel do lembrete lista e marca", async () => {
    for (const papel of ["anon", "authenticated"]) {
      await db.exec(`set role ${papel}`);
      try {
        await expect(db.query("select * from public.lg2_lembretes_pendentes('a', 'b')")).rejects.toThrow(/permission denied/);
        await expect(db.query(`select public.lg2_marcar_lembrete_enviado('${ANA}')`)).rejects.toThrow(/permission denied/);
      } finally {
        await db.exec("reset role");
      }
    }
  });
});
