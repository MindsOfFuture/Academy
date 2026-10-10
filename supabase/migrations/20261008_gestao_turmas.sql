-- M1 (spec 014): amplia os registros existentes sem importar dados reais.
-- Documentos permanecem bloqueados até definição de retenção e revisão de políticas.
begin;

create table if not exists gestao.turma (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references gestao.escola(id) on delete restrict,
  reserva_id uuid references gestao.reserva(id) on delete restrict,
  nome text not null check (length(btrim(nome)) between 1 and 120),
  modalidade text not null check (length(btrim(modalidade)) between 1 and 80),
  semestre text not null check (semestre ~ '^20[0-9]{2}/[12]$'),
  status text not null default 'planejada' check (status in ('planejada','em_andamento','encerrada','cancelada')),
  encerrada_em timestamptz,
  encerrada_por uuid references auth.users(id) on delete set null,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create table if not exists gestao.matricula (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references gestao.turma(id) on delete restrict,
  aluno_id uuid not null references gestao.aluno(id) on delete restrict,
  inicio date not null default current_date,
  fim date,
  termo_status text not null default 'pendente' check (termo_status in ('pendente','legado_arquivado','arquivado')),
  certificado_entregue_em date,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(turma_id,aluno_id),
  check(fim is null or fim >= inicio)
);
create table if not exists gestao.turma_bolsista (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references gestao.turma(id) on delete restrict,
  bolsista_id uuid not null references gestao.papel_membro(user_profile_id) on delete restrict,
  revogado_em timestamptz,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(turma_id,bolsista_id)
);
create table if not exists gestao.matricula_termo (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null unique references gestao.matricula(id) on delete restrict,
  reserva_termo_id uuid unique references gestao.reserva_termo(id) on delete restrict,
  arquivo_path text unique,
  conferido_por uuid references auth.users(id) on delete set null,
  conferido_em timestamptz,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create table if not exists gestao.importacao_matricula (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references gestao.turma(id) on delete restrict,
  origem text not null,
  periodo text not null,
  lote text not null,
  assinatura text not null,
  quantidade integer not null,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(turma_id,origem,periodo,lote)
);

alter table gestao.agenda add column if not exists turma_id uuid references gestao.turma(id) on delete restrict;
alter table gestao.agenda add column if not exists inicio time;
alter table gestao.agenda add column if not exists fim time;
alter table gestao.agenda add column if not exists professor text;
alter table gestao.aula add column if not exists m1 boolean not null default false;
alter table gestao.presenca add column if not exists atualizado_por uuid references auth.users(id) on delete set null;
alter table gestao.presenca add column if not exists atualizado_em timestamptz not null default now();
-- Não altera os valores históricos; ausência de linha é a informação desconhecida.
alter table gestao.presenca alter column presente drop default;
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='gestao.agenda'::regclass and conname='agenda_horario') then
    alter table gestao.agenda add constraint agenda_horario check (
      turma_id is null or (inicio is not null and fim is not null and fim > inicio));
  end if;
end $$;
create unique index if not exists aula_m1_agenda on gestao.aula(agenda_id) where m1;
create index if not exists agenda_turma on gestao.agenda(turma_id);
create index if not exists matricula_aluno on gestao.matricula(aluno_id);
create index if not exists turma_bolsista_ativo on gestao.turma_bolsista(bolsista_id,turma_id) where revogado_em is null;

create or replace function gestao.bolsista_na_turma(p_turma uuid)
returns boolean language sql stable security definer set search_path='gestao'
as $$ select gestao.usuario_com_papel('bolsista') and exists(
  select 1 from gestao.turma_bolsista where turma_id=p_turma and bolsista_id=auth.uid() and revogado_em is null)
$$;
create or replace function gestao.bolsista_na_agenda(p_agenda uuid)
returns boolean language sql stable security definer set search_path='gestao'
as $$ select gestao.usuario_com_papel('bolsista') and exists(
  select 1 from gestao.agenda a where a.id=p_agenda and
    case when a.turma_id is not null then gestao.bolsista_na_turma(a.turma_id)
    else exists(select 1 from gestao.agenda_bolsista ab where ab.agenda_id=a.id and ab.bolsista_id=auth.uid()) end)
$$;
create or replace function gestao.bolsista_na_aula(p_aula uuid)
returns boolean language sql stable security definer set search_path='gestao'
as $$ select exists(select 1 from gestao.aula a where a.id=p_aula and gestao.bolsista_na_agenda(a.agenda_id)) $$;
create or replace function gestao.bolsista_na_escola(p_escola uuid)
returns boolean language sql stable security definer set search_path='gestao'
as $$ select gestao.usuario_com_papel('bolsista') and (
  exists(select 1 from gestao.turma t where t.escola_id=p_escola and gestao.bolsista_na_turma(t.id)) or
  exists(select 1 from gestao.agenda a join gestao.agenda_bolsista ab on ab.agenda_id=a.id
         where a.turma_id is null and a.escola_id=p_escola and ab.bolsista_id=auth.uid()))
$$;
create or replace function gestao.bolsista_no_aluno(p_aluno uuid)
returns boolean language sql stable security definer set search_path='gestao'
as $$ select gestao.usuario_com_papel('bolsista') and (
  exists(select 1 from gestao.matricula m where m.aluno_id=p_aluno and gestao.bolsista_na_turma(m.turma_id)) or
  (not exists(select 1 from gestao.matricula m where m.aluno_id=p_aluno) and
   exists(select 1 from gestao.aluno al join gestao.agenda a on a.escola_id=al.escola_id
          join gestao.agenda_bolsista ab on ab.agenda_id=a.id
          where al.id=p_aluno and a.turma_id is null and ab.bolsista_id=auth.uid())))
$$;
-- A leitura legada por escola nunca prevalece sobre a matrícula de outra turma.
drop policy if exists bolsista_le on gestao.aluno;
create policy bolsista_le on gestao.aluno for select to authenticated using(gestao.bolsista_no_aluno(id));

-- As políticas antigas de aula/presença passam pelas portas refinadas acima.
-- O delete abaixo permite corrigir uma marca para não informado somente no M1.
drop policy if exists bolsista_limpa_m1 on gestao.presenca;
create policy bolsista_limpa_m1 on gestao.presenca for delete to authenticated using (
  gestao.bolsista_na_aula(aula_id) and exists(
    select 1 from gestao.aula au join gestao.agenda a on a.id=au.agenda_id where au.id=aula_id and a.turma_id is not null));

do $$ declare t text; begin
  foreach t in array array['turma','matricula','turma_bolsista','matricula_termo','importacao_matricula'] loop
    execute format('alter table gestao.%I enable row level security',t);
    execute format('alter table gestao.%I force row level security',t);
    execute format('revoke all on table gestao.%I from public,anon,authenticated',t);
    execute format('grant select,insert,update on table gestao.%I to authenticated',t);
    execute format('drop policy if exists coordenacao_tudo on gestao.%I',t);
    execute format('create policy coordenacao_tudo on gestao.%I for all to authenticated using(gestao.usuario_com_papel(''coordenacao'')) with check(gestao.usuario_com_papel(''coordenacao''))',t);
    execute format('drop trigger if exists definir_autoria on gestao.%I',t);
    execute format('create trigger definir_autoria before insert or update on gestao.%I for each row execute function gestao.definir_autoria()',t);
    execute format('drop trigger if exists tocar_atualizado_em on gestao.%I',t);
    execute format('create trigger tocar_atualizado_em before update on gestao.%I for each row execute function gestao.tocar_atualizado_em()',t);
    execute format('drop trigger if exists registrar_auditoria on gestao.%I',t);
    execute format('create trigger registrar_auditoria after insert or update or delete on gestao.%I for each row execute function gestao.registrar_auditoria()',t);
  end loop;
end $$;
revoke update on gestao.importacao_matricula from authenticated;
drop policy if exists bolsista_le on gestao.turma;
create policy bolsista_le on gestao.turma for select to authenticated using(gestao.bolsista_na_turma(id));
drop policy if exists bolsista_le on gestao.matricula;
create policy bolsista_le on gestao.matricula for select to authenticated using(gestao.bolsista_na_turma(turma_id));
drop policy if exists bolsista_le on gestao.turma_bolsista;
create policy bolsista_le on gestao.turma_bolsista for select to authenticated using(gestao.bolsista_na_turma(turma_id));

create or replace function gestao.validar_m1()
returns trigger language plpgsql security definer set search_path='gestao'
as $$ declare t uuid; d date; begin
  if tg_table_name='turma_bolsista' then
    if new.revogado_em is null and not exists(select 1 from gestao.papel_membro where user_profile_id=new.bolsista_id and bolsista and desligado_em is null) then
      raise exception 'Escolha um bolsista ativo.' using errcode='23514';
    end if;
    if tg_op='UPDATE' and (new.turma_id<>old.turma_id or new.bolsista_id<>old.bolsista_id) then
      raise exception 'Revogue a alocação anterior; não altere seu vínculo.';
    end if;
  elsif tg_table_name='turma' then
    if new.reserva_id is not null and not exists(select 1 from gestao.reserva where id=new.reserva_id and escola_id=new.escola_id) then
      raise exception 'A reserva precisa ser da mesma escola.';
    end if;
    if tg_op='UPDATE' and new.escola_id<>old.escola_id then raise exception 'A escola da turma não pode ser trocada.'; end if;
    if new.status='encerrada' then
      if tg_op='INSERT' or old.status<>'encerrada' then new.encerrada_por:=auth.uid(); new.encerrada_em:=now();
      else new.encerrada_por:=old.encerrada_por; new.encerrada_em:=old.encerrada_em; end if;
    else new.encerrada_por:=null; new.encerrada_em:=null; end if;
  elsif tg_table_name='matricula' then
    if tg_op='UPDATE' and (new.turma_id<>old.turma_id or new.aluno_id<>old.aluno_id) then raise exception 'Preserve o vínculo da matrícula.'; end if;
    if not exists(select 1 from gestao.turma t join gestao.aluno a on a.escola_id=t.escola_id where t.id=new.turma_id and a.id=new.aluno_id) then
      raise exception 'O aluno precisa pertencer à escola da turma.';
    end if;
    if new.termo_status='legado_arquivado' and not exists(select 1 from gestao.matricula_termo mt join gestao.reserva_termo rt on rt.id=mt.reserva_termo_id where mt.matricula_id=new.id and rt.status='arquivado') then
      raise exception 'Concilie a referência do termo legado antes de indicar seu status.';
    end if;
    if new.termo_status='arquivado' and not exists(select 1 from gestao.matricula_termo where matricula_id=new.id and arquivo_path is not null and conferido_em is not null) then
      raise exception 'Arquivo e conferência são necessários para arquivar o termo.';
    end if;
  elsif tg_table_name='aluno' then
    if tg_op='UPDATE' and new.escola_id<>old.escola_id and exists(select 1 from gestao.matricula where aluno_id=old.id) then
      raise exception 'O aluno já tem matrícula; preserve a escola do histórico.';
    end if;
  elsif tg_table_name='agenda' then
    if tg_op='UPDATE' and new.turma_id is distinct from old.turma_id then raise exception 'Não mova o encontro entre turmas.'; end if;
    if new.turma_id is not null and not exists(select 1 from gestao.turma where id=new.turma_id and escola_id=new.escola_id) then raise exception 'Escola e turma divergentes.'; end if;
  elsif tg_table_name='aula' then
    if tg_op='UPDATE' and (new.agenda_id<>old.agenda_id or new.m1<>old.m1) then raise exception 'Não mova a aula entre encontros.'; end if;
    select turma_id into t from gestao.agenda where id=new.agenda_id;
    if t is not null then new.m1:=true; end if;
  elsif tg_table_name='presenca' then
    if tg_op='UPDATE' and (new.aula_id<>old.aula_id or new.aluno_id<>old.aluno_id) then raise exception 'Não mova a presença entre alunos ou aulas.'; end if;
    select a.turma_id,a.data into t,d from gestao.aula au join gestao.agenda a on a.id=au.agenda_id where au.id=new.aula_id;
    if t is not null and not exists(select 1 from gestao.matricula where turma_id=t and aluno_id=new.aluno_id and inicio<=d and (fim is null or fim>=d)) then
      raise exception 'O aluno precisa estar matriculado neste encontro.';
    end if;
    new.atualizado_por:=auth.uid(); new.atualizado_em:=now();
    if t is not null then
      new.bolsista_id:=auth.uid(); new.professor_id:=null;
      new.assinatura_status:=case when exists(select 1 from gestao.matricula where turma_id=t and aluno_id=new.aluno_id and termo_status='arquivado') then 'assinado' else 'pendente' end;
    end if;
  elsif tg_table_name='matricula_termo' then
    -- Nenhum arquivo real ou conferência fictícia enquanto a retenção não foi definida.
    if new.arquivo_path is not null or new.conferido_em is not null or new.conferido_por is not null then
      raise exception 'Envio e conferência bloqueados: defina a retenção documental.' using errcode='23514';
    end if;
    if new.reserva_termo_id is not null and not exists(
      select 1 from gestao.reserva_termo rt join gestao.matricula m on m.aluno_id=rt.aluno_id
      join gestao.turma tu on tu.id=m.turma_id and tu.reserva_id=rt.reserva_id
      where m.id=new.matricula_id and rt.id=new.reserva_termo_id) then raise exception 'Termo legado sem correspondência confirmada.'; end if;
  end if;
  return new;
end $$;
revoke execute on function gestao.validar_m1() from public,anon,authenticated;
do $$ declare t text; begin
  foreach t in array array['turma','turma_bolsista','matricula','matricula_termo','aluno','agenda','aula','presenca'] loop
    execute format('drop trigger if exists validar_m1 on gestao.%I',t);
    execute format('create trigger validar_m1 before insert or update on gestao.%I for each row execute function gestao.validar_m1()',t);
  end loop;
end $$;

-- Cadastro e matrícula numa transação: falha de vínculo não deixa aluno órfão.
create or replace function gestao.cadastrar_aluno_turma(p_turma uuid,p_nome text,p_idade integer,p_ano text,p_inicio date)
returns uuid language plpgsql security invoker set search_path='gestao'
as $$ declare aluno uuid; escola gestao.escola; modalidade_turma text; begin
  if not gestao.usuario_com_papel('coordenacao') then raise exception 'Apenas a coordenação cadastra alunos.' using errcode='42501'; end if;
  if p_nome is null or length(btrim(p_nome)) not between 1 and 120 or p_idade is null or p_idade not between 1 and 120 or p_ano is null or length(btrim(p_ano)) not between 1 and 80 or p_inicio is null then raise exception 'Preencha os dados do aluno e início da matrícula.'; end if;
  select e.* into escola from gestao.escola e join gestao.turma t on t.escola_id=e.id where t.id=p_turma;
  select modalidade into modalidade_turma from gestao.turma where id=p_turma;
  if escola.id is null then raise exception 'Turma não encontrada.'; end if;
  insert into gestao.aluno(nome,idade,escola_id,categoria_escola,ano_escolar,modalidade,execucao,cidade)
    values(btrim(p_nome),p_idade,escola.id,escola.categoria,btrim(p_ano),modalidade_turma,'presencial',escola.cidade) returning id into aluno;
  insert into gestao.matricula(turma_id,aluno_id,inicio) values(p_turma,aluno,p_inicio);
  return aluno;
end $$;
revoke execute on function gestao.cadastrar_aluno_turma(uuid,text,integer,text,date) from public,anon;
grant execute on function gestao.cadastrar_aluno_turma(uuid,text,integer,text,date) to authenticated;

-- Função invoker: atomicidade, RLS e uma aula por encontro M1, inclusive reenvios.
create or replace function gestao.salvar_chamada(p_agenda uuid,p_itens jsonb,p_realizada boolean default true)
returns uuid language plpgsql security invoker set search_path='gestao'
as $$ declare ag gestao.agenda; au uuid; item jsonb; aluno uuid; marca boolean; begin
  if not (gestao.usuario_com_papel('coordenacao') or gestao.bolsista_na_agenda(p_agenda)) then raise exception 'Acesso negado à chamada.' using errcode='42501'; end if;
  select * into ag from gestao.agenda where id=p_agenda;
  if ag.turma_id is null then raise exception 'Escolha um encontro de turma.'; end if;
  if p_itens is null or jsonb_typeof(p_itens)<>'array' or jsonb_array_length(p_itens)>500 then raise exception 'Chamada inválida.'; end if;
  if p_realizada is null then raise exception 'Confirme se o encontro aconteceu.'; end if;
  if not p_realizada and exists(select 1 from jsonb_array_elements(p_itens) x where jsonb_typeof(x->'presente')='boolean') then raise exception 'Confirme que o encontro aconteceu antes de informar presença ou falta.'; end if;
  insert into gestao.aula(agenda_id,titulo,realizada_em,m1) values(ag.id,ag.aulas,case when p_realizada then ag.data else null end,true)
  on conflict(agenda_id) where m1 do update set realizada_em=excluded.realizada_em returning id into au;
  if (select count(*) from jsonb_array_elements(p_itens))<>(select count(distinct x->>'alunoId') from jsonb_array_elements(p_itens) x) then raise exception 'Aluno repetido na chamada.'; end if;
  for item in select value from jsonb_array_elements(p_itens) loop
    aluno:=(item->>'alunoId')::uuid;
    if jsonb_typeof(item->'presente') not in ('boolean','null') or not (item ? 'presente') then raise exception 'Presença inválida.'; end if;
    if not exists(select 1 from gestao.matricula where turma_id=ag.turma_id and aluno_id=aluno and inicio<=ag.data and (fim is null or fim>=ag.data)) then raise exception 'Aluno não matriculado neste encontro.'; end if;
    marca:=(item->>'presente')::boolean;
    if marca is null then delete from gestao.presenca where aula_id=au and aluno_id=aluno;
    else
      insert into gestao.presenca(aula_id,aluno_id,presente,assinatura_status) values(au,aluno,marca,'pendente')
      on conflict(aula_id,aluno_id) do update set presente=excluded.presente;
    end if;
  end loop;
  return au;
end $$;
create or replace function gestao.encerrar_turma(p_turma uuid,p_confirmado boolean)
returns void language plpgsql security invoker set search_path='gestao'
as $$ begin
  if not gestao.usuario_com_papel('coordenacao') then raise exception 'Apenas a coordenação encerra turmas.' using errcode='42501'; end if;
  if p_confirmado is distinct from true then raise exception 'Revise as pendências e confirme o encerramento.'; end if;
  update gestao.turma set status='encerrada' where id=p_turma;
  if not found then raise exception 'Turma não encontrada.'; end if;
end $$;

-- Somente vínculos explicitamente revisados; não lê Drive nem pareia nomes.
create or replace function gestao.importar_matriculas(p_turma uuid,p_origem text,p_periodo text,p_lote text,p_itens jsonb,p_revisado boolean)
returns integer language plpgsql security invoker set search_path='gestao'
as $$ declare assinatura text; anterior text; item jsonb; quantidade integer; begin
  if not gestao.usuario_com_papel('coordenacao') then raise exception 'Apenas a coordenação importa matrículas.' using errcode='42501'; end if;
  if p_revisado is distinct from true then raise exception 'Confirme a revisão dos vínculos e divergências.'; end if;
  if nullif(btrim(p_origem),'') is null or nullif(btrim(p_periodo),'') is null or nullif(btrim(p_lote),'') is null then raise exception 'Identifique origem, período e lote.'; end if;
  if p_itens is null or jsonb_typeof(p_itens)<>'array' or jsonb_array_length(p_itens) not between 1 and 500 then raise exception 'Lote inválido.'; end if;
  if exists(select 1 from jsonb_array_elements(p_itens) x where nullif(x->>'origemLinha','') is null or x->>'alunoId' is null) then raise exception 'Toda linha exige origem e aluno explicitamente escolhido.'; end if;
  if (select count(*) from jsonb_array_elements(p_itens))<>(select count(distinct x->>'origemLinha') from jsonb_array_elements(p_itens) x) then raise exception 'Linha de origem repetida.'; end if;
  assinatura:=md5(p_itens::text);
  perform pg_advisory_xact_lock(hashtextextended(p_turma::text||p_origem||p_periodo||p_lote,0));
  select i.assinatura into anterior from gestao.importacao_matricula i where turma_id=p_turma and origem=p_origem and periodo=p_periodo and lote=p_lote;
  if anterior is not null then
    if anterior<>assinatura then raise exception 'Fonte alterada: revise e confirme um novo lote; nenhuma correção foi sobrescrita.'; end if;
    return 0;
  end if;
  for item in select value from jsonb_array_elements(p_itens) loop
    insert into gestao.matricula(turma_id,aluno_id) values(p_turma,(item->>'alunoId')::uuid) on conflict(turma_id,aluno_id) do nothing;
  end loop;
  quantidade:=jsonb_array_length(p_itens);
  insert into gestao.importacao_matricula(turma_id,origem,periodo,lote,assinatura,quantidade) values(p_turma,p_origem,p_periodo,p_lote,assinatura,quantidade);
  return quantidade;
end $$;

create or replace function gestao.conciliar_termo_legado(p_matricula uuid,p_reserva_termo uuid)
returns void language plpgsql security invoker set search_path='gestao'
as $$ declare estado text; begin
  if not gestao.usuario_com_papel('coordenacao') then raise exception 'Apenas a coordenação concilia termos.' using errcode='42501'; end if;
  select rt.status into estado from gestao.reserva_termo rt join gestao.matricula m on m.aluno_id=rt.aluno_id
    join gestao.turma t on t.id=m.turma_id and t.reserva_id=rt.reserva_id
    where m.id=p_matricula and rt.id=p_reserva_termo;
  if estado is null then raise exception 'Termo legado sem correspondência confirmada.'; end if;
  insert into gestao.matricula_termo(matricula_id,reserva_termo_id) values(p_matricula,p_reserva_termo)
    on conflict(matricula_id) do update set reserva_termo_id=excluded.reserva_termo_id;
  update gestao.matricula set termo_status=case when estado='arquivado' then 'legado_arquivado' else 'pendente' end where id=p_matricula;
end $$;
revoke execute on function gestao.conciliar_termo_legado(uuid,uuid) from public,anon;
grant execute on function gestao.conciliar_termo_legado(uuid,uuid) to authenticated;

-- Nome mínimo para chamada e impressão; não enumera e-mails/perfis alheios.
create or replace function gestao.turma_equipe(p_turma uuid)
returns table(id uuid,nome text) language plpgsql stable security definer set search_path='gestao','public'
as $$ begin
  if not (gestao.usuario_com_papel('coordenacao') or gestao.bolsista_na_turma(p_turma)) then raise exception 'Acesso negado à equipe da turma.' using errcode='42501'; end if;
  return query select up.id,coalesce(up.full_name,'Bolsista') from gestao.turma_bolsista tb
    join public.user_profile up on up.id=tb.bolsista_id
    join gestao.papel_membro pm on pm.user_profile_id=tb.bolsista_id
    where tb.turma_id=p_turma and tb.revogado_em is null and pm.bolsista and pm.desligado_em is null order by up.full_name;
end $$;
revoke execute on function gestao.turma_equipe(uuid) from public,anon;
grant execute on function gestao.turma_equipe(uuid) to authenticated;

create or replace function gestao.chamada_autores(p_turma uuid)
returns table(id uuid,nome text) language plpgsql stable security definer set search_path='gestao','public'
as $$ begin
  if not (gestao.usuario_com_papel('coordenacao') or gestao.bolsista_na_turma(p_turma)) then raise exception 'Acesso negado à autoria da chamada.' using errcode='42501'; end if;
  return query select distinct p.atualizado_por,coalesce(up.full_name,'Conta removida') from gestao.presenca p
    join gestao.aula au on au.id=p.aula_id join gestao.agenda a on a.id=au.agenda_id
    left join public.user_profile up on up.id=p.atualizado_por where a.turma_id=p_turma and p.atualizado_por is not null;
end $$;
revoke execute on function gestao.chamada_autores(uuid) from public,anon;
grant execute on function gestao.chamada_autores(uuid) to authenticated;

-- Indicadores sob a mesma RLS: denominador confirmado e cobertura explícitos.
create or replace view gestao.turma_indicadores with(security_invoker=true) as
select t.id turma_id,
  (select count(*)::int from gestao.matricula m where m.turma_id=t.id) matriculas,
  (select count(*)::int from gestao.agenda a where a.turma_id=t.id) encontros_previstos,
  (select count(*)::int from gestao.agenda a join gestao.aula au on au.agenda_id=a.id and au.m1 where a.turma_id=t.id and au.realizada_em is not null) encontros_realizados,
  coalesce((select sum(extract(epoch from (a.fim-a.inicio))/3600)::numeric from gestao.agenda a join gestao.aula au on au.agenda_id=a.id and au.m1 where a.turma_id=t.id and au.realizada_em is not null),0) horas_aula,
  coalesce(s.presentes,0)::int presentes, coalesce(s.ausentes,0)::int ausentes, coalesce(s.desconhecidos,0)::int nao_informados,
  case when coalesce(s.presentes+s.ausentes,0)>0 then round(s.presentes*100.0/(s.presentes+s.ausentes),2) else null end frequencia,
  case when coalesce(s.total,0)>0 then round((s.presentes+s.ausentes)*100.0/s.total,2) else null end cobertura,
  (select count(*)::int from gestao.matricula m where m.turma_id=t.id and m.termo_status<>'arquivado') termos_pendentes,
  (select count(*)::int from gestao.matricula m where m.turma_id=t.id and m.termo_status='arquivado') termos_arquivados,
  (select count(*)::int from gestao.matricula m where m.turma_id=t.id and m.termo_status='legado_arquivado') termos_legados_sem_arquivo,
  (select count(*)::int from gestao.matricula m where m.turma_id=t.id and m.certificado_entregue_em is not null) certificados_entregues
from gestao.turma t left join lateral(
  select count(*) total, count(*) filter(where p.presente=true) presentes,
    count(*) filter(where p.presente=false) ausentes, count(*) filter(where p.id is null) desconhecidos
  from gestao.agenda a join gestao.matricula m on m.turma_id=a.turma_id and m.inicio<=a.data and (m.fim is null or m.fim>=a.data)
  left join gestao.aula au on au.agenda_id=a.id and au.m1
  left join gestao.presenca p on p.aula_id=au.id and p.aluno_id=m.aluno_id
  where a.turma_id=t.id
) s on true;
revoke all on gestao.turma_indicadores from public,anon;
grant select on gestao.turma_indicadores to authenticated;

do $$ declare f text; begin
  foreach f in array array['bolsista_na_turma(uuid)','bolsista_na_agenda(uuid)','bolsista_na_aula(uuid)','bolsista_na_escola(uuid)','bolsista_no_aluno(uuid)','salvar_chamada(uuid,jsonb,boolean)','encerrar_turma(uuid,boolean)','importar_matriculas(uuid,text,text,text,jsonb,boolean)'] loop
    execute 'revoke execute on function gestao.'||f||' from public,anon';
    execute 'grant execute on function gestao.'||f||' to authenticated';
  end loop;
end $$;

-- Supabase Storage não existe em todo PostgreSQL local. PGlite prova com o molde real.
-- Zero política de escrita: retenção indefinida bloqueia até coordenação.
do $$ begin
  if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
    insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
    values('gestao-termos','gestao-termos',false,10485760,array['application/pdf','image/jpeg','image/png'])
    on conflict(id) do update set public=false;
    execute 'drop policy if exists gestao_termos_leitura on storage.objects';
    execute 'create policy gestao_termos_leitura on storage.objects for select to authenticated using(bucket_id=''gestao-termos'' and gestao.usuario_com_papel(''coordenacao'') and exists(select 1 from gestao.matricula_termo mt where mt.arquivo_path=name))';
    -- Restrição adicional impede que uma policy global preexistente abra os termos.
    execute 'drop policy if exists gestao_termos_privados on storage.objects';
    execute 'create policy gestao_termos_privados on storage.objects as restrictive for select to public using(bucket_id<>''gestao-termos'' or (gestao.usuario_com_papel(''coordenacao'') and exists(select 1 from gestao.matricula_termo mt where mt.arquivo_path=name)))';
    execute 'drop policy if exists gestao_termos_sem_upload on storage.objects';
    execute 'create policy gestao_termos_sem_upload on storage.objects as restrictive for insert to public with check(bucket_id<>''gestao-termos'')';
    execute 'drop policy if exists gestao_termos_sem_update on storage.objects';
    execute 'create policy gestao_termos_sem_update on storage.objects as restrictive for update to public using(bucket_id<>''gestao-termos'') with check(bucket_id<>''gestao-termos'')';
    execute 'drop policy if exists gestao_termos_sem_delete on storage.objects';
    execute 'create policy gestao_termos_sem_delete on storage.objects as restrictive for delete to public using(bucket_id<>''gestao-termos'')';
  end if;
end $$;
notify pgrst,'reload schema';
commit;
