-- Participantes do teste público do Laboratório de Gestão.
-- Não aplicar automaticamente: esta migration é executada pelo lane de Ops.

create table public.teste_participante (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) between 3 and 120),
  cpf char(11) not null unique check (cpf ~ '^[0-9]{11}$'),
  primeiro_acesso_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz not null default now(),
  acessos integer not null default 1 check (acessos > 0)
);

alter table public.teste_participante enable row level security;
revoke all on table public.teste_participante from public, anon, authenticated;

create or replace function public.registrar_teste_participante(p_user_id uuid, p_nome text, p_cpf char(11))
returns void language sql volatile security definer set search_path = '' as $$
  insert into public.teste_participante (user_id, nome, cpf)
  values (p_user_id, trim(p_nome), p_cpf)
  on conflict (user_id) do update set
    nome = excluded.nome,
    ultimo_acesso_em = now(),
    acessos = public.teste_participante.acessos + 1;
$$;
revoke execute on function public.registrar_teste_participante(uuid, text, char) from public, anon, authenticated;
grant execute on function public.registrar_teste_participante(uuid, text, char) to service_role;

create or replace function public.gestao_testes_resumo()
returns table (
  user_id uuid, nome text, cpf char(11), acessos integer, ultimo_acesso_em timestamptz,
  modulos_abertos integer, modulos_concluidos integer, jornada_concluida boolean
) language sql stable security definer set search_path = '' as $$
  select p.user_id, p.nome, p.cpf, p.acessos, p.ultimo_acesso_em,
    count(distinct (e.metadata->>'modulo')::integer)
      filter (where e.event_name = 'lg2_module_opened')::integer,
    count(distinct (e.metadata->>'modulo')::integer)
      filter (where e.event_name = 'lg2_module_completed')::integer,
    coalesce(bool_or(e.event_name = 'lg2_journey_completed'), false)
  from public.teste_participante p
  left join public.telemetry_learning_event e on e.user_id = p.user_id
    and e.event_name in ('lg2_module_opened', 'lg2_module_completed', 'lg2_journey_completed')
  where public.gestao_membro_papel() = 'coordenacao'
  group by p.user_id, p.nome, p.cpf, p.acessos, p.ultimo_acesso_em
  order by p.ultimo_acesso_em desc;
$$;
revoke execute on function public.gestao_testes_resumo() from public, anon;
grant execute on function public.gestao_testes_resumo() to authenticated;
