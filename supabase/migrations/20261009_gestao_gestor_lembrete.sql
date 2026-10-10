-- Gestor do encontro, relatório ao concluir e lembrete de 24 h (spec 016).
--
-- Depende de 20261009_gestao_concluir_depois_do_inicio.sql. Idempotente. Não
-- aplicar automaticamente: produção é compartilhada.
--
-- O lembrete roda sem usuário logado (tarefa no VPS, ADR 019). Em vez da chave
-- de serviço, proibida no módulo (ADR 021), ele entra com o papel de banco
-- `gestao_lembrete`, que só executa as duas funções abaixo. A senha não fica
-- aqui: é definida em produção e vai para /etc/academy.env (RUNBOOK §8.5).

begin;

-- ---------------------------------------------------------------------------
-- Gestor e relatório
-- ---------------------------------------------------------------------------
alter table gestao.agenda_bolsista add column if not exists gestor boolean not null default false;
alter table gestao.agenda add column if not exists relatorio text check (char_length(relatorio) <= 5000);

-- Mesma regra de 20261009_gestao_concluir_depois_do_inicio.sql, mais o relatório.
create or replace function gestao.agenda_conclusao()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  if tg_op = 'INSERT' then
    new.concluido_em := null;
    return new;
  end if;

  if new.concluido_em is not null and old.concluido_em is null then
    if new.cancelado_em is not null then
      raise exception 'gestao: encontro cancelado não pode ser concluído' using errcode = '23514';
    end if;
    if new.data + coalesce(new.inicio, time '00:00') > (now() at time zone 'America/Sao_Paulo') then
      raise exception 'gestao: só dá para concluir depois da hora de início do encontro' using errcode = '23514';
    end if;
    if char_length(btrim(coalesce(new.relatorio, ''))) < 10 then
      raise exception 'gestao: concluir exige o relatório do encontro, com pelo menos 10 caracteres'
        using errcode = '23514';
    end if;
    new.concluido_em := now();
  elsif new.concluido_em is not null then
    new.concluido_em := old.concluido_em;
  end if;

  if new.concluido_em is not null and new.cancelado_em is not null then
    raise exception 'gestao: encontro concluído não pode ser cancelado; reabra antes' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Concluir ou reabrir: coordenação ou gestor ativo do próprio encontro. SECURITY
-- DEFINER porque o bolsista não tem `update` em agenda; a autoria continua
-- sendo dele na auditoria (auth.uid()).
create or replace function gestao.concluir_encontro(p_agenda uuid, p_relatorio text default null, p_concluir boolean default true)
returns void
language plpgsql
security definer
set search_path = 'gestao'
as $$
begin
  if not (
    gestao.usuario_com_papel('coordenacao')
    or (
      gestao.e_membro()
      and exists (
        select 1 from gestao.agenda_bolsista ab
        where ab.agenda_id = p_agenda and ab.bolsista_id = auth.uid() and ab.gestor
      )
    )
  ) then
    raise exception 'gestao: só a coordenação e os gestores do encontro podem concluí-lo' using errcode = '42501';
  end if;

  if p_concluir then
    update gestao.agenda
      set concluido_em = now(), relatorio = nullif(btrim(coalesce(p_relatorio, '')), '')
      where id = p_agenda;
  else
    update gestao.agenda set concluido_em = null where id = p_agenda;
  end if;
  if not found then
    raise exception 'gestao: encontro não encontrado' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function gestao.concluir_encontro(uuid, text, boolean) from public, anon;
