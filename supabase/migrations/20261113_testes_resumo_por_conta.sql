-- Painel /gestao/testes: lista toda conta que usou o app do Laboratório de Gestão.
-- Não aplicar automaticamente: aplicada pelo responsável antes do deploy.
--
-- Antes, gestao_testes_resumo() só listava quem entrou pelo /teste com nome + CPF
-- (public.teste_participante). Agora o /teste usa a conta normal do site, então a
-- lista passa a vir dos eventos lg2_* de public.telemetry_learning_event:
--   nome             = teste_participante.nome, senão user_profile.full_name
--   cpf              = teste_participante.cpf (nulo para quem não passou pelo formulário antigo)
--   acessos          = dias distintos com evento lg2 (ou teste_participante.acessos, se maior)
--   ultimo_acesso_em = último evento lg2 (ou o último acesso antigo, se mais recente)
-- As linhas antigas de teste_participante continuam aparecendo, mesmo sem evento.
-- A assinatura (colunas e tipos) é a mesma da 20261111, por isso basta o create or replace.

create or replace function public.gestao_testes_resumo()
returns table (
  user_id uuid, nome text, cpf char(11), acessos integer, ultimo_acesso_em timestamptz,
  modulos_abertos integer, modulos_concluidos integer, jornada_concluida boolean
) language sql stable security definer set search_path = '' as $$
  with eventos as (
    select e.user_id,
      count(distinct (e.metadata->>'modulo')::integer)
        filter (where e.event_name = 'lg2_module_opened')::integer as abertos,
      count(distinct (e.metadata->>'modulo')::integer)
        filter (where e.event_name = 'lg2_module_completed')::integer as concluidos,
      coalesce(bool_or(e.event_name = 'lg2_journey_completed'), false) as jornada,
      count(distinct (e.occurred_at at time zone 'America/Sao_Paulo')::date)::integer as dias,
      max(e.occurred_at) as ultimo
    from public.telemetry_learning_event e
    where e.user_id is not null
      and e.event_name in ('lg2_module_opened', 'lg2_module_completed', 'lg2_journey_completed')
    group by e.user_id
  ),
  contas as (
    select ev.user_id from eventos ev
    union
    select tp.user_id from public.teste_participante tp
  )
  select c.user_id,
    coalesce(tp.nome, up.full_name, 'Sem nome'),
    tp.cpf,
    greatest(coalesce(ev.dias, 0), coalesce(tp.acessos, 0))::integer,
    greatest(ev.ultimo, tp.ultimo_acesso_em),
    coalesce(ev.abertos, 0),
    coalesce(ev.concluidos, 0),
    coalesce(ev.jornada, false)
  from contas c
  left join eventos ev on ev.user_id = c.user_id
  left join public.teste_participante tp on tp.user_id = c.user_id
  left join public.user_profile up on up.id = c.user_id
  where public.gestao_membro_papel() = 'coordenacao'
  order by 5 desc nulls last;
$$;
revoke execute on function public.gestao_testes_resumo() from public, anon;
grant execute on function public.gestao_testes_resumo() to authenticated;
