-- Correções da auditoria de segurança (2026-08-25).
--
-- 1. RPCs SECURITY DEFINER expostas ao papel `anon`
-- 2. Policies de RLS amplas demais (PII de alunos, escrita de artigos, certificados)
-- 3. search_path mutável em funções SECURITY DEFINER
-- 4. CPF trafegando em rota pública de validação de certificado

-- ---------------------------------------------------------------------------
-- 1. RPCs SECURITY DEFINER
-- ---------------------------------------------------------------------------

-- CRÍTICO: `scrub_deleted_user_personal_data` tinha EXECUTE para PUBLIC, ou seja
-- qualquer um com a anon key (que vai no bundle do browser) podia apagar os
-- dados pessoais e os papéis de qualquer usuário via /rest/v1/rpc/.
-- Só a rota /api/profile/delete-account (service role) deve chamá-la.
revoke execute on function public.scrub_deleted_user_personal_data(uuid) from public, anon, authenticated;

-- Funções de trigger não são chamáveis como RPC de propósito.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_auth_user_deleted() from public, anon, authenticated;
revoke execute on function public.handle_teacher_request_on_signup() from public, anon, authenticated;
revoke execute on function public.auto_record_milestone() from public, anon, authenticated;
revoke execute on function public.enforce_verified_teacher_for_content() from public, anon, authenticated;
revoke execute on function public.auto_fill_submission_enrollment() from public, anon, authenticated;
revoke execute on function public.check_course_completion() from public, anon, authenticated;
revoke execute on function public.set_certificate_verification_code() from public, anon, authenticated;
revoke execute on function public.generate_verification_code() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
revoke execute on function public.handle_updated_at() from public, anon, authenticated;
revoke execute on function public.trigger_set_updated_at() from public, anon, authenticated;

-- Analytics: SECURITY DEFINER sem guarda e chamável por anon devolvia métricas
-- da plataforma inteira e telemetria por aluno para qualquer um.
-- Só a aba Analytics do dashboard (professor/admin) usa estas RPCs.
revoke execute on function public.get_analytics_overview(timestamptz, timestamptz) from public, anon;
revoke execute on function public.get_analytics_by_course(uuid) from public, anon;
revoke execute on function public.get_analytics_by_learning_path(uuid) from public, anon;
revoke execute on function public.get_analytics_by_student(uuid) from public, anon;

-- ---------------------------------------------------------------------------
-- 2. Policies de RLS
-- ---------------------------------------------------------------------------

-- PII: "Teachers view all profiles" liberava SELECT em TODA a tabela
-- user_profile (CPF, telefone, endereço, data de nascimento de menores de
-- idade) para qualquer portador do papel `teacher`. Escopo agora é o aluno
-- matriculado num curso do professor. Listagens fora desse escopo continuam
-- funcionando via get_students_list() / get_enrollable_users(), que são
-- SECURITY DEFINER e já checam o papel de quem chama.
drop policy if exists "Teachers view all profiles" on public.user_profile;

create policy "Teachers view enrolled student profiles"
on public.user_profile
for select
to authenticated
using (
  exists (
    select 1
    from public.enrollment e
    join public.course c on c.id = e.course_id
    where e.user_id = user_profile.id
      and c.owner_id = auth.uid()
  )
);

-- Artigos: "Author manage articles" era FOR ALL sem WITH CHECK, então o USING
-- valia como check no INSERT — qualquer usuário autenticado conseguia publicar
-- (status = 'published') na página pública /artigos. Nenhum código do app
-- escreve em `article` (lib/api/articles.ts é somente leitura), então escrita
-- fica restrita a admin.
drop policy if exists "Author manage articles" on public.article;

create policy "Admins manage articles"
on public.article
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Authors read own articles"
on public.article
for select
to authenticated
using (author_id = auth.uid());