grant execute on function gestao.concluir_encontro(uuid, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Página do encontro para o bolsista
-- ---------------------------------------------------------------------------
-- Nomes da equipe para qualquer membro (gestao.equipe() é só da coordenação e
-- traz e-mail e bolsa; aqui só o nome).
create or replace function gestao.nomes_da_equipe()
returns table (user_profile_id uuid, nome text)
language plpgsql
stable
security definer
set search_path = 'gestao', 'public'
as $$
#variable_conflict use_column
begin
  if not gestao.e_membro() then
    raise exception 'gestao: apenas membros do projeto veem a equipe' using errcode = '42501';
  end if;
  return query
    select m.user_profile_id, coalesce(nullif(btrim(up.full_name), ''), 'Pessoa da equipe')
    from gestao.papel_membro m
    left join public.user_profile up on up.id = m.user_profile_id;
end;
$$;

revoke execute on function gestao.nomes_da_equipe() from public, anon;
grant execute on function gestao.nomes_da_equipe() to authenticated;

-- O bolsista lê a turma dos encontros em que está alocado (nome e situação na página).
drop policy if exists "bolsista_le" on gestao.turma;
create policy "bolsista_le" on gestao.turma
  as permissive for select to authenticated
  using (exists (select 1 from gestao.agenda a where a.turma_id = turma.id and gestao.bolsista_na_agenda(a.id)));

-- ---------------------------------------------------------------------------
-- Lembrete de 24 h
-- ---------------------------------------------------------------------------
create table if not exists gestao.lembrete_enviado (
  alocacao_id uuid primary key references gestao.agenda_bolsista (id) on delete cascade,
  enviado_em timestamptz not null default now()
);
alter table gestao.lembrete_enviado enable row level security;
alter table gestao.lembrete_enviado force row level security;
revoke all on table gestao.lembrete_enviado from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'gestao_lembrete') then
    create role gestao_lembrete nologin;
  end if;
end;
$$;
grant usage on schema gestao to gestao_lembrete;

-- Alocações ativas de encontros que começam nas próximas 24 h (Brasília) e
-- ainda sem lembrete, com o e-mail pronto no formato da API do Resend. O
-- `p_redirecionar_para` repete o RESEND_TEST_RECIPIENT do site.
create or replace function gestao.lembretes_pendentes(p_de text, p_url_base text, p_redirecionar_para text default null)
returns table (alocacao_id uuid, email jsonb)
language sql
stable
security definer
set search_path = 'gestao', 'public'
as $$
  select
    ab.id,
    jsonb_build_object(
      'from', p_de,
      'to', jsonb_build_array(coalesce(nullif(btrim(p_redirecionar_para), ''), up.email)),
      'subject', 'Lembrete: ' || a.modalidade || ' em ' || to_char(a.data, 'DD/MM') || ', ' || a.horario,
      'text',
        'Olá, ' || coalesce(nullif(btrim(up.full_name), ''), 'bolsista') || '.' || E'\n\n'
        || 'Você está na equipe deste encontro:' || E'\n'
        || to_char(a.data, 'DD/MM') || ' · ' || a.horario || ' · ' || a.modalidade
        || coalesce(' · ' || t.nome, '') || ' · ' || coalesce(e.nome, 'fora de escola') || E'\n\n'
        || 'Detalhes: ' || rtrim(p_url_base, '/') || '/gestao/encontro/' || a.id || E'\n\n'
        || 'Se não puder ir, avise a coordenação o quanto antes.'
    )
  from gestao.agenda_bolsista ab
  join gestao.agenda a on a.id = ab.agenda_id
  join gestao.papel_membro m on m.user_profile_id = ab.bolsista_id and m.desligado_em is null
  join public.user_profile up on up.id = ab.bolsista_id
  left join gestao.turma t on t.id = a.turma_id
  left join gestao.escola e on e.id = a.escola_id
  where ab.situacao = 'prevista'
    and a.cancelado_em is null
    and a.inicio is not null
    and coalesce(t.status, '') <> 'nao_abriu'
    and up.email is not null
    and a.data + a.inicio > (now() at time zone 'America/Sao_Paulo')
    and a.data + a.inicio <= (now() at time zone 'America/Sao_Paulo') + interval '24 hours'
    and not exists (select 1 from gestao.lembrete_enviado l where l.alocacao_id = ab.id)
$$;

create or replace function gestao.marcar_lembrete_enviado(p_alocacao uuid)
returns void
language sql
security definer
set search_path = 'gestao'
as $$
  insert into gestao.lembrete_enviado (alocacao_id) values (p_alocacao) on conflict do nothing
$$;

revoke execute on function gestao.lembretes_pendentes(text, text, text) from public, anon, authenticated;
revoke execute on function gestao.marcar_lembrete_enviado(uuid) from public, anon, authenticated;
grant execute on function gestao.lembretes_pendentes(text, text, text) to gestao_lembrete;
grant execute on function gestao.marcar_lembrete_enviado(uuid) to gestao_lembrete;

commit;
