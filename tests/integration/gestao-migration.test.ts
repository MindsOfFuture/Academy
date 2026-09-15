// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const MIGRATION = readFileSync(
  "supabase/migrations/20260905_gestao_modelo_operacional.sql",
  "utf8",
);

const COORD_ID = "123e4567-e89b-42d3-a456-426614174000";
const BOLSISTA_ID = "223e4567-e89b-42d3-a456-426614174000";
const OTHER_ID = "323e4567-e89b-42d3-a456-426614174000";
const NO_ROLE_ID = "423e4567-e89b-42d3-a456-426614174000";
const ESCOLA_ID = "523e4567-e89b-42d3-a456-426614174000";
const ALUNO_ID = "623e4567-e89b-42d3-a456-426614174000";
const RESERVA_ID = "723e4567-e89b-42d3-a456-426614174000";
const AGENDA_ID = "823e4567-e89b-42d3-a456-426614174000";
const AULA_ID = "923e4567-e89b-42d3-a456-426614174000";

/** Valores uuid que alimentam a fixture de forma determinística. */
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("migration do modelo operacional de gestão em PostgreSQL real", () => {
  // pgcrypto é pré-instalado no Supabase; no PGlite precisa ser carregado
  // explicitamente antes de a migration rodar `create extension if not exists`.
  const db = new PGlite({ extensions: { pgcrypto } });

  beforeAll(async () => {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;

      create schema auth;
      create table auth.users (id uuid primary key);
      insert into auth.users (id) values
        ('${COORD_ID}'), ('${BOLSISTA_ID}'), ('${OTHER_ID}'), ('${NO_ROLE_ID}');
      create function auth.uid() returns uuid language sql stable as $fn$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $fn$;
      grant usage on schema auth to anon, authenticated;

      create table public.user_profile (id uuid primary key);
      insert into public.user_profile (id) values
        ('${COORD_ID}'), ('${BOLSISTA_ID}'), ('${OTHER_ID}');
      grant usage on schema public to anon, authenticated;
      grant select on public.user_profile to authenticated;
    `);
    // A migration é idempotente: rodar duas vezes não pode falhar.
    await db.exec(MIGRATION);
    await db.exec(MIGRATION);

    // Seed da fixture como superusuario (postgres), que ignora RLS, mas com um
    // claim explícito para que as triggers de autoria/auditoria não aceitem
    // fallback para um `criado_por` informado pelo cliente.
    await db.exec(`set request.jwt.claim.sub = '${COORD_ID}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, papel) values
        ('${COORD_ID}', 'coordenacao'),
        ('${BOLSISTA_ID}', 'bolsista');

      insert into gestao.escola (id, nome, categoria, cidade, criado_por)
        values ('${ESCOLA_ID}', 'Escola Estadual Teste', 'estadual', 'Juiz de Fora', '${COORD_ID}');

      insert into gestao.aluno (id, nome, idade, escola_id, categoria_escola, ano_escolar, modalidade, execucao, cidade, criado_por)
        values ('${ALUNO_ID}', 'Aluno Teste', 12, '${ESCOLA_ID}', 'estadual', '7o ano', 'robotica', 'ensino fundamental', 'Juiz de Fora', '${COORD_ID}');

      insert into gestao.reserva (id, escola_id, onibus, dias, horarios, modalidade, numero_alunos, serie, status, criado_por)
        values ('${RESERVA_ID}', '${ESCOLA_ID}', true, 'segunda e quarta', '08h-11h', 'robotica', 30, '7o ano', 'confirmada', '${COORD_ID}');

      insert into gestao.reserva_termo (reserva_id, aluno_id, status)
        values ('${RESERVA_ID}', '${ALUNO_ID}', 'pendente');

      insert into gestao.agenda (id, data, escola_id, aulas, modalidade, horario, criado_por)
        values ('${AGENDA_ID}', '2026-09-10', '${ESCOLA_ID}', 'introducao; sensores', 'robotica', '08h-11h', '${COORD_ID}');

      insert into gestao.agenda_bolsista (agenda_id, bolsista_id, carga)
        values ('${AGENDA_ID}', '${BOLSISTA_ID}', '4h');

      insert into gestao.aula (id, agenda_id, titulo, realizada_em)
        values ('${AULA_ID}', '${AGENDA_ID}', 'Introducao a robotica', '2026-09-10');

      insert into gestao.presenca (aula_id, aluno_id, presente, assinatura_status, bolsista_id)
        values ('${AULA_ID}', '${ALUNO_ID}', true, 'assinado', '${BOLSISTA_ID}');

      insert into gestao.lista_enviada (escola_id, reserva_id, nomes, criado_por)
        values ('${ESCOLA_ID}', '${RESERVA_ID}', array['Aluno Teste'], '${COORD_ID}');
    `);
    await db.exec("reset request.jwt.claim.sub");
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("reproduz o schema gestao.* e torna a migration idempotente", async () => {
    const tables = await db.query<{ n: number }>(
      `select count(*)::int as n from information_schema.tables where table_schema = 'gestao'`,
    );
    // 11 tabelas do modelo + nada de extra inesperado.
    expect(tables.rows[0].n).toBe(11);
  });

  it("nega leitura e escrita a usuário autenticado sem papel de membro", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${OTHER_ID}'`);
    // SELECT permitido por grant, mas RLS devolve conjunto vazio (sem linha visível).
    const alunos = await db.query<{ id: string }>("select * from gestao.aluno");
    expect(alunos.rows).toEqual([]);
    const escolas = await db.query<{ id: string }>("select * from gestao.escola");
    expect(escolas.rows).toEqual([]);
    // INSERT é negado pela RLS: viola with check e lança erro.
    await expect(db.exec(
      `insert into gestao.aluno (nome, idade, escola_id, categoria_escola, ano_escolar, modalidade, execucao, cidade, criado_por)
       values ('X', 10, '${ESCOLA_ID}', 'estadual', '1o ano', 'robotica', 'ef', 'Cidade', '${OTHER_ID}')`,
    )).rejects.toThrow(/row-level security/i);
    await db.exec("reset role");
  });

  it("nega qualquer acesso a usuário anônimo", async () => {
    await db.exec("set role anon");
    // anon não tem nenhum privilégio: erro de permissão, não linha.
    await expect(db.query("select * from gestao.aluno")).rejects.toThrow(/permission denied/i);
    await expect(db.query("select * from gestao.escola")).rejects.toThrow(/permission denied/i);
    await db.exec("reset role");
  });

  it("permite coordenação ler e escrever o registro operacional", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${COORD_ID}'`);
    const alunos = await db.query("select id::text from gestao.aluno");
    expect(alunos.rows.map((r) => r.id)).toContain(ALUNO_ID);

    const novo = uuid(1);
    await db.exec(`
      insert into gestao.aluno (id, nome, idade, escola_id, categoria_escola, ano_escolar, modalidade, execucao, cidade, criado_por)
      values ('${novo}', 'Aluna Nova', 11, '${ESCOLA_ID}', 'estadual', '6o ano', 'robotica', 'ef', 'Juiz de Fora', '${COORD_ID}')
    `);
    await db.exec("reset role");
  });

  it("deriva os seis indicadores do convênio por query (dado, não schema)", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${COORD_ID}'`);

    // 1. total de alunos participantes
    const total = await db.query<{ n: number }>("select count(*)::int as n from gestao.aluno");
    expect(total.rows[0].n).toBe(2);

    // 2. reservas de ônibus
    const onibus = await db.query<{ n: number }>(
      "select count(*)::int as n from gestao.reserva where onibus",
    );
    expect(onibus.rows[0].n).toBe(1);

    // 3. termos arquivados vs pendentes
    const termos = await db.query<{ status: string; n: number }>(
      "select status, count(*)::int as n from gestao.reserva_termo group by status",
    );
    expect(termos.rows).toEqual([{ status: "pendente", n: 1 }]);

    // 4. presença por aula
    const presenca = await db.query<{ presente: number }>(
      "select count(*)::int as presente from gestao.presenca where presente",
    );
    expect(presenca.rows[0].presente).toBe(1);

    // 5. aulas/módulos realizados
    const aulas = await db.query<{ n: number }>(
      "select count(*)::int as n from gestao.aula where realizada_em is not null",
    );
    expect(aulas.rows[0].n).toBe(1);

    // 6. alocação/carga dos bolsistas
    const carga = await db.query<{ bolsista_id: string; carga: string }>(
      `select ab.bolsista_id::text, ab.carga
         from gestao.agenda_bolsista ab
         join gestao.papel_membro m on m.user_profile_id = ab.bolsista_id
        where m.papel = 'bolsista'`,
    );
    expect(carga.rows).toEqual([{ bolsista_id: BOLSISTA_ID, carga: "4h" }]);

    await db.exec("reset role");
  });

  it("limita a lista enviada a 30 nomes por constraint", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${COORD_ID}'`);
    const nomes30 = Array.from({ length: 31 }, (_, i) => `Aluno ${i}`);
    await expect(db.exec(`
      insert into gestao.lista_enviada (escola_id, nomes, criado_por)
      values ('${ESCOLA_ID}', array[${nomes30.map((n) => `'${n}'`).join(",")}], '${COORD_ID}')
    `)).rejects.toThrow();
    await db.exec("reset role");
  });

  it("não expõe campo de documento sensível no modelo (minimização LGPD)", async () => {
    const cols = await db.query<{ table_name: string }>(
      `select table_name from information_schema.columns
        where table_schema = 'gestao'
          and column_name in ('cpf', 'documento', 'documento_url', 'termo_url', 'assinatura_url')`,
    );
    expect(cols.rows).toEqual([]);
  });

  it("deriva criado_por de auth.uid() e ignora a autoria enviada pelo cliente", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${COORD_ID}'`);
    const escola = uuid(2);

    // O corpo da escrita tenta se passar por outro usuário; o banco descarta.
    await db.exec(`
      insert into gestao.escola (id, nome, categoria, cidade, criado_por)
      values ('${escola}', 'Escola Autoria', 'estadual', 'Juiz de Fora', '${OTHER_ID}')
    `);
    const inserida = await db.query<{ criado_por: string }>(
      `select criado_por::text from gestao.escola where id = '${escola}'`,
    );
    expect(inserida.rows[0].criado_por).toBe(COORD_ID);

    // Update também não reescreve a autoria original.
    await db.exec(
      `update gestao.escola set nome = 'Escola Autoria II', criado_por = '${OTHER_ID}' where id = '${escola}'`,
    );
    const atualizada = await db.query<{ criado_por: string }>(
      `select criado_por::text from gestao.escola where id = '${escola}'`,
    );
    expect(atualizada.rows[0].criado_por).toBe(COORD_ID);

    await db.exec("reset role");
  });

  it("carimba atualizado_em no servidor, ignorando o valor enviado", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${COORD_ID}'`);

    const antes = await db.query<{ atualizado_em: string }>(
      `select atualizado_em::text from gestao.aluno where id = '${ALUNO_ID}'`,
    );
    // Data antiga no corpo: se o carimbo não fosse do servidor, ela ficaria.
    await db.exec(`
      update gestao.aluno
         set nome = 'Aluno Teste Renomeado',
             atualizado_em = '2000-01-01T00:00:00Z'
       where id = '${ALUNO_ID}'
    `);
    const depois = await db.query<{ atualizado_em: string }>(
      `select atualizado_em::text from gestao.aluno where id = '${ALUNO_ID}'`,
    );

    expect(new Date(depois.rows[0].atualizado_em).getTime()).toBeGreaterThan(
      new Date(antes.rows[0].atualizado_em).getTime(),
    );

    await db.exec("reset role");
  });

  it("registra insert, update e delete em registro_auditoria com o autor", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${COORD_ID}'`);
    const escola = uuid(3);

    await db.exec(`
      insert into gestao.escola (id, nome, categoria, cidade, criado_por)
      values ('${escola}', 'Escola Auditada', 'municipal', 'Juiz de Fora', '${COORD_ID}')
    `);
    await db.exec(`update gestao.escola set cidade = 'Ubá' where id = '${escola}'`);
    await db.exec(`delete from gestao.escola where id = '${escola}'`);

    const trilha = await db.query<{ acao: string; autor: string; tabela: string }>(
      `select acao, autor::text, tabela from gestao.registro_auditoria
        where registro_id = '${escola}' order by id`,
    );
    expect(trilha.rows.map((r) => r.acao)).toEqual(["insert", "update", "delete"]);
    expect(trilha.rows.every((r) => r.autor === COORD_ID)).toBe(true);
    expect(trilha.rows.every((r) => r.tabela === "escola")).toBe(true);

    await db.exec("reset role");
  });

  it("deriva o autor também no insert direto na auditoria", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${COORD_ID}'`);
    const registro = uuid(4);

    await db.exec(`
      insert into gestao.registro_auditoria (tabela, registro_id, acao, autor)
      values ('escola', '${registro}', 'insert', '${OTHER_ID}')
    `);
    const linha = await db.query<{ autor: string }>(
      `select autor::text from gestao.registro_auditoria where registro_id = '${registro}'`,
    );
    expect(linha.rows[0].autor).toBe(COORD_ID);

    await db.exec("reset role");
  });

  it("rejeita update e delete na auditoria (append-only em duas camadas)", async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${COORD_ID}'`);
    // Camada 1: authenticated não tem grant de update/delete na tabela.
    await expect(
      db.exec("update gestao.registro_auditoria set acao = 'insert'"),
    ).rejects.toThrow(/permission denied/i);
    await expect(
      db.exec("delete from gestao.registro_auditoria"),
    ).rejects.toThrow(/permission denied/i);
    await db.exec("reset role");

    // Camada 2: a trigger barra até quem tem privilégio de sobra (superusuário
    // aqui; service role e dono da tabela em produção).
    await expect(
      db.exec("update gestao.registro_auditoria set acao = 'insert'"),
    ).rejects.toThrow(/append-only/i);
    await expect(
      db.exec("delete from gestao.registro_auditoria"),
    ).rejects.toThrow(/append-only/i);
  });

  it("só conta como carga a alocação de quem tem papel bolsista (contraexemplo)", async () => {
    // A coordenação também pode ser alocada numa agenda; a junção do indicador
    // 6 não pode deixar essa carga entrar como carga de bolsista.
    await db.exec(`
      insert into gestao.agenda_bolsista (agenda_id, bolsista_id, carga)
      values ('${AGENDA_ID}', '${COORD_ID}', '8h')
    `);

    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${COORD_ID}'`);
    const todas = await db.query<{ n: number }>(
      `select count(*)::int as n from gestao.agenda_bolsista where agenda_id = '${AGENDA_ID}'`,
    );
    expect(todas.rows[0].n).toBe(2);

    const carga = await db.query<{ bolsista_id: string; carga: string }>(
      `select ab.bolsista_id::text, ab.carga
         from gestao.agenda_bolsista ab
         join gestao.papel_membro m on m.user_profile_id = ab.bolsista_id
        where m.papel = 'bolsista' and ab.agenda_id = '${AGENDA_ID}'`,
    );
    expect(carga.rows).toEqual([{ bolsista_id: BOLSISTA_ID, carga: "4h" }]);
    await db.exec("reset role");
  });

  it("exige vínculo de membro para alocar carga (relação do indicador 6)", async () => {
    // NO_ROLE_ID existe em auth.users mas não tem papel_membro: sem a chave
    // estrangeira a junção do indicador não existiria e a alocação órfã
    // entraria no modelo.
    await expect(db.exec(`
      insert into gestao.agenda_bolsista (agenda_id, bolsista_id, carga)
      values ('${AGENDA_ID}', '${NO_ROLE_ID}', '2h')
    `)).rejects.toThrow(/foreign key|violates/i);
  });
});
