-- Números da homepage: base + o que está cadastrado na gestão.
--
-- `system_config.escolas_atendidas` e `alunos_atendidos` (os "Números da página
-- inicial") passam a ser a base: o que foi atendido antes da gestão. A homepage
-- mostra a base mais:
--   - escolas: escolas cadastradas na gestão;
--   - alunos: soma do número de alunos das turmas (campo novo, opcional).
-- Fica de fora o que é de teste (E2E) e turma que não abriu.
--
-- `public.numeros_da_home()` é security definer porque a homepage é pública e
-- o anon não lê `gestao`; ela só devolve os dois totais. Idempotente.

begin;

alter table gestao.turma add column if not exists n_alunos integer
  check (n_alunos between 0 and 1000);

create or replace function public.numeros_da_home()
returns table (escolas integer, alunos integer)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select
      coalesce(max(c.value::integer) filter (where c.key = 'escolas_atendidas'), 0) as escolas,
      coalesce(max(c.value::integer) filter (where c.key = 'alunos_atendidos'), 0) as alunos
    from public.system_config c
    where c.key in ('escolas_atendidas', 'alunos_atendidos') and c.value ~ '^\s*\d+\s*$'
  )
  select
    base.escolas + (select count(*)::integer from gestao.escola e where not e.teste),
    base.alunos + coalesce((
      select sum(t.n_alunos)::integer
      from gestao.turma t
      join gestao.escola e on e.id = t.escola_id
      where not e.teste and t.status <> 'nao_abriu'
    ), 0)
  from base
$$;

revoke execute on function public.numeros_da_home() from public;
grant execute on function public.numeros_da_home() to anon, authenticated;

commit;
