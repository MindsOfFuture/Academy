-- BAIXO: as policies de INSERT do próprio aluno em enrollment só conferiam
-- user_id, então dava para se matricular em rascunho/curso arquivado e, com a
-- matrícula, ver as atividades e o perfil do dono desse curso. A tela só
-- matricula em curso ativo; o banco passa a exigir o mesmo. Matrícula feita por
-- professor dono ou admin segue pela policy "Teachers and Admins can enroll students".
create or replace function public.curso_ativo(p_course_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select exists (select 1 from public.course c where c.id = p_course_id and c.status = 'active');
$function$;

revoke execute on function public.curso_ativo(uuid) from public, anon;
grant execute on function public.curso_ativo(uuid) to authenticated;

drop policy if exists "Student can enroll" on public.enrollment;
drop policy if exists "Enrollment Insert Policy" on public.enrollment;
create policy "Enrollment Insert Policy" on public.enrollment
  for insert to authenticated
  with check (auth.uid() = user_id and public.curso_ativo(course_id));
