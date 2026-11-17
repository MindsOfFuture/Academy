-- Lembrete por e-mail de etapas que faltam no Empreenda+ (spec 027).
--
-- Mesmo caminho dos lembretes da gestão (20261009_gestao_gestor_lembrete.sql):
-- o banco escolhe quem recebe e monta o e-mail no formato da API do Resend; o
-- script do VPS (scripts/academy-lembrete-encontros.sh) envia e marca. Entra com
-- o papel `gestao_lembrete`, que só executa funções de lembrete (ADR 021).
--
-- Quem recebe: conta com uso do LG2 (progresso salvo ou evento lg2_*), menos de
-- 10 etapas concluídas, sem uso há 3 dias e que não pediu para parar. No máximo
-- 3 lembretes por período parado (3, +7 e +14 dias); voltar a usar zera a conta.
-- Fica de fora a conta escondida da antiga entrada de teste (e-mail inventado).
-- Só sai entre 9h e 19h de Brasília.
--
-- Parar os lembretes: link com token aleatório por pessoa (sem login), que chama
-- public.lg2_lembrete_sair(token). Nada de resposta da pessoa vai no e-mail.
--
-- Idempotente. Não aplicar automaticamente: produção é compartilhada. Aplicar
-- ANTES de instalar o script novo no VPS.

begin;

create table if not exists public.lg2_lembrete (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  saiu_em timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists public.lg2_lembrete_enviado (
  user_id uuid not null references auth.users (id) on delete cascade,
  enviado_em timestamptz not null default now(),
  primary key (user_id, enviado_em)
);

alter table public.lg2_lembrete enable row level security;
alter table public.lg2_lembrete force row level security;
alter table public.lg2_lembrete_enviado enable row level security;
alter table public.lg2_lembrete_enviado force row level security;
revoke all on table public.lg2_lembrete from public, anon, authenticated;
revoke all on table public.lg2_lembrete_enviado from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'gestao_lembrete') then
    create role gestao_lembrete nologin;
  end if;
end;
$$;
grant usage on schema public to gestao_lembrete;