-- Certificados: a policy antiga só exigia que o enrollment fosse do aluno, então
-- student_name / student_cpf / course_title vinham do cliente sem validação — e
-- a página pública /validar confirmava o resultado como legítimo. Agora os três
-- campos precisam bater com o banco. O fluxo real (lib/api/certificates.ts) já
-- envia exatamente esses valores, incluindo os fallbacks "Aluno" e "Curso".
drop policy if exists "Users can insert own certificates" on public.certificate;

create policy "Users can insert own certificates"
on public.certificate
for insert
to authenticated
with check (
  exists (
    select 1 from public.enrollment e
    where e.id = certificate.enrollment_id
      and e.user_id = auth.uid()
  )
  and student_name = coalesce(
    (select up.full_name from public.user_profile up where up.id = auth.uid()),
    'Aluno'
  )
  and coalesce(student_cpf, '') = coalesce(
    (select up.document from public.user_profile up where up.id = auth.uid()),
    ''
  )
  and course_title = coalesce(
    (select c.title
     from public.course c
     join public.enrollment e on e.course_id = c.id
     where e.id = certificate.enrollment_id),
    'Curso'
  )
);

-- ---------------------------------------------------------------------------
-- 3. search_path mutável
-- ---------------------------------------------------------------------------
-- A falha é o search_path ser controlável por quem chama. Fixamos em 'public'
-- (e não em '') porque os corpos existentes usam nomes não qualificados em
-- alguns pontos; '' quebraria essas funções em runtime.

alter function public.is_admin() set search_path = 'public';
alter function public.is_user_admin(uuid) set search_path = 'public';
alter function public.is_teacher_approved(uuid) set search_path = 'public';
alter function public.handle_new_user() set search_path = 'public';
alter function public.auto_record_milestone() set search_path = 'public';
alter function public.get_analytics_overview(timestamptz, timestamptz) set search_path = 'public';
alter function public.get_analytics_by_course(uuid) set search_path = 'public';
alter function public.get_analytics_by_learning_path(uuid) set search_path = 'public';
alter function public.get_analytics_by_student(uuid) set search_path = 'public';
alter function public.generate_verification_code() set search_path = 'public';
alter function public.set_certificate_verification_code() set search_path = 'public';
alter function public.check_course_completion() set search_path = 'public';
alter function public.auto_fill_submission_enrollment() set search_path = 'public';
alter function public.enforce_verified_teacher_for_content() set search_path = 'public';
alter function public.update_updated_at_column() set search_path = 'public';
alter function public.handle_updated_at() set search_path = 'public';
alter function public.trigger_set_updated_at() set search_path = 'public';

-- ---------------------------------------------------------------------------
-- 4. CPF na validação pública de certificado
-- ---------------------------------------------------------------------------

-- /validar é público e a UI já exibia o CPF mascarado — mas o CPF inteiro
-- trafegava na resposta da RPC. A máscara passa a ser feita no banco, no mesmo
-- formato que a página exibe, e o CPF completo nunca sai da tabela.
drop function if exists public.validate_certificate(text);

create function public.validate_certificate(p_code text)
returns table (
  id uuid,
  verification_code text,
  student_name text,
  student_cpf text,
  course_title text,
  issued_at timestamptz
)
language sql
stable
security definer
set search_path to ''
as $$
  select
    c.id,
    c.verification_code,
    c.student_name,
    case
      when length(regexp_replace(coalesce(c.student_cpf, ''), '\D', '', 'g')) = 11
        then '***.' || substr(regexp_replace(c.student_cpf, '\D', '', 'g'), 4, 3)
             || '.' || substr(regexp_replace(c.student_cpf, '\D', '', 'g'), 7, 3)
             || '-**'
      else null
    end as student_cpf,
    c.course_title,
    c.issued_at
  from public.certificate c
  where c.verification_code = upper(trim(p_code));
$$;

revoke execute on function public.validate_certificate(text) from public;
grant execute on function public.validate_certificate(text) to anon, authenticated;
