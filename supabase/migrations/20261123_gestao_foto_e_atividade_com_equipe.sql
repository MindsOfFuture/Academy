-- Foto de comprovação, atividade com outras pessoas e horário (pedido da
-- coordenação em 21/11/2026).
--
-- 1. Onde hoje vai o link de comprovação (encontro e outras atividades do
--    relatório) também vai uma foto, guardada no bucket privado
--    `gestao-comprovacao` (20261123_comprovacao_foto_storage.sql) na pasta de
--    quem enviou: "<id da pessoa>/<uuid>.<jpg|png|webp>". A coluna guarda esse
--    caminho; o relatório .docx põe a foto na tabela.
-- 2. Outras atividades ganham início, fim e participantes (colegas da equipe).
--    A atividade aparece no relatório de cada participante; só o autor edita.
-- 3. `gestao.colegas()`: quem está ativo na equipe, para escolher participantes
--    (a atividade) e colegas (o encontro do bolsista, migração seguinte).
--
-- Depende de 20261122_gestao_calendario_da_equipe.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

-- ---------------------------------------------------------------------------
-- Colegas ativos da equipe (sem quem chama), separando teste do real
-- ---------------------------------------------------------------------------
create or replace function gestao.colegas()
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
    left join public.user_profile up on up.id = m.user_profile_id
    where m.desligado_em is null
      and m.teste = gestao.sou_teste()
      and m.user_profile_id <> auth.uid()
    order by 2;
end;
$$;

revoke execute on function gestao.colegas() from public, anon;
grant execute on function gestao.colegas() to authenticated;

-- ---------------------------------------------------------------------------
-- Foto no encontro
-- ---------------------------------------------------------------------------
alter table gestao.agenda_bolsista add column if not exists foto_comprovacao text
  check (foto_comprovacao ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$');

-- A assinatura muda: sem o drop ficariam duas funções.
drop function if exists gestao.escrever_link_comprovacao(uuid, text);

-- Mesmo corpo da de 20261112, mais a foto. Grava os dois como vierem: a tela
-- manda um e apaga o outro.
create or replace function gestao.escrever_link_comprovacao(p_agenda uuid, p_link text, p_foto text default null)
returns void
language plpgsql
security definer
set search_path = 'gestao'
as $$
declare
  v_link text := nullif(btrim(coalesce(p_link, '')), '');
  v_foto text := nullif(btrim(coalesce(p_foto, '')), '');
  v_encontro gestao.agenda%rowtype;
begin
  if not gestao.e_membro() then
    raise exception 'gestao: apenas membros do projeto informam o link de comprovação' using errcode = '42501';
  end if;
  if v_link is not null and (char_length(v_link) > 500 or v_link !~ '^https?://[^[:space:]]+$') then
    raise exception 'gestao: o link de comprovação precisa começar com http:// ou https://, sem espaços, com até 500 caracteres'
      using errcode = '23514';
  end if;
  -- Só uma foto da própria pasta: ninguém aponta para o arquivo de outra pessoa.
  if v_foto is not null and (
       v_foto !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$' or split_part(v_foto, '/', 1) <> auth.uid()::text
     ) then
    raise exception 'gestao: foto de comprovação inválida' using errcode = '23514';
  end if;

  select * into v_encontro from gestao.agenda where id = p_agenda;
  if not found then
    raise exception 'gestao: encontro não encontrado' using errcode = 'P0002';
  end if;
  if v_encontro.cancelado_em is not null then
    raise exception 'gestao: encontro cancelado não recebe link de comprovação' using errcode = '23514';
  end if;
  if v_encontro.data + coalesce(v_encontro.inicio, time '00:00') > (now() at time zone 'America/Sao_Paulo') then
    raise exception 'gestao: o link de comprovação só abre depois da hora de início do encontro' using errcode = '23514';
  end if;

  update gestao.agenda_bolsista
    set link_comprovacao = v_link, foto_comprovacao = v_foto
    where agenda_id = p_agenda and bolsista_id = auth.uid() and situacao in ('prevista', 'cumprida');
  if not found then
    raise exception 'gestao: só quem esteve no encontro informa o link de comprovação' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function gestao.escrever_link_comprovacao(uuid, text, text) from public, anon;
grant execute on function gestao.escrever_link_comprovacao(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Outras atividades: foto, horário e participantes
-- ---------------------------------------------------------------------------
alter table gestao.atividade_relatorio
  add column if not exists foto_comprovacao text,
  add column if not exists inicio time,
  add column if not exists fim time,
  add column if not exists participantes uuid[] not null default '{}';

alter table gestao.atividade_relatorio drop constraint if exists atividade_relatorio_foto_check;
alter table gestao.atividade_relatorio add constraint atividade_relatorio_foto_check
  check (
    foto_comprovacao ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
    and split_part(foto_comprovacao, '/', 1) = user_profile_id::text
  );

-- Atividades antigas ficam sem horário; as novas a tela exige.
alter table gestao.atividade_relatorio drop constraint if exists atividade_relatorio_horario_check;
alter table gestao.atividade_relatorio add constraint atividade_relatorio_horario_check
  check ((inicio is null) = (fim is null) and (fim is null or fim > inicio));

alter table gestao.atividade_relatorio drop constraint if exists atividade_relatorio_participantes_check;
alter table gestao.atividade_relatorio add constraint atividade_relatorio_participantes_check
  check (cardinality(participantes) <= 30 and not (user_profile_id = any (participantes)));

grant update (foto_comprovacao, inicio, fim, participantes) on table gestao.atividade_relatorio to authenticated;

-- Participante novo precisa ser da equipe ativa, do mesmo lado (teste ou real)
-- do autor. Quem já estava e saiu da equipe não trava a edição.
create or replace function gestao.atividade_participantes_da_equipe()
returns trigger
language plpgsql
security definer
set search_path = 'gestao'
as $$
declare
  v_antes uuid[] := case when tg_op = 'UPDATE' then old.participantes else '{}' end;
begin
  new.participantes := array(select distinct p from unnest(new.participantes) p);
  if exists (
    select 1 from unnest(new.participantes) p
    where p <> all (v_antes)
      and not exists (
        select 1 from gestao.papel_membro m
        where m.user_profile_id = p
          and m.desligado_em is null
          and m.teste = coalesce((select a.teste from gestao.papel_membro a where a.user_profile_id = new.user_profile_id), false)
      )
  ) then
    raise exception 'gestao: só pessoas da equipe participam da atividade' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists atividade_participantes_da_equipe on gestao.atividade_relatorio;
create trigger atividade_participantes_da_equipe
  before insert or update of participantes on gestao.atividade_relatorio
  for each row execute function gestao.atividade_participantes_da_equipe();

-- O participante lê a atividade (para o próprio relatório); editar segue só do dono.
drop policy if exists "participante_le" on gestao.atividade_relatorio;
create policy "participante_le" on gestao.atividade_relatorio
  for select to authenticated
  using (auth.uid() = any (participantes));

commit;
