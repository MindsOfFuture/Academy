-- ALTO: a policy "Student manage own submission" é FOR ALL, então o aluno
-- gravava a própria nota (score/grade/graded_at/graded_by/feedback). E a policy
-- "Insert certificate for own enrollment" não conferia conclusão: a regra
-- (aulas concluídas + atividades corrigidas com >= 60%) só existia no navegador
-- (checkCourseCompletion em lib/api/certificates.ts). Juntas, permitiam emitir
-- certificado válido sem fazer o curso.

-- 1. Correção é do dono do curso ou do admin --------------------------------
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
  where a.id = p_assignment_id;
$function$;

revoke execute on function public.curso_da_tarefa(uuid) from public, anon;
grant execute on function public.curso_da_tarefa(uuid) to authenticated;

create or replace function public.proteger_correcao()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  if auth.uid() is null or public.is_admin() or exists (
    select 1 from public.course c
    where c.id = public.curso_da_tarefa(new.assignment_id) and c.owner_id = auth.uid()
  ) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.score is not null or new.grade is not null or new.feedback is not null
       or new.graded_at is not null or new.graded_by is not null then
      raise exception 'Somente quem corrige atribui nota.' using errcode = '42501';
    end if;
  elsif new.score is distinct from old.score
        or new.grade is distinct from old.grade
        or new.feedback is distinct from old.feedback
        or new.graded_at is distinct from old.graded_at
        or new.graded_by is distinct from old.graded_by then
    raise exception 'Somente quem corrige atribui nota.' using errcode = '42501';
  end if;

  return new;
end;
$function$;

revoke execute on function public.proteger_correcao() from public, anon, authenticated;

drop trigger if exists proteger_correcao on public.assignment_submission;
create trigger proteger_correcao
  before insert or update on public.assignment_submission
  for each row execute function public.proteger_correcao();

-- 2. Certificado do próprio aluno só com o curso concluído -------------------
-- Espelha checkCourseCompletion; onde a tela usa a última entrega, aqui basta
-- haver uma corrigida e aprovada, para o banco nunca recusar o que a tela aceita.
create or replace function public.matricula_concluida(p_enrollment_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  with m as (
    select e.id, e.course_id, e.user_id from public.enrollment e where e.id = p_enrollment_id
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

revoke execute on function public.matricula_concluida(uuid) from public, anon;
grant execute on function public.matricula_concluida(uuid) to authenticated;

drop policy if exists "Insert certificate for own enrollment" on public.certificate;
create policy "Insert certificate for own enrollment" on public.certificate
  for insert to authenticated
  with check (
    exists (
      select 1 from public.enrollment e
      where e.id = certificate.enrollment_id and e.user_id = auth.uid()
    )
    and public.matricula_concluida(enrollment_id)
  );
