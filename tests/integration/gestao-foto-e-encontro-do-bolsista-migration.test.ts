// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { comoUsuario, gestaoAte, sqlDaMigracao } from "./helpers/gestao";

/**
 * Foto de comprovação, atividade com participantes e encontro criado pelo
 * bolsista (20261123). Ana e Beto são bolsistas; Bia é conta de teste; Rui não
 * é membro; Dora foi desligada.
 */

// Sem a dos artigos (pede `public.article`). As novas duas vezes: idempotência.
const MIGRATIONS = [
  ...gestaoAte("20261110_gestao_link_de_comprovacao"),
  sqlDaMigracao("20261112_gestao_link_no_relatorio"),
  sqlDaMigracao("20261113_gestao_importar_planilha"),
  sqlDaMigracao("20261114_gestao_numero_da_aula"),
  sqlDaMigracao("20261115_gestao_atrasos_e_metas"),
  sqlDaMigracao("20261116_gestao_espacos"),
  sqlDaMigracao("20261122_gestao_calendario_da_equipe"),
  sqlDaMigracao("20261123_gestao_foto_e_atividade_com_equipe"),
  sqlDaMigracao("20261123_gestao_encontro_do_bolsista"),
  sqlDaMigracao("20261123_gestao_foto_e_atividade_com_equipe"),
  sqlDaMigracao("20261123_gestao_encontro_do_bolsista"),
];

const COORD = "7a000000-0000-4000-8000-000000000001";
const ANA = "7a000000-0000-4000-8000-000000000002";
const BETO = "7a000000-0000-4000-8000-000000000003";
const BIA = "7a000000-0000-4000-8000-000000000004";
const RUI = "7a000000-0000-4000-8000-000000000005";
const DORA = "7a000000-0000-4000-8000-000000000006";
const ESCOLA = "7b000000-0000-4000-8000-000000000001";
const ARQ = "7c000000-0000-4000-8000-000000000001";
const foto = (dono: string, ext = "jpg") => `${dono}/${ARQ}.${ext}`;

