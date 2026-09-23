// @vitest-environment node

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Spec 011 — pedido de melhoria. Prova em PostgreSQL real as regras que
 * sustentam o canal: autoria e status vindos do banco, texto congelado depois
 * da análise, resposta só da coordenação e com motivo, transições válidas,
 * aviso no sino e acesso só de membro ativo.
 */

const MIGRATIONS = [
  "supabase/migrations/20260905_gestao_modelo_operacional.sql",
  "supabase/migrations/20260905_gestao_membro_rpc.sql",
  "supabase/migrations/20260923_gestao_fundacao.sql",
  "supabase/migrations/20260924_gestao_melhorias.sql",
].map((path) => readFileSync(path, "utf8"));

const COORD = "10000000-0000-4000-8000-000000000001";
const COORD2 = "10000000-0000-4000-8000-000000000002";
const BIA = "20000000-0000-4000-8000-000000000001";
const LEO = "20000000-0000-4000-8000-000000000002";
const DESLIGADO = "20000000-0000-4000-8000-000000000003";
const SEM_PAPEL = "30000000-0000-4000-8000-000000000001";

const PEDIDO = {
  titulo: "Chamada offline",
  area: "gestao",
  problema: "Na escola sem sinal a chamada não carrega e eu anoto no papel.",
  proposta: "Guardar a chamada no celular e enviar quando voltar o sinal.",
};

