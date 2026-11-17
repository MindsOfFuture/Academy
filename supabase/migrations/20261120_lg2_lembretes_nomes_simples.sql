-- Nomes das etapas do Empreenda+ em palavras simples (lote auditoria 17/11) também
-- no e-mail de lembrete. Só troca a lista de nomes de lg2_lembretes_pendentes; o resto
-- da função é idêntico a 20261119_lg2_lembretes.sql. Os grants seguem (create or replace).
-- Não aplicar automaticamente: aplicada à mão antes do deploy do código.

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
    'Você e a sua ideia de negócio',
    'Quem são seus clientes e como compram',
    'Mercado, concorrentes e oportunidades',
    'Produto, por que comprar de você e teste da ideia',
    'Custos, preço e quanto sobra',
    'Dinheiro para começar e para os primeiros meses',
    'Como você produz, compra e entrega',
    'Abrir o seu negócio: CNPJ, MEI e impostos',
    'Licenças e endereço',
    'Vendas, pessoas e plano de ação'
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