create or replace function public.lg2_html_escapar(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select replace(replace(replace(replace(replace(coalesce(p, ''),
    '&', '&#38;'), '<', '&#60;'), '>', '&#62;'), '"', '&#34;'), '''', '&#39;')
$$;

-- O app guarda cada chave do localStorage como texto; a jornada é JSON dentro
-- desse texto. Valor quebrado vira null em vez de derrubar o lote inteiro.
create or replace function public.lg2_json_seguro(p jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p is null then return null; end if;
  if jsonb_typeof(p) = 'string' then return (p #>> '{}')::jsonb; end if;
  return p;
exception when others then
  return null;
end;
$$;

-- Modelo do e-mail na marca Minds (branco domina, roxo em bloco, amarelo só
-- sobre roxo, barra FACC/UFJF + Governo de MG no rodapé). Imagens PNG em
-- /email/ (fora do login: o middleware não protege .png).
create or replace function public.lg2_email_html(p_url_base text, p_titulo text, p_corpo text, p_href text, p_sair text)
returns text
language sql
immutable
set search_path = ''
as $$
  select
    '<div style="background:#ECE9F3;padding:24px 12px;font-family:''Louis George Cafe'',''Quicksand'',''Nunito'',Arial,sans-serif;">'
    || '<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:14px;overflow:hidden;">'
    || '<div style="background:#684A97;padding:20px 24px;">'
    || '<img src="' || p_url_base || '/email/minds.png" width="45" height="44" alt="Minds of the Future" style="vertical-align:middle;border:0;">'
    || '<span style="vertical-align:middle;margin-left:12px;color:#FFD300;font-size:24px;font-weight:bold;">Empreenda+</span>'
    || '</div>'
    || '<div style="padding:24px;color:#333333;font-size:16px;line-height:1.55;">'
    || '<h1 style="margin:0 0 12px;color:#684A97;font-size:22px;line-height:1.3;">' || p_titulo || '</h1>'
    || p_corpo
    || '<p style="margin:24px 0 8px;"><a href="' || p_href || '" style="display:inline-block;background:#684A97;color:#FFFFFF;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">Continuar minha trilha</a></p>'
    || '</div>'
    || '<div style="padding:16px 24px;border-top:1px solid #ECE9F3;text-align:center;">'
    || '<img src="' || p_url_base || '/email/facc.png" height="32" alt="FACC/UFJF" style="height:32px;margin:0 10px;vertical-align:middle;border:0;">'
    || '<img src="' || p_url_base || '/email/ufjf.png" height="32" alt="UFJF" style="height:32px;margin:0 10px;vertical-align:middle;border:0;">'
    || '<img src="' || p_url_base || '/email/mg.png" height="32" alt="Governo de Minas Gerais" style="height:32px;margin:0 10px;vertical-align:middle;border:0;">'
    || '<p style="margin:12px 0 0;color:#676565;font-size:12px;line-height:1.5;">Você recebeu este lembrete porque começou o Empreenda+ no Minds of the Future, projeto de extensão da FACC/UFJF. '
    || '<a href="' || p_sair || '" style="color:#684A97;">Não quero mais receber estes lembretes</a>.</p>'
    || '</div>'
    || '</div></div>'
$$;

create or replace function public.lg2_lembretes_pendentes(
  p_de text,
  p_url_base text,
  p_redirecionar_para text default null,
  p_agora timestamptz default now()
)
returns table (user_id uuid, email jsonb)
language plpgsql
volatile
security definer
set search_path = 'public'
as $$
#variable_conflict use_column
declare
  v_url text := rtrim(p_url_base, '/');
  v_hora int := extract(hour from p_agora at time zone 'America/Sao_Paulo');
  v_etapas text[] := array[
    'Perfil do empreendedor e definição da ideia',
    'Clientes, necessidades e comportamento de compra',
    'Mercado, concorrentes e oportunidades',
    'Produto, proposta de valor e teste da ideia',
    'Custos, despesas, preço e margem',
    'Investimento, capital de giro e fluxo de caixa',
    'Operação, fornecedores, capacidade e qualidade',
    'Formalização, enquadramento e tributação básica',
    'Licenças, endereço e atividades reguladas',
    'Comunicação, vendas, pessoas e plano de ação'
  ];
begin
  -- Fora do horário comercial de Brasília não sai nada; a próxima hora tenta de novo.
  if v_hora < 9 or v_hora >= 19 then
    return;
  end if;

  create temporary table if not exists lg2_tmp_alvo (
    user_id uuid primary key, feitos int[], parados int
  ) on commit drop;
  truncate lg2_tmp_alvo;

  insert into lg2_tmp_alvo (user_id, feitos, parados)
  with eventos as (
    select t.user_id,
           max(t.occurred_at) as ult,
           array_agg(distinct (t.metadata ->> 'modulo')::int)
             filter (where t.event_name = 'lg2_module_completed' and t.metadata ->> 'modulo' ~ '^([1-9]|10)$') as feitos
    from public.telemetry_learning_event t
    where t.event_name in ('lg2_module_opened', 'lg2_module_completed', 'lg2_journey_completed')
      and t.user_id is not null
    group by t.user_id
  ),
  progresso as (
    select p.user_id, p.atualizado_em as ult,
           array(
             select x::int
             from jsonb_array_elements_text(
               case when jsonb_typeof(public.lg2_json_seguro(p.dados -> 'lg2-jornada') -> 'feitos') = 'array'
                    then public.lg2_json_seguro(p.dados -> 'lg2-jornada') -> 'feitos' else '[]'::jsonb end
             ) x
             where x ~ '^([1-9]|10)$'
           ) as feitos
    from public.lg2_progresso p
  ),
  pessoas as (
    select coalesce(e.user_id, p.user_id) as user_id,
           greatest(e.ult, p.ult) as ult,
           array(
             select distinct v from unnest(coalesce(e.feitos, '{}') || coalesce(p.feitos, '{}')) v order by v
           ) as feitos
    from eventos e
    full join progresso p on p.user_id = e.user_id
  ),
  com_envios as (
    select pe.*,
           (select count(*) from public.lg2_lembrete_enviado le where le.user_id = pe.user_id and le.enviado_em > pe.ult) as n,
           (select max(le.enviado_em) from public.lg2_lembrete_enviado le where le.user_id = pe.user_id) as ultimo
    from pessoas pe
  )
  select c.user_id, c.feitos, c.n
  from com_envios c
  join public.user_profile up on up.id = c.user_id
  where cardinality(c.feitos) < 10
    and nullif(btrim(up.email), '') is not null
    -- Contas escondidas da antiga entrada por nome+CPF (removida em 33874c6):
    -- endereço inventado, o e-mail voltaria e prejudicaria a entrega dos outros.
    and up.email !~* '@teste\.mindsofthefuture\.com\.br$'
    and not exists (select 1 from public.lg2_lembrete l where l.user_id = c.user_id and l.saiu_em is not null)
    and (
      (c.n = 0 and c.ult < p_agora - interval '3 days')
      or (c.n = 1 and c.ultimo < p_agora - interval '7 days')
      or (c.n = 2 and c.ultimo < p_agora - interval '14 days')
    );

  -- Token para o link de parar, criado uma vez por pessoa.
  insert into public.lg2_lembrete (user_id)
  select a.user_id from lg2_tmp_alvo a
  on conflict do nothing;

  return query
  with montado as (
    select a.user_id,
           up.email as para,
           coalesce(nullif(split_part(btrim(coalesce(up.full_name, '')), ' ', 1), ''), 'tudo bem') as nome,
           cardinality(a.feitos) as k,
           a.parados,
           l.token,
           array(select n from generate_series(1, 10) n where n <> all (a.feitos) order by n) as faltam
    from lg2_tmp_alvo a
    join public.user_profile up on up.id = a.user_id
    join public.lg2_lembrete l on l.user_id = a.user_id
  )
  select m.user_id,
         jsonb_build_object(
           'from', p_de,
           'to', jsonb_build_array(coalesce(nullif(btrim(p_redirecionar_para), ''), m.para)),
           'subject', case
             when m.parados = 2 then 'Último lembrete: seu plano de negócio no Empreenda+'
             when cardinality(m.faltam) <= 3 then 'Falta pouco: ' || cardinality(m.faltam)
               || case when cardinality(m.faltam) = 1 then ' etapa' else ' etapas' end || ' no Empreenda+'
             else 'Sua trilha no Empreenda+ está esperando por você'
           end,
           'headers', jsonb_build_object(
             'List-Unsubscribe', '<' || v_url || '/api/lembretes/sair?t=' || m.token || '>',
             'List-Unsubscribe-Post', 'List-Unsubscribe=One-Click'
           ),
           'html', public.lg2_email_html(
             v_url,
             'Olá, ' || public.lg2_html_escapar(m.nome) || '!',
             '<p style="margin:0 0 12px;">'
               || case when m.k = 0
                    then 'Você começou o Empreenda+, mas ainda não concluiu nenhuma etapa.'
                    else 'Você já concluiu <strong>' || m.k || ' de 10 etapas</strong> do Empreenda+.'
                  end
               || ' No fim da trilha, você pode imprimir o seu plano de negócio.</p>'
               || '<p style="margin:0 0 8px;">'
               || case when cardinality(m.faltam) = 1 then 'Falta esta etapa:' else 'Ainda faltam estas etapas:' end
               || '</p><ul style="margin:0 0 12px;padding-left:20px;">'
               || (select string_agg('<li style="margin:0 0 4px;">Etapa ' || f || ': ' || v_etapas[f] || '</li>', '' order by f)
                   from unnest(m.faltam) f)
               || '</ul><p style="margin:0;">Entre com a mesma conta para continuar de onde parou.</p>',
             v_url || '/lg2/jornada/index.html',
             v_url || '/lembretes/sair?t=' || m.token
           ),
           'text', 'Olá, ' || m.nome || '! '
             || case when m.k = 0 then 'Você começou o Empreenda+, mas ainda não concluiu nenhuma etapa.'
                     else 'Você já concluiu ' || m.k || ' de 10 etapas do Empreenda+.' end
             || E'\n\nAinda faltam: '
             || (select string_agg('Etapa ' || f || ' (' || v_etapas[f] || ')', '; ' order by f) from unnest(m.faltam) f)
             || E'.\n\nContinue de onde parou: ' || v_url || '/lg2/jornada/index.html'
             || E'\n\nNão quer mais receber estes lembretes? ' || v_url || '/lembretes/sair?t=' || m.token
             || E'\n\nMinds of the Future · FACC/UFJF · Governo de Minas Gerais'
         )
  from montado m
  order by m.user_id;
end;
$$;

create or replace function public.lg2_marcar_lembrete_enviado(p_pessoa uuid)
returns void
language sql
security definer
set search_path = 'public'
as $$
  insert into public.lg2_lembrete_enviado (user_id) values (p_pessoa)
  on conflict do nothing
$$;

-- Link "não quero mais receber": sem login, só com o token do e-mail. Devolve
-- true quando o token existe (inclusive se já tinha saído).
create or replace function public.lg2_lembrete_sair(p_token uuid)
returns boolean
language sql
security definer
set search_path = 'public'
as $$
  with alvo as (
    update public.lg2_lembrete set saiu_em = coalesce(saiu_em, now())
    where token = p_token
    returning 1
  )
  select exists (select 1 from alvo)
$$;

revoke execute on function public.lg2_lembretes_pendentes(text, text, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.lg2_marcar_lembrete_enviado(uuid) from public, anon, authenticated;
revoke execute on function public.lg2_lembrete_sair(uuid) from public;
grant execute on function public.lg2_lembretes_pendentes(text, text, text, timestamptz) to gestao_lembrete;
grant execute on function public.lg2_marcar_lembrete_enviado(uuid) to gestao_lembrete;
grant execute on function public.lg2_lembrete_sair(uuid) to anon, authenticated;

commit;