describe("foto, atividade com equipe e encontro do bolsista (20261123)", () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const como = comoUsuario(db);
  let encontro = "";

  const comprovar = (link: string | null, f: string | null) =>
    db.query(`select gestao.escrever_link_comprovacao($1, $2, $3)`, [encontro, link, f]);

  const novaAtividade = (participantes: string[], extra = "") =>
    db.query<{ id: string }>(
      `insert into gestao.atividade_relatorio (nome, data, inicio, fim, participantes${extra ? ", foto_comprovacao" : ""})
       values ('Gravação', (now() at time zone 'America/Sao_Paulo')::date, '14:00', '16:00', $1${extra ? ", $2" : ""}) returning id`,
      extra ? [participantes, extra] : [participantes],
    );

  const criarEncontro = (colegas: string[], fim = "11:00") =>
    db.query<{ id: string }>(
      `select gestao.criar_encontro_do_bolsista('2026-10-20', '09:00', $1, 'gravacao', 'Gravação de vídeo', '', null, $2) as id`,
      [fim, colegas],
    );

  beforeAll(async () => {
    const pessoas: [string, string][] = [[COORD, "Coord"], [ANA, "Ana"], [BETO, "Beto"], [BIA, "Bia"], [RUI, "Rui"], [DORA, "Dora"]];
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

      insert into auth.users (id) values ${pessoas.map(([p]) => `('${p}')`).join(", ")};
      insert into public.user_profile (id, full_name, email) values
        ${pessoas.map(([p, n], i) => `('${p}', '${n}', 'p${i}@ufjf.br')`).join(", ")};
    `);
    for (const sql of MIGRATIONS) await db.exec(sql);
    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, coordenacao, bolsista, teste, desligado_em) values
        ('${COORD}', true, false, false, null), ('${ANA}', false, true, false, null), ('${BETO}', false, true, false, null),
        ('${BIA}', false, true, true, null), ('${DORA}', false, true, false, now());
      insert into gestao.escola (id, nome, categoria, cidade) values ('${ESCOLA}', 'Escola 1', 'estadual', 'Juiz de Fora');
    `);
    encontro = (
      await db.query<{ id: string }>(
        `insert into gestao.agenda (data, escola_id, aulas, modalidade, inicio, fim)
         values ('2026-10-05', '${ESCOLA}', 'Lego', 'Lego', '08:00', '12:00') returning id`,
      )
    ).rows[0].id;
    await db.exec(`insert into gestao.agenda_bolsista (agenda_id, bolsista_id) values ('${encontro}', '${ANA}')`);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("colegas: só a equipe ativa do mesmo lado, sem quem chama", async () => {
    const nomes = await como(ANA, async () => (await db.query<{ nome: string }>(`select nome from gestao.colegas()`)).rows.map((r) => r.nome));
    expect(nomes).toEqual(["Beto", "Coord"]);
    await expect(como(RUI, () => db.query(`select * from gestao.colegas()`))).rejects.toThrow(/apenas membros/);
  });

  it("foto do encontro: grava a da própria pasta junto do link; a de outra pessoa não", async () => {
    await como(ANA, () => comprovar(null, foto(ANA)));
    const linha = async () =>
      (
        await db.query<{ link_comprovacao: string | null; foto_comprovacao: string | null }>(
          `select link_comprovacao, foto_comprovacao from gestao.agenda_bolsista where agenda_id = $1 and bolsista_id = $2`,
          [encontro, ANA],
        )
      ).rows[0];
    expect(await linha()).toEqual({ link_comprovacao: null, foto_comprovacao: foto(ANA) });

    await como(ANA, async () => {
      await expect(comprovar(null, foto(BETO))).rejects.toThrow(/foto de comprovação inválida/);
      await expect(comprovar(null, `${ANA}/../x.jpg`)).rejects.toThrow(/foto de comprovação inválida/);
    });
    expect((await linha()).foto_comprovacao).toBe(foto(ANA));

    // A assinatura antiga (sem foto) continua funcionando e apaga a foto.
    await como(ANA, () => db.query(`select gestao.escrever_link_comprovacao($1, $2)`, [encontro, "https://a.org"]));
    expect(await linha()).toEqual({ link_comprovacao: "https://a.org", foto_comprovacao: null });
  });

  it("atividade: o participante lê, não edita; quem não participa não vê", async () => {
    const id = (await como(ANA, () => novaAtividade([BETO], foto(ANA)))).rows[0].id;
    const ve = (uid: string) =>
      como(uid, async () => (await db.query(`select id from gestao.atividade_relatorio where id = $1`, [id])).rows.length);
    expect(await ve(BETO)).toBe(1);
    expect(await ve(BIA)).toBe(0);
    expect(await ve(COORD)).toBe(1);

    const mudou = await como(BETO, () => db.query(`update gestao.atividade_relatorio set nome = 'Outra' where id = $1`, [id]));
    expect(mudou.affectedRows).toBe(0);
    const editou = await como(ANA, () =>
      db.query(`update gestao.atividade_relatorio set inicio = '13:00', participantes = '{}' where id = $1`, [id]),
    );
    expect(editou.affectedRows).toBe(1);
  });

  it("atividade recusa participante de fora, desligado, de teste, o próprio autor, foto alheia e fim antes do início", async () => {
    await como(ANA, async () => {
      for (const p of [RUI, DORA, BIA]) await expect(novaAtividade([p])).rejects.toThrow(/só pessoas da equipe/);
      await expect(novaAtividade([ANA])).rejects.toThrow(/participantes_check/);
      await expect(novaAtividade([], foto(BETO))).rejects.toThrow(/foto_check/);
      await expect(
        db.query(
          `insert into gestao.atividade_relatorio (nome, data, inicio, fim) values ('X', (now() at time zone 'America/Sao_Paulo')::date, '16:00', '14:00')`,
        ),
      ).rejects.toThrow(/horario_check/);
    });
  });

  it("bolsista cria encontro sem escola: ele responsável, colegas apoio, horas contadas", async () => {
    const id = (await como(ANA, () => criarEncontro([BETO, BETO, ANA]))).rows[0].id;
    const { rows: agenda } = await db.query<{ escola_id: string | null; turma_id: string | null; horario: string; criado_por: string }>(
      `select escola_id, turma_id, horario, criado_por from gestao.agenda where id = $1`,
      [id],
    );
    expect(agenda[0]).toMatchObject({ escola_id: null, turma_id: null, criado_por: ANA });
    const { rows: equipe } = await db.query<{ bolsista_id: string; funcao: string; carga: string }>(
      `select bolsista_id, funcao, carga from gestao.agenda_bolsista where agenda_id = $1 order by funcao desc`,
      [id],
    );
    expect(equipe.map((e) => [e.bolsista_id, e.funcao])).toEqual([
      [ANA, "responsavel"],
      [BETO, "apoio"],
    ]);
    expect(equipe[0].carga).not.toBe("");
    // O bolsista não escreve direto na agenda.
    await expect(
      como(ANA, () => db.query(`insert into gestao.agenda (data, aulas, modalidade, inicio, fim) values ('2026-10-21', 'x', 'x', '08:00', '09:00')`)),
    ).rejects.toThrow();
  });

  it("encontro do bolsista recusa colega de fora, desligado ou de teste, horário invertido e quem não é membro", async () => {
    await como(ANA, async () => {
      for (const c of [RUI, DORA, BIA]) await expect(criarEncontro([c])).rejects.toThrow(/só pessoas da equipe/);
      await expect(criarEncontro([], "08:00")).rejects.toThrow(/início e o fim/);
    });
    await expect(como(RUI, () => criarEncontro([]))).rejects.toThrow(/apenas membros/);
  });
});
