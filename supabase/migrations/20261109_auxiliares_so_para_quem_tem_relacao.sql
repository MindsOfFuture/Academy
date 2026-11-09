-- BAIXO: curso_da_matricula, curso_da_tarefa e matricula_concluida (criadas nas
-- migrações de 20261109) ficam expostas em /rest/v1/rpc porque as policies as
-- chamam como o próprio usuário. Sem guarda, quem tivesse o id da matrícula ou
-- da tarefa de outra pessoa descobria o curso dela ou se ela concluiu.
--
-- Agora cada uma só responde a quem tem relação com o dado e devolve vazio para
-- os demais. As policies não mudam: elas só as chamam nesses casos (dono do
-- curso nas de professor, dono da matrícula no certificado do aluno; o gatilho
-- proteger_correcao usa curso_da_tarefa para saber se quem corrige é o dono).
create or replace function public.curso_da_matricula(p_enrollment_id uuid)
 returns uuid
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select e.course_id
  from public.enrollment e
  where e.id = p_enrollment_id
    and (
      e.user_id = auth.uid()
      or public.is_admin()
      or exists (select 1 from public.course c where c.id = e.course_id and c.owner_id = auth.uid())
    );
$function$;

create or replace function public.curso_da_tarefa(p_assignment_id uuid)
 returns uuid
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select m.course_id
  from public.assignment a
  join public.lesson l on l.id = a.lesson_id
  join public.course_module m on m.id = l.module_id
  where a.id = p_assignment_id
    and (
      public.is_admin()
      or exists (select 1 from public.course c where c.id = m.course_id and c.owner_id = auth.uid())
    );
$function$;

create or replace function public.matricula_concluida(p_enrollment_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  with m as (
    select e.id, e.course_id, e.user_id from public.enrollment e
    where e.id = p_enrollment_id
      and (
        e.user_id = auth.uid()
        or public.is_admin()
        or exists (select 1 from public.course c where c.id = e.course_id and c.owner_id = auth.uid())
      )
  ),
  aulas as (
    select count(*) as total from public.lesson l, m where l.course_id = m.course_id
  ),
  feitas as (
    select count(*) as total from public.lesson_progress p, m
    where p.enrollment_id = m.id and p.is_completed
  )
  select exists (select 1 from m)
    and (select total from aulas) > 0
    and (select total from feitas) >= (select total from aulas)
    and not exists (
      select 1
      from public.assignment a
      join public.lesson l on l.id = a.lesson_id
      join m on l.course_id = m.course_id
      where not exists (
        select 1 from public.assignment_submission s
        where s.assignment_id = a.id
          and s.user_id = m.user_id
          and s.graded_at is not null
          and coalesce(s.score, 0) * 100 >= 60 * coalesce(nullif(a.max_score, 0), 10)
      )
    );
$function$;
