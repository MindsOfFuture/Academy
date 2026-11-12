-- Agenda por espaço (pedido da coordenação em 12/11/2026).
--
--   - gestao.espaco: salas e outros lugares, cadastrados pela coordenação.
--     Nada se apaga: espaço fora de uso fica inativo. Todos os membros leem.
--   - agenda.espaco_id (opcional) e agenda.tipo (aula, impressão, gravação,
--     reunião, outro; padrão aula). Dois encontros no mesmo espaço e horário só
--     geram aviso na tela; o banco não impede.
--   - agenda_bolsista.funcao: responsável ou apoio (padrão apoio). As duas
--     contam as mesmas horas: a v_carga não muda.
--   - substituir_alocacao: quem entra herda a função de quem sai.
--
-- Depende de 20261115_gestao_atrasos_e_metas.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

-- ---------------------------------------------------------------------------
-- Espaço
-- ---------------------------------------------------------------------------
create table if not exists gestao.espaco (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 2 and 80),
  ativo boolean not null default true,
  teste boolean not null default gestao.sou_teste(),
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null
);

create unique index if not exists espaco_nome_unico on gestao.espaco (lower(btrim(nome)), teste);

alter table gestao.espaco enable row level security;
alter table gestao.espaco force row level security;

drop trigger if exists definir_autoria on gestao.espaco;
create trigger definir_autoria before insert or update on gestao.espaco
  for each row execute function gestao.definir_autoria();
drop trigger if exists registrar_auditoria on gestao.espaco;
create trigger registrar_auditoria after insert or update or delete on gestao.espaco
  for each row execute function gestao.registrar_auditoria();

revoke all on table gestao.espaco from public, anon, authenticated;
grant select, insert, update on table gestao.espaco to authenticated;

drop policy if exists "coordenacao_tudo" on gestao.espaco;
create policy "coordenacao_tudo" on gestao.espaco
  as permissive for all to authenticated
  using (gestao.usuario_com_papel('coordenacao'))
  with check (gestao.usuario_com_papel('coordenacao'));

drop policy if exists "membro_le" on gestao.espaco;
create policy "membro_le" on gestao.espaco
  as permissive for select to authenticated
  using (gestao.e_membro());

-- Espaço do E2E não aparece para a equipe real, e vice-versa (como meta).
drop policy if exists "teste_separado" on gestao.espaco;
create policy "teste_separado" on gestao.espaco
  as restrictive for all to authenticated
  using (teste = gestao.sou_teste())
  with check (teste = gestao.sou_teste());

-- ---------------------------------------------------------------------------
-- Agenda: espaço e tipo; alocação: função
-- ---------------------------------------------------------------------------
alter table gestao.agenda
  add column if not exists espaco_id uuid references gestao.espaco (id) on delete restrict;
alter table gestao.agenda add column if not exists tipo text not null default 'aula';
alter table gestao.agenda_bolsista add column if not exists funcao text not null default 'apoio';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'agenda_tipo' and conrelid = 'gestao.agenda'::regclass
  ) then
    alter table gestao.agenda add constraint agenda_tipo
      check (tipo in ('aula', 'impressao', 'gravacao', 'reuniao', 'outro'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'agenda_bolsista_funcao' and conrelid = 'gestao.agenda_bolsista'::regclass
  ) then
    alter table gestao.agenda_bolsista add constraint agenda_bolsista_funcao
      check (funcao in ('responsavel', 'apoio'));
  end if;
end;
$$;

create index if not exists agenda_espaco_data on gestao.agenda (espaco_id, data) where espaco_id is not null;

-- ---------------------------------------------------------------------------
-- Substituição: quem entra herda a função (corpo de 20261009_gestao_substituto_de_fora.sql)
-- ---------------------------------------------------------------------------
create or replace function gestao.substituir_alocacao(p_alocacao uuid, p_substituto uuid, p_motivo text default null)
returns uuid
language plpgsql
security invoker
set search_path = 'gestao'
as $$
declare
  v_agenda uuid;
  v_nova uuid;
begin
  select ab.agenda_id into v_agenda from gestao.agenda_bolsista ab where ab.id = p_alocacao;
  if exists (
    select 1 from gestao.agenda_bolsista ab
    where ab.agenda_id = v_agenda and ab.bolsista_id = p_substituto
  ) then
    raise exception 'gestao: esta pessoa já está no encontro e não pode substituir ninguém nele' using errcode = '23514';
  end if;

  update gestao.agenda_bolsista
    set situacao = 'substituida',
        coberto_por = p_substituto,
        motivo = nullif(btrim(coalesce(p_motivo, '')), ''),
        inicio = null,
        fim = null
    where id = p_alocacao
      and situacao in ('prevista', 'faltou_avisou', 'faltou_sem_aviso')
    returning agenda_id into v_agenda;
  if v_agenda is null then
    raise exception 'gestao: só dá para substituir uma alocação prevista ou com falta' using errcode = '23514';
  end if;

  insert into gestao.agenda_bolsista (agenda_id, bolsista_id, funcao)
    select v_agenda, p_substituto, ab.funcao
    from gestao.agenda_bolsista ab
    where ab.id = p_alocacao
    returning id into v_nova;
  return v_nova;
end;
$$;

revoke execute on function gestao.substituir_alocacao(uuid, uuid, text) from public, anon;
grant execute on function gestao.substituir_alocacao(uuid, uuid, text) to authenticated;

commit;
