begin;

create table if not exists gestao.matricula (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references gestao.turma (id) on delete restrict,
  aluno_id uuid not null references gestao.aluno (id) on delete restrict,
  situacao text not null default 'ativa' check (situacao in ('ativa', 'finalizada')),
  finalizada_em timestamptz,
  finalizada_por uuid references auth.users (id) on delete set null,
  motivo text check (motivo is null or char_length(btrim(motivo)) between 3 and 500),
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint matricula_finalizada_com_historico check (
    (situacao = 'ativa' and finalizada_em is null and finalizada_por is null)
    or (situacao = 'finalizada' and finalizada_em is not null and finalizada_por is not null and motivo is not null)
  )
);

create unique index if not exists matricula_ativa_por_turma_aluno
  on gestao.matricula (turma_id, aluno_id) where situacao = 'ativa';
create index if not exists matricula_turma_situacao on gestao.matricula (turma_id, situacao, criado_em);

alter table gestao.matricula enable row level security;
alter table gestao.matricula force row level security;
revoke all on table gestao.matricula from public, anon, authenticated;
grant select on table gestao.matricula to authenticated;

drop policy if exists coordenacao_tudo on gestao.matricula;
create policy coordenacao_tudo on gestao.matricula as permissive for all to authenticated
  using (gestao.usuario_com_papel('coordenacao')) with check (gestao.usuario_com_papel('coordenacao'));

-- gestao.aluno mantém as policies da fundação (coordenacao_tudo + bolsista_le por escola).

create or replace function gestao.cadastrar_aluno_turma(
  p_turma uuid, p_nome text, p_idade integer, p_ano_escolar text, p_execucao text default 'ensino fundamental'
) returns uuid language plpgsql security definer set search_path = 'gestao'
as $$
declare
  v_aluno uuid;
  v_turma gestao.turma%rowtype;
  v_escola gestao.escola%rowtype;
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: apenas a coordenação pode cadastrar alunos' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_nome, ''))) not between 2 and 120 or p_idade not between 3 and 100
     or char_length(btrim(coalesce(p_ano_escolar, ''))) not between 1 and 80
     or char_length(btrim(coalesce(p_execucao, ''))) not between 1 and 80 then
    raise exception 'gestao: confira nome, idade e ano escolar' using errcode = '23514';
  end if;
  select * into v_turma from gestao.turma where id = p_turma for key share;
  if not found then raise exception 'gestao: turma não encontrada' using errcode = 'P0002'; end if;
  select * into v_escola from gestao.escola where id = v_turma.escola_id;
  insert into gestao.aluno (nome, idade, escola_id, categoria_escola, ano_escolar, modalidade, execucao, cidade, criado_por)
    values (btrim(p_nome), p_idade, v_escola.id, v_escola.categoria, btrim(p_ano_escolar), v_turma.modalidade,
      btrim(p_execucao), v_escola.cidade, auth.uid()) returning id into v_aluno;
  insert into gestao.matricula (turma_id, aluno_id, criado_por) values (p_turma, v_aluno, auth.uid());
  return v_aluno;
end;
$$;

create or replace function gestao.cadastrar_lista_alunos_turma(p_turma uuid, p_alunos jsonb)
returns integer language plpgsql security definer set search_path = 'gestao'
as $$
declare
  v_item jsonb;
  v_total integer := 0;
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: apenas a coordenação pode cadastrar alunos' using errcode = '42501';
  end if;
  if jsonb_typeof(p_alunos) <> 'array' or jsonb_array_length(p_alunos) = 0 or jsonb_array_length(p_alunos) > 200 then
    raise exception 'gestao: confira a lista de alunos' using errcode = '23514';
  end if;
  for v_item in select value from jsonb_array_elements(p_alunos)
  loop
    perform gestao.cadastrar_aluno_turma(p_turma, v_item->>'nome', (v_item->>'idade')::integer, v_item->>'anoEscolar', 'ensino fundamental');
    v_total := v_total + 1;
  end loop;
  return v_total;
end;
$$;

create or replace function gestao.finalizar_matricula(p_matricula uuid, p_motivo text)
returns void language plpgsql security definer set search_path = 'gestao'
as $$
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: apenas a coordenação pode finalizar matrículas' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_motivo, ''))) not between 3 and 500 then
    raise exception 'gestao: informe um motivo curto para finalizar' using errcode = '23514';
  end if;
  update gestao.matricula set situacao = 'finalizada', finalizada_em = now(), finalizada_por = auth.uid(), motivo = btrim(p_motivo)
    where id = p_matricula and situacao = 'ativa';
  if not found then raise exception 'gestao: matrícula ativa não encontrada' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function gestao.cadastrar_aluno_turma(uuid,text,integer,text,text) from public, anon;
revoke all on function gestao.finalizar_matricula(uuid,text) from public, anon;
revoke all on function gestao.cadastrar_lista_alunos_turma(uuid,jsonb) from public, anon;
grant execute on function gestao.cadastrar_aluno_turma(uuid,text,integer,text,text) to authenticated;
grant execute on function gestao.finalizar_matricula(uuid,text) to authenticated;
grant execute on function gestao.cadastrar_lista_alunos_turma(uuid,jsonb) to authenticated;

-- Mesmo mecanismo de auditoria já usado pela gestão.
drop trigger if exists registrar_auditoria on gestao.matricula;
create trigger registrar_auditoria after insert or update or delete on gestao.matricula
  for each row execute function gestao.registrar_auditoria();
drop trigger if exists definir_autoria on gestao.matricula;
create trigger definir_autoria before insert or update on gestao.matricula
  for each row execute function gestao.definir_autoria();
drop trigger if exists tocar_atualizado_em on gestao.matricula;
create trigger tocar_atualizado_em before update on gestao.matricula
  for each row execute function gestao.tocar_atualizado_em();

commit;
