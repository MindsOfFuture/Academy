-- MÉDIO: a policy "Student update own enrollment" deixa o aluno alterar qualquer
-- coluna da própria matrícula. Ele podia matricular-se num curso ativo e depois
-- trocar course_id para um rascunho (contornando curso_ativo da automatrícula),
-- passar a matrícula para outro aluno, ou marcar status = 'completed' à toa.
--
-- O aluno altera a matrícula em dois pontos, ambos para marcá-la concluída:
-- o gatilho check_course_completion (em lesson_progress, ao concluir a última
-- aula) e lib/api/certificates.ts ao emitir o certificado. Fica só isso, com o
-- mesmo critério do gatilho: todas as aulas do curso concluídas. (O certificado
-- segue exigindo também as atividades aprovadas, por matricula_concluida.)
-- Admin, dono do curso e chamadas sem usuário (service role) seguem livres.
create or replace function public.proteger_matricula()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_aulas int;
  v_feitas int;
begin
  if auth.uid() is null or public.is_admin() or exists (
    select 1 from public.course c where c.id = old.course_id and c.owner_id = auth.uid()
  ) then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.course_id is distinct from old.course_id
     or new.enrolled_at is distinct from old.enrolled_at then
    raise exception 'A matrícula não pode mudar de curso nem de aluno.' using errcode = '42501';
  end if;

  if new.status is distinct from old.status or new.completed_at is distinct from old.completed_at then
    select count(*) into v_aulas
    from public.lesson l join public.course_module m on m.id = l.module_id
    where m.course_id = old.course_id;

    select count(*) into v_feitas
    from public.lesson_progress p
    where p.enrollment_id = old.id and p.is_completed;

    if new.status is distinct from 'completed' or v_aulas = 0 or v_feitas < v_aulas then
      raise exception 'A matrícula só é concluída com todas as aulas concluídas.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$function$;

revoke execute on function public.proteger_matricula() from public, anon, authenticated;

drop trigger if exists proteger_matricula on public.enrollment;
create trigger proteger_matricula
  before update on public.enrollment
  for each row execute function public.proteger_matricula();
