-- Chamada dos alunos no encontro (pedido da coordenação em 15/11/2026).
--
--   - gestao.aluno_turma: lista de alunos da turma, opcional. A coordenação
--     preenche no cadastro da turma ou depois. Quem sai da lista fica inativo
--     (a chamada antiga continua apontando para ele).
--   - gestao.definir_alunos: troca a lista inteira de uma vez e, se pedido,
--     põe o total no número de alunos do curso mais recente da turma (que a
--     coordenação ainda pode mudar à mão).
--   - gestao.falta_aluno + gestao.registrar_chamada: na chamada todos começam
--     presentes e quem esteve no encontro desmarca quem faltou. Grava as
--     faltas e o total de presentes do encontro (pela registrar_presentes,
--     com as mesmas regras de quem pode e quando).
--
-- Depende de 20261119_gestao_cursos_da_turma.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

create table if not exists gestao.aluno_turma (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references gestao.turma (id) on delete restrict,
  nome text not null check (char_length(btrim(nome)) between 2 and 120),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null
);

-- O nome identifica o aluno dentro da turma: é assim que a lista é trocada.
create unique index if not exists aluno_turma_nome on gestao.aluno_turma (turma_id, lower(btrim(nome)));

create table if not exists gestao.falta_aluno (
  agenda_id uuid not null references gestao.agenda (id) on delete cascade,
  aluno_id uuid not null references gestao.aluno_turma (id) on delete restrict,
  criado_em timestamptz not null default now(),
  primary key (agenda_id, aluno_id)
);

alter table gestao.aluno_turma enable row level security;
alter table gestao.aluno_turma force row level security;
alter table gestao.falta_aluno enable row level security;
alter table gestao.falta_aluno force row level security;

revoke all on table gestao.aluno_turma from public, anon, authenticated;
grant select, insert, update on table gestao.aluno_turma to authenticated;
-- Falta só se grava pela registrar_chamada.
revoke all on table gestao.falta_aluno from public, anon, authenticated;
grant select on table gestao.falta_aluno to authenticated;

drop policy if exists "coordenacao_tudo" on gestao.aluno_turma;
create policy "coordenacao_tudo" on gestao.aluno_turma
  as permissive for all to authenticated
  using (gestao.usuario_com_papel('coordenacao'))
  with check (gestao.usuario_com_papel('coordenacao'));

-- O bolsista lê os alunos das turmas dos encontros em que está, para a chamada.
drop policy if exists "bolsista_le" on gestao.aluno_turma;
create policy "bolsista_le" on gestao.aluno_turma
  as permissive for select to authenticated
  using (exists (
    select 1 from gestao.agenda a where a.turma_id = aluno_turma.turma_id and gestao.bolsista_na_agenda(a.id)
  ));

drop policy if exists "le_faltas" on gestao.falta_aluno;
create policy "le_faltas" on gestao.falta_aluno
  as permissive for select to authenticated
  using (gestao.usuario_com_papel('coordenacao') or gestao.bolsista_na_agenda(agenda_id));

drop trigger if exists definir_autoria on gestao.aluno_turma;
create trigger definir_autoria before insert or update on gestao.aluno_turma
  for each row execute function gestao.definir_autoria();
drop trigger if exists tocar_atualizado_em on gestao.aluno_turma;
create trigger tocar_atualizado_em before update on gestao.aluno_turma
  for each row execute function gestao.tocar_atualizado_em();
drop trigger if exists registrar_auditoria on gestao.aluno_turma;
create trigger registrar_auditoria after insert or update or delete on gestao.aluno_turma
  for each row execute function gestao.registrar_auditoria();

