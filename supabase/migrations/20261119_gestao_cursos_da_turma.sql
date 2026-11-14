-- Cursos da turma (pedido da coordenação em 14/11/2026).
--
-- A mesma turma pode voltar para outro curso (Lego e, depois, Python), e cada
-- curso conta de novo no número de alunos. `gestao.turma_curso` guarda os
-- cursos da turma, cada um com período e número de alunos.
--
--   - Cada turma que já existe ganha um curso com a modalidade, o período e o
--     número de alunos que ela tinha. Nada se perde e nada conta em dobro.
--   - Turma nova cria o primeiro curso sozinha (trigger), a partir das mesmas
--     colunas: quem cadastra a turma continua mandando o que mandava.
--   - `turma.modalidade`, `inicio`, `fim` e `n_alunos` ficam: são os do
--     primeiro curso, e o código de antes do deploy segue funcionando.
--   - Alunos na home: soma dos alunos de cada curso (antes, de cada turma).
--
-- Depende de 20261114_gestao_numero_da_aula.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

create table if not exists gestao.turma_curso (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references gestao.turma (id) on delete restrict,
  modalidade text not null check (char_length(btrim(modalidade)) between 2 and 80),
  inicio date not null,
  fim date,
  n_alunos integer check (n_alunos between 0 and 1000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null,
  constraint turma_curso_fim_depois_inicio check (fim is null or fim >= inicio)
);

create index if not exists turma_curso_turma on gestao.turma_curso (turma_id, inicio);

alter table gestao.turma_curso enable row level security;
alter table gestao.turma_curso force row level security;

revoke all on table gestao.turma_curso from public, anon, authenticated;
grant select, insert, update on table gestao.turma_curso to authenticated;

drop policy if exists "coordenacao_tudo" on gestao.turma_curso;
create policy "coordenacao_tudo" on gestao.turma_curso
  as permissive for all to authenticated
  using (gestao.usuario_com_papel('coordenacao'))
  with check (gestao.usuario_com_papel('coordenacao'));

drop trigger if exists definir_autoria on gestao.turma_curso;
create trigger definir_autoria before insert or update on gestao.turma_curso
  for each row execute function gestao.definir_autoria();
drop trigger if exists tocar_atualizado_em on gestao.turma_curso;
create trigger tocar_atualizado_em before update on gestao.turma_curso
  for each row execute function gestao.tocar_atualizado_em();
drop trigger if exists registrar_auditoria on gestao.turma_curso;
create trigger registrar_auditoria after insert or update or delete on gestao.turma_curso
  for each row execute function gestao.registrar_auditoria();

-- Turmas sem curso ganham o delas. As triggers de autoria e auditoria pedem um
-- usuário, que a migração não tem: ficam desligadas só durante a cópia, e a
-- autoria vem de quem criou a turma.
alter table gestao.turma_curso disable trigger definir_autoria;
alter table gestao.turma_curso disable trigger registrar_auditoria;
insert into gestao.turma_curso (turma_id, modalidade, inicio, fim, n_alunos, criado_em, criado_por)
select t.id, t.modalidade, t.inicio, t.fim, t.n_alunos, t.criado_em, t.criado_por
from gestao.turma t
where not exists (select 1 from gestao.turma_curso c where c.turma_id = t.id);
alter table gestao.turma_curso enable trigger definir_autoria;
alter table gestao.turma_curso enable trigger registrar_auditoria;

-- Turma nova: o primeiro curso nasce junto, na mesma transação.
create or replace function gestao.criar_primeiro_curso()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  insert into gestao.turma_curso (turma_id, modalidade, inicio, fim, n_alunos)
  values (new.id, new.modalidade, new.inicio, new.fim, new.n_alunos);
  return new;
end;
$$;

drop trigger if exists criar_primeiro_curso on gestao.turma;
create trigger criar_primeiro_curso after insert on gestao.turma
  for each row execute function gestao.criar_primeiro_curso();

-- Alunos na home: cada curso conta (a mesma turma em Lego e em Python, duas vezes).
create or replace function public.numeros_da_home()
returns table (escolas integer, alunos integer, aulas integer)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select
      coalesce(max(c.value::integer) filter (where c.key = 'escolas_atendidas'), 0) as escolas,
      coalesce(max(c.value::integer) filter (where c.key = 'alunos_atendidos'), 0) as alunos,
      coalesce(max(c.value::integer) filter (where c.key = 'public_aulas_realizadas'), 0) as aulas
    from public.system_config c
    where c.key in ('escolas_atendidas', 'alunos_atendidos', 'public_aulas_realizadas') and c.value ~ '^\s*\d+\s*$'
  )
  select
    base.escolas + (select count(*)::integer from gestao.escola e where not e.teste),
    base.alunos + coalesce((
      select sum(c.n_alunos)::integer
      from gestao.turma_curso c
      join gestao.turma t on t.id = c.turma_id
      join gestao.escola e on e.id = t.escola_id
      where not e.teste and t.status <> 'nao_abriu'
    ), 0),
    base.aulas + (
      select count(*)::integer
      from gestao.agenda a
      join gestao.escola e on e.id = a.escola_id
      left join gestao.turma t on t.id = a.turma_id
      where a.concluido_em is not null and a.cancelado_em is null and not e.teste
        and (t.id is null or t.status <> 'nao_abriu')
    )
  from base
$$;

revoke execute on function public.numeros_da_home() from public;
grant execute on function public.numeros_da_home() to anon, authenticated;

commit;
