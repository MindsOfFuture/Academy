-- ALTO: várias policies liberavam tudo para "professor ou admin". Como o papel de
-- professor é dado no próprio cadastro (só a verificação fica pendente), na
-- prática qualquer pessoa que se cadastrasse como professor podia:
--   - ler todos os certificados (nome e CPF dos alunos) e emitir certificado
--     para qualquer matrícula;
--   - criar, alterar e apagar qualquer matrícula;
--   - ler e escrever em todos os chats de atividade;
--   - ler toda a telemetria dos alunos e a lista de todos os usuários.
-- O que o app faz como professor é sempre sobre um curso dele (matricular,
-- emitir certificado, conversar com aluno). Agora vale: admin, ou dono do curso
-- com verificação aprovada. Visibilidade de cursos/trilhas por público não muda.

create or replace function public.sou_dono_do_curso(p_course_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select exists (
    select 1 from public.course c
    where c.id = p_course_id and c.owner_id = auth.uid()
  ) and public.is_teacher_approved(auth.uid());
$function$;

revoke execute on function public.sou_dono_do_curso(uuid) from public, anon;
grant execute on function public.sou_dono_do_curso(uuid) to authenticated;

create or replace function public.curso_da_matricula(p_enrollment_id uuid)
 returns uuid
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select e.course_id from public.enrollment e where e.id = p_enrollment_id;
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
  where a.id = p_assignment_id;
$function$;

revoke execute on function public.curso_da_matricula(uuid) from public, anon;
revoke execute on function public.curso_da_tarefa(uuid) from public, anon;
grant execute on function public.curso_da_matricula(uuid) to authenticated;
grant execute on function public.curso_da_tarefa(uuid) to authenticated;

-- Matrículas -----------------------------------------------------------------
drop policy if exists "Teachers and Admins can enroll students" on public.enrollment;
create policy "Teachers and Admins can enroll students" on public.enrollment
  for insert with check (public.is_admin() or public.sou_dono_do_curso(course_id));

drop policy if exists "Teachers and Admins update enrollment" on public.enrollment;
create policy "Teachers and Admins update enrollment" on public.enrollment
  for update using (public.is_admin() or public.sou_dono_do_curso(course_id))
  with check (public.is_admin() or public.sou_dono_do_curso(course_id));

drop policy if exists "Teachers and Admins can delete enrollment" on public.enrollment;
create policy "Teachers and Admins can delete enrollment" on public.enrollment
  for delete using (public.is_admin() or public.sou_dono_do_curso(course_id));

-- Certificados ---------------------------------------------------------------
drop policy if exists "Teachers and Admins can insert certificates" on public.certificate;
create policy "Teachers and Admins can insert certificates" on public.certificate
  for insert with check (
    public.is_admin() or public.sou_dono_do_curso(public.curso_da_matricula(enrollment_id))
  );

drop policy if exists "Teachers and Admins view all certificates" on public.certificate;
create policy "Teachers and Admins view all certificates" on public.certificate
  for select using (
    public.is_admin() or public.sou_dono_do_curso(public.curso_da_matricula(enrollment_id))
  );

-- Chat de atividade ----------------------------------------------------------
drop policy if exists chat_select_policy on public.activity_chat_message;
create policy chat_select_policy on public.activity_chat_message
  for select using (
    auth.uid() = student_id
    or public.is_admin()
    or public.sou_dono_do_curso(public.curso_da_tarefa(assignment_id))
  );

drop policy if exists chat_insert_policy on public.activity_chat_message;
create policy chat_insert_policy on public.activity_chat_message
  for insert with check (
    sender_id = auth.uid()
    and (
      auth.uid() = student_id
      or public.is_admin()
      or public.sou_dono_do_curso(public.curso_da_tarefa(assignment_id))
    )
  );

-- Tags -----------------------------------------------------------------------
drop policy if exists "Teacher manage tags" on public.tag;
create policy "Teacher manage tags" on public.tag
  for all using (public.is_admin() or public.is_teacher_approved(auth.uid()))
  with check (public.is_admin() or public.is_teacher_approved(auth.uid()));

-- Telemetria: nenhum fluxo de professor lê estas tabelas; os painéis usam as
-- RPCs de analytics, que já exigem admin.
drop policy if exists "Admins and teachers can read all assessment interactions" on public.telemetry_assessment_interaction;
drop policy if exists "Admins read all assessment interactions" on public.telemetry_assessment_interaction;
create policy "Admins read all assessment interactions" on public.telemetry_assessment_interaction
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins and teachers can read all content reviews" on public.telemetry_content_review;
drop policy if exists "Admins read all content reviews" on public.telemetry_content_review;
create policy "Admins read all content reviews" on public.telemetry_content_review
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins and teachers can read all milestones" on public.telemetry_course_milestone;
drop policy if exists "Admins read all milestones" on public.telemetry_course_milestone;
create policy "Admins read all milestones" on public.telemetry_course_milestone
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins and teachers can read all video interactions" on public.telemetry_video_interaction;
drop policy if exists "Admins read all video interactions" on public.telemetry_video_interaction;
create policy "Admins read all video interactions" on public.telemetry_video_interaction
  for select to authenticated using (public.is_admin());

-- Listas de usuários para matricular: só admin ou professor aprovado -----------
create or replace function public.get_students_list()
 returns table(id uuid, full_name text)
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select up.id, up.full_name
  from public.user_profile up
  join public.user_role ur on up.id = ur.user_profile_id
  join public.role r on ur.role_id = r.id
  where r.name = 'student'
    and (public.is_admin() or public.is_teacher_approved(auth.uid()));
$function$;

create or replace function public.get_enrollable_users()
 returns table(id uuid, full_name text, role_name text)
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select distinct up.id, up.full_name, r.name as role_name
  from public.user_profile up
  join public.user_role ur on up.id = ur.user_profile_id
  join public.role r on ur.role_id = r.id
  where r.name in ('student', 'teacher', 'admin')
    and (public.is_admin() or public.is_teacher_approved(auth.uid()))
  order by up.full_name;
$function$;