-- Troca a lista: quem não veio fica inativo, quem voltou reativa, quem é novo
-- entra. Nome repetido (sem diferença de maiúscula ou espaço) conta uma vez.
-- Devolve quantos ficaram ativos.
create or replace function gestao.definir_alunos(p_turma uuid, p_nomes text[], p_atualizar_numero boolean default true)
returns integer
language plpgsql
volatile
security invoker
set search_path = 'gestao'
as $$
declare
  v_chaves text[];
  v_total integer;
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: só a coordenação define os alunos da turma' using errcode = '42501';
  end if;
  if not exists (select 1 from gestao.turma where id = p_turma) then
    raise exception 'gestao: turma não encontrada' using errcode = 'P0002';
  end if;

  v_chaves := array(
    select distinct lower(btrim(n)) from unnest(coalesce(p_nomes, '{}'::text[])) n where btrim(n) <> ''
  );

  update gestao.aluno_turma a set ativo = (lower(btrim(a.nome)) = any (v_chaves))
  where a.turma_id = p_turma and a.ativo <> (lower(btrim(a.nome)) = any (v_chaves));

  insert into gestao.aluno_turma (turma_id, nome)
  select distinct on (lower(btrim(n))) p_turma, btrim(n)
  from unnest(coalesce(p_nomes, '{}'::text[])) n
  where btrim(n) <> ''
    and not exists (
      select 1 from gestao.aluno_turma a where a.turma_id = p_turma and lower(btrim(a.nome)) = lower(btrim(n))
    )
  order by lower(btrim(n));

  select count(*)::integer into v_total from gestao.aluno_turma where turma_id = p_turma and ativo;

  -- Lista vazia não zera o número: ele pode ter sido informado à mão.
  if p_atualizar_numero and v_total > 0 then
    update gestao.turma_curso set n_alunos = v_total
    where id = (
      select c.id from gestao.turma_curso c where c.turma_id = p_turma order by c.inicio desc, c.criado_em desc limit 1
    );
  end if;
  return v_total;
end;
$$;

revoke execute on function gestao.definir_alunos(uuid, text[], boolean) from public, anon;
grant execute on function gestao.definir_alunos(uuid, text[], boolean) to authenticated;

-- Chamada: grava quem faltou e o total de presentes (alunos ativos da turma
-- menos as faltas). Quem pode e quando é o mesmo da registrar_presentes.
create or replace function gestao.registrar_chamada(p_agenda uuid, p_ausentes uuid[])
returns integer
language plpgsql
volatile
security definer
set search_path = 'gestao'
as $$
declare
  v_turma uuid;
  v_ativos integer;
  v_presentes integer;
begin
  if not gestao.e_membro() then
    raise exception 'gestao: apenas membros do projeto registram os presentes' using errcode = '42501';
  end if;
  select turma_id into v_turma from gestao.agenda where id = p_agenda;
  if not found then
    raise exception 'gestao: encontro não encontrado' using errcode = 'P0002';
  end if;
  select count(*)::integer into v_ativos from gestao.aluno_turma where turma_id = v_turma and ativo;
  if v_turma is null or v_ativos = 0 then
    raise exception 'gestao: só encontro de turma com alunos cadastrados tem chamada' using errcode = '23514';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_ausentes, '{}'::uuid[])) f
    where not exists (select 1 from gestao.aluno_turma a where a.id = f and a.turma_id = v_turma and a.ativo)
  ) then
    raise exception 'gestao: aluno fora da lista da turma' using errcode = '23514';
  end if;

  v_presentes := v_ativos - (select count(distinct f)::integer from unnest(coalesce(p_ausentes, '{}'::uuid[])) f);
  -- Confere membro, permissão, cancelamento e horário, e grava o total.
  perform gestao.registrar_presentes(p_agenda, v_presentes);

  -- Só as faltas de quem está na lista: a de quem saiu dela fica como foi.
  delete from gestao.falta_aluno f
  where f.agenda_id = p_agenda
    and exists (select 1 from gestao.aluno_turma a where a.id = f.aluno_id and a.ativo);
  insert into gestao.falta_aluno (agenda_id, aluno_id)
  select distinct p_agenda, f from unnest(coalesce(p_ausentes, '{}'::uuid[])) f;
  return v_presentes;
end;
$$;

revoke execute on function gestao.registrar_chamada(uuid, uuid[]) from public, anon;
grant execute on function gestao.registrar_chamada(uuid, uuid[]) to authenticated;

commit;