describe("migration do pedido de melhoria (spec 011)", () => {
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

  /** Cria um pedido como `uid` e devolve o id. */
  async function pedir(uid: string, extra: Partial<Record<string, string>> = {}): Promise<string> {
    const p = { ...PEDIDO, ...extra };
    const [linha] = await como(uid, () =>
      linhas<{ id: string }>(
        `insert into gestao.melhoria (titulo, area, problema, proposta)
         values ('${p.titulo}', '${p.area}', '${p.problema}', '${p.proposta}') returning id::text`,
      ),
    );
    return linha.id;
  }

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

      -- Molde de produção: canal limitado e RLS que só aceita a própria linha.
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

      insert into auth.users (id) values
        ('${COORD}'), ('${COORD2}'), ('${BIA}'), ('${LEO}'), ('${DESLIGADO}'), ('${SEM_PAPEL}');
      insert into public.user_profile (id, full_name, email) values
        ('${COORD}', 'Cris', 'cris@ufjf.br'),
        ('${COORD2}', 'Coord Dois', 'c2@ufjf.br'),
        ('${BIA}', 'Bia', 'bia@ufjf.br'),
        ('${LEO}', 'Leo', 'leo@ufjf.br'),
        ('${DESLIGADO}', 'Ex', 'ex@ufjf.br'),
        ('${SEM_PAPEL}', 'Visitante', 'v@ufjf.br');
    `);
    for (const sql of MIGRATIONS) await db.exec(sql);
    await db.exec(MIGRATIONS[3]);

    await db.exec(`set request.jwt.claim.sub = '${COORD}'`);
    await db.exec(`
      insert into gestao.papel_membro (user_profile_id, papel) values
        ('${COORD}', 'coordenacao'),
        ('${COORD2}', 'coordenacao'),
        ('${BIA}', 'bolsista'),
        ('${LEO}', 'bolsista'),
        ('${DESLIGADO}', 'bolsista');
      update gestao.papel_membro set desligado_em = now() where user_profile_id = '${DESLIGADO}';
    `);
    await db.exec(`reset request.jwt.claim.sub`);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("autor e status vêm do banco, e a coordenação ativa recebe aviso no sino", async () => {
    const [linha] = await como(BIA, () =>
      linhas<{ id: string; autor: string; status: string }>(
        `insert into gestao.melhoria (titulo, area, problema, proposta, autor, status)
         values ('${PEDIDO.titulo}', 'gestao', '${PEDIDO.problema}', '${PEDIDO.proposta}', '${LEO}', 'aceita')
         returning id::text, autor::text, status`,
      ),
    );
    expect(linha.autor).toBe(BIA);
    expect(linha.status).toBe("nova");

    const avisos = await linhas<{ user_id: string; type: string; href: string }>(
      `select user_id::text, type, payload->>'href' as href from public.notification
        where type = 'melhoria_nova' order by user_id`,
    );
    expect(avisos).toEqual([
      { user_id: COORD, type: "melhoria_nova", href: `/gestao/melhorias/${linha.id}` },
      { user_id: COORD2, type: "melhoria_nova", href: `/gestao/melhorias/${linha.id}` },
    ]);
  });

  it("autor edita enquanto nova; depois da análise o texto fica como foi escrito", async () => {
    const id = await pedir(BIA, { titulo: "Editar enquanto nova" });
    await como(BIA, () => db.exec(`update gestao.melhoria set titulo = 'Título corrigido' where id = '${id}'`));
    await como(COORD, () => db.exec(`update gestao.melhoria set status = 'em_analise' where id = '${id}'`));

    const editado = await como(BIA, () =>
      linhas(`update gestao.melhoria set titulo = 'Tarde demais' where id = '${id}' returning id`),
    );
    expect(editado).toEqual([]);
    await expect(
      como(COORD, () => db.exec(`update gestao.melhoria set problema = 'A coordenação reescreveu o problema' where id = '${id}'`)),
    ).rejects.toThrow(/texto do pedido é de quem pediu/);

    const [atual] = await linhas<{ titulo: string }>(`select titulo from gestao.melhoria where id = '${id}'`);
    expect(atual.titulo).toBe("Título corrigido");
  });

  it("bolsista não responde nem mexe no pedido de outra pessoa", async () => {
    const id = await pedir(BIA, { titulo: "Pedido da Bia" });
    await expect(
      como(BIA, () => db.exec(`update gestao.melhoria set status = 'aceita' where id = '${id}'`)),
    ).rejects.toThrow(/apenas a coordenação responde/);
    const alheio = await como(LEO, () =>
      linhas(`update gestao.melhoria set titulo = 'Sequestrado' where id = '${id}' returning id`),
    );
    expect(alheio).toEqual([]);
    const apagado = await como(LEO, () => linhas(`delete from gestao.melhoria where id = '${id}' returning id`));
    expect(apagado).toEqual([]);
  });

  it("recusa e duplicata exigem motivo escrito; duplicata aponta o original", async () => {
    const original = await pedir(LEO, { titulo: "Original" });
    const id = await pedir(BIA, { titulo: "Repetido" });

    await expect(
      como(COORD, () => db.exec(`update gestao.melhoria set status = 'recusada' where id = '${id}'`)),
    ).rejects.toThrow(/melhoria_motivo_obrigatorio/);
    await expect(
      como(COORD, () =>
        db.exec(`update gestao.melhoria set status = 'recusada', resposta = 'curto' where id = '${id}'`),
      ),
    ).rejects.toThrow(/melhoria_motivo_obrigatorio/);
    await expect(
      como(COORD, () =>
        db.exec(`update gestao.melhoria set status = 'duplicada', resposta = 'Já pedido pelo Leo na semana passada.'
                 where id = '${id}'`),
      ),
    ).rejects.toThrow(/melhoria_duplicada_aponta_original/);

    await como(COORD, () =>
      db.exec(`update gestao.melhoria set status = 'duplicada', duplicada_de = '${original}',
               resposta = 'Já pedido pelo Leo na semana passada.' where id = '${id}'`),
    );
    const [linha] = await linhas<{ status: string; respondida_por: string }>(
      `select status, respondida_por::text from gestao.melhoria where id = '${id}'`,
    );
    expect(linha).toEqual({ status: "duplicada", respondida_por: COORD });
  });

  it("só aceita as transições do fluxo", async () => {
    const id = await pedir(BIA, { titulo: "Fluxo" });
    await expect(
      como(COORD, () => db.exec(`update gestao.melhoria set status = 'entregue' where id = '${id}'`)),
    ).rejects.toThrow(/nova não pode passar a entregue/);

    await como(COORD, () =>
      db.exec(`update gestao.melhoria set status = 'aceita', link_execucao = 'https://trello.com/c/abc' where id = '${id}'`),
    );
    await como(COORD, () => db.exec(`update gestao.melhoria set status = 'entregue' where id = '${id}'`));
    await expect(
      como(COORD, () =>
        db.exec(`update gestao.melhoria set status = 'recusada', resposta = 'Mudamos de ideia depois de entregar.'
                 where id = '${id}'`),
      ),
    ).rejects.toThrow(/entregue não pode passar a recusada/);
  });

  it("avisa o autor a cada mudança de status, com o motivo", async () => {
    const id = await pedir(LEO, { titulo: "Aviso ao autor" });
    await como(COORD, () =>
      db.exec(`update gestao.melhoria set status = 'recusada',
               resposta = 'Fora do escopo deste semestre.' where id = '${id}'`),
    );
    const avisos = await como(LEO, () =>
      linhas<{ title: string; message: string }>(
        `select payload->>'title' as title, payload->>'message' as message from public.notification
          where type = 'melhoria_atualizada' and payload->>'href' = '/gestao/melhorias/${id}'`,
      ),
    );
    expect(avisos).toEqual([
      {
        title: "Seu pedido de melhoria foi recusado",
        message: '"Aviso ao autor" foi recusado. Fora do escopo deste semestre.',
      },
    ]);
  });

  it("apoio: ninguém apoia o próprio pedido nem apoia duas vezes", async () => {
    const id = await pedir(BIA, { titulo: "Apoio" });
    await expect(
      como(BIA, () => db.exec(`insert into gestao.melhoria_apoio (melhoria_id) values ('${id}')`)),
    ).rejects.toThrow(/apoiar o próprio pedido/);
    await como(LEO, () => db.exec(`insert into gestao.melhoria_apoio (melhoria_id) values ('${id}')`));
    await expect(
      como(LEO, () => db.exec(`insert into gestao.melhoria_apoio (melhoria_id) values ('${id}')`)),
    ).rejects.toThrow(/duplicate key/);

    const [visto] = await como(LEO, () =>
      linhas<{ apoios: number; apoiei: boolean; autor_nome: string }>(
        `select apoios, apoiei, autor_nome from gestao.listar_melhorias('${id}')`,
      ),
    );
    // Nome do autor sai mesmo com a RLS de user_profile fechada para o Leo.
    expect(visto).toEqual({ apoios: 1, apoiei: true, autor_nome: "Bia" });
  });

  it("deriva atrasada por data: nova há mais de 14 dias", async () => {
    const velho = await pedir(BIA, { titulo: "Pedido antigo" });
    await db.exec(`alter table gestao.melhoria disable trigger user`);
    await db.exec(`update gestao.melhoria set criado_em = now() - interval '15 days' where id = '${velho}'`);
    await db.exec(`alter table gestao.melhoria enable trigger user`);
    const novo = await pedir(BIA, { titulo: "Pedido recente" });

    const fila = await como(COORD, () =>
      linhas<{ id: string; atrasada: boolean }>(
        `select id::text, atrasada from gestao.listar_melhorias() where id in ('${velho}', '${novo}')`,
      ),
    );
    expect(Object.fromEntries(fila.map((f) => [f.id, f.atrasada]))).toEqual({ [velho]: true, [novo]: false });
  });

  it("desligado, sem papel e anônimo não leem nem criam pedidos", async () => {
    for (const uid of [DESLIGADO, SEM_PAPEL]) {
      const lido = await como(uid, () => linhas(`select id from gestao.melhoria`));
      expect(lido).toEqual([]);
      await expect(como(uid, () => db.query(`select * from gestao.listar_melhorias()`))).rejects.toThrow(
        /apenas membros/,
      );
      await expect(pedir(uid)).rejects.toThrow(/row-level security/i);
    }
    await db.exec(`set role anon`);
    try {
      await expect(db.query(`select id from gestao.melhoria`)).rejects.toThrow(/permission denied/i);
    } finally {
      await db.exec(`reset role`);
    }
  });
});
