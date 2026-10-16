-- Travas de segurança no banco (revisão de 16/10/2026, spec 017, parte de banco).
--
-- NÃO APLICADA. Vive só no branch fix/security-db-1016 até o Rafael rodar no
-- SQL Editor; depois de aplicada entra em development/main como migration.
-- Idempotente: pode rodar duas vezes. Não depende das policies atuais do schema
-- public (que não estão no repo): as travas são triggers BEFORE, que valem
-- qualquer que seja a policy, e funções em um schema que a API não expõe.
--
-- Quem passa por cima das travas: conexões do próprio banco e do servidor
-- (postgres, supabase_admin, service_role, supabase_auth_admin) e funções
-- SECURITY DEFINER do dono postgres (handle_new_user, etc.). As rotas do app
-- que mudam papel e status já usam service role (setOnboardingRole,
-- setTeacherVerificationStatusByAdmin, updateCurrentTeacherProfileWithReverification,
-- oauth-ensure-teacher-role) e continuam funcionando.
--
-- Achados cobertos: V-1 (autoaprovação), papel por conta própria, C-2 + V-4
-- (certificado sem concluir / de matrícula alheia), V-2 (aluno se dar nota),
-- C-3 (analytics para professor pendente / qualquer aluno), C-4 em duas etapas
-- (função com só nome/e-mail/foto agora; retirar a policy larga depois que o
-- código usar a função — bloco comentado no fim).

create schema if not exists seguranca_interna;
revoke all on schema seguranca_interna from public;
grant usage on schema seguranca_interna to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------------

-- SECURITY INVOKER de propósito: current_user precisa ser quem chamou (a
-- API faz SET ROLE authenticated/service_role). Dentro de uma função SECURITY
-- DEFINER do postgres, current_user vira postgres e a trava libera, que é o
-- que se quer para os triggers internos do Supabase.
create or replace function seguranca_interna.privilegiado()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('postgres', 'supabase_admin', 'service_role', 'supabase_auth_admin');
$$;

create or replace function seguranca_interna.tem_papel(p_uid uuid, p_papel text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_uid is not null and exists (
    select 1
    from public.user_role ur
    join public.role r on r.id = ur.role_id
    where ur.user_profile_id = p_uid
      and r.name = p_papel
  );
$$;

create or replace function seguranca_interna.professor_aprovado(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select seguranca_interna.tem_papel(p_uid, 'teacher')
     and exists (
       select 1 from public.user_profile up
       where up.id = p_uid and up.verification_status::text = 'approved'
     );
$$;

-- Mesma regra da tela (lib/api/certificates.ts#checkCourseCompletion): curso com
-- pelo menos uma aula, toda aula concluída, toda atividade entregue, corrigida e
-- com nota >= 60% (nota máxima 10 quando vazia ou zero).
create or replace function seguranca_interna.matricula_concluida(p_enrollment uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with e as (
    select id, user_id, course_id from public.enrollment where id = p_enrollment
  )
  select exists (select 1 from e)
     and exists (select 1 from public.lesson l join e on l.course_id = e.course_id)
     and not exists (
       select 1
       from public.lesson l
       join e on l.course_id = e.course_id
       where not exists (
         select 1 from public.lesson_progress lp
         where lp.enrollment_id = e.id and lp.lesson_id = l.id and lp.is_completed
       )
     )
     and not exists (
       select 1
       from public.assignment a
       join public.lesson l on l.id = a.lesson_id
       join e on l.course_id = e.course_id
       where not exists (
         select 1 from public.assignment_submission s
         where s.assignment_id = a.id
           and s.user_id = e.user_id
           and s.graded_at is not null
           and coalesce(s.score, 0) * 100 >= 60 * coalesce(nullif(a.max_score, 0), 10)
       )
     );
$$;

-- 'ok' | 'matricula' | 'sem_permissao' | 'incompleto'
create or replace function seguranca_interna.pode_emitir_certificado(p_enrollment uuid, p_uid uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_aluno uuid;
  v_dono uuid;
begin
  select e.user_id, c.owner_id into v_aluno, v_dono
  from public.enrollment e
  left join public.course c on c.id = e.course_id
  where e.id = p_enrollment;

  if not found then
    return 'matricula';
  end if;

  if p_uid is null or not (
       p_uid = v_aluno
       or p_uid = v_dono
       or seguranca_interna.tem_papel(p_uid, 'admin')
     ) then
    return 'sem_permissao';
  end if;

  if not seguranca_interna.matricula_concluida(p_enrollment) then
    return 'incompleto';
  end if;

  return 'ok';
end;
$$;

-- Quem corrige: admin, autor da atividade ou dono do curso dela.
create or replace function seguranca_interna.pode_corrigir(p_assignment uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_uid is not null and (
    seguranca_interna.tem_papel(p_uid, 'admin')
    or exists (
      select 1
      from public.assignment a
      left join public.lesson l on l.id = a.lesson_id
      left join public.course c on c.id = l.course_id
      where a.id = p_assignment
        and (a.created_by = p_uid or c.owner_id = p_uid)
    )
  );
$$;

revoke all on all functions in schema seguranca_interna from public;
grant execute on all functions in schema seguranca_interna to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- (a) Papel e status de verificação só pelo servidor ou por admin
-- ---------------------------------------------------------------------------

create or replace function seguranca_interna.trava_user_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if seguranca_interna.privilegiado() or seguranca_interna.tem_papel(auth.uid(), 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.verification_status is not null and new.verification_status::text <> 'pending' then
      raise exception 'Só a administração aprova professor.' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.verification_status is distinct from old.verification_status then
    raise exception 'Só a administração aprova professor.' using errcode = '42501';
  end if;
  if new.is_active is distinct from old.is_active then
    raise exception 'Só a administração ativa ou desativa contas.' using errcode = '42501';
  end if;
  if new.id is distinct from old.id then
    raise exception 'Operação não permitida.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trava_user_profile on public.user_profile;
create trigger trava_user_profile
before insert or update on public.user_profile
for each row execute function seguranca_interna.trava_user_profile();

create or replace function seguranca_interna.trava_user_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if seguranca_interna.privilegiado() or seguranca_interna.tem_papel(auth.uid(), 'admin') then
    return coalesce(new, old);
  end if;
  raise exception 'Só a administração altera papéis.' using errcode = '42501';
end;
$$;

drop trigger if exists trava_user_role on public.user_role;
create trigger trava_user_role
before insert or update or delete on public.user_role
for each row execute function seguranca_interna.trava_user_role();

-- Pedido de professor: quem pede só cria pedido pendente e não mexe na decisão.
create or replace function seguranca_interna.trava_teacher_request()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_novo jsonb := to_jsonb(new);
  v_antigo jsonb;
begin
  if seguranca_interna.privilegiado() or seguranca_interna.tem_papel(auth.uid(), 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(v_novo ->> 'status', 'pending') <> 'pending'
       or v_novo ->> 'reviewed_by' is not null
       or v_novo ->> 'reviewed_at' is not null then
      raise exception 'Pedido de professor começa pendente.' using errcode = '42501';
    end if;
    return new;
  end if;

  v_antigo := to_jsonb(old);
  if v_novo -> 'status' is distinct from v_antigo -> 'status'
     or v_novo -> 'reviewed_by' is distinct from v_antigo -> 'reviewed_by'
     or v_novo -> 'reviewed_at' is distinct from v_antigo -> 'reviewed_at'
     or v_novo -> 'user_id' is distinct from v_antigo -> 'user_id' then
    raise exception 'Só a administração decide o pedido de professor.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trava_teacher_request on public.teacher_request;
create trigger trava_teacher_request
before insert or update on public.teacher_request
for each row execute function seguranca_interna.trava_teacher_request();

-- ---------------------------------------------------------------------------
-- (b) Certificado só com o curso concluído, pelo aluno, dono do curso ou admin
-- ---------------------------------------------------------------------------

create or replace function seguranca_interna.trava_certificado()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_resultado text;
begin
  if seguranca_interna.privilegiado() then
    return new;
  end if;

  v_resultado := seguranca_interna.pode_emitir_certificado(new.enrollment_id, auth.uid());

  if v_resultado = 'matricula' then
    raise exception 'Matrícula inexistente.' using errcode = '23503';
  elsif v_resultado = 'sem_permissao' then
    raise exception 'Sem permissão para emitir este certificado.' using errcode = '42501';
  elsif v_resultado = 'incompleto' then
    raise exception 'Curso não concluído. Verifique se todas as aulas e atividades estão finalizadas com nota superior a 60%%.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trava_certificado on public.certificate;
create trigger trava_certificado
before insert or update of enrollment_id on public.certificate
for each row execute function seguranca_interna.trava_certificado();

-- ---------------------------------------------------------------------------
-- (c) Nota, comentário e data de correção só por quem corrige
-- ---------------------------------------------------------------------------
-- Colunas lidas por jsonb para não quebrar se alguma (graded_by) não existir.

create or replace function seguranca_interna.trava_correcao()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_novo jsonb := to_jsonb(new);
  v_antigo jsonb;
  v_coluna text;
begin
  if seguranca_interna.privilegiado()
     or seguranca_interna.pode_corrigir(new.assignment_id, auth.uid()) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    foreach v_coluna in array array['score', 'feedback', 'graded_at', 'graded_by'] loop
      if v_novo ->> v_coluna is not null then
        raise exception 'Só o professor da atividade dá nota.' using errcode = '42501';
      end if;
    end loop;
    return new;
  end if;

  v_antigo := to_jsonb(old);
  foreach v_coluna in array array['score', 'feedback', 'graded_at', 'graded_by', 'user_id', 'assignment_id'] loop
    if v_novo -> v_coluna is distinct from v_antigo -> v_coluna then
      raise exception 'Só o professor da atividade dá nota.' using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists trava_correcao on public.assignment_submission;
create trigger trava_correcao
before insert or update on public.assignment_submission
for each row execute function seguranca_interna.trava_correcao();

-- ---------------------------------------------------------------------------
-- (d) Dados pessoais de aluno: só nome, e-mail e foto para o professor
-- ---------------------------------------------------------------------------
-- Etapa 1 (agora, não muda nenhuma tela): função que devolve só o que as telas
-- do professor usam. Etapa 2 (bloco comentado no fim): retirar a policy que hoje
-- entrega a linha inteira (CPF, telefone, endereço, nascimento), depois que o
-- código passar a usar esta função.
create or replace function public.get_course_people(p_course_id uuid)
returns table (id uuid, full_name text, email text, avatar_url text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (
    seguranca_interna.tem_papel(auth.uid(), 'admin')
    or exists (select 1 from public.course c where c.id = p_course_id and c.owner_id = auth.uid())
  ) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  return query
    select up.id, up.full_name::text, up.email::text, up.avatar_url::text
    from public.enrollment e
    join public.user_profile up on up.id = e.user_id
    where e.course_id = p_course_id;
end;
$$;

revoke execute on function public.get_course_people(uuid) from public, anon;
grant execute on function public.get_course_people(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- (e) Analytics: admin, ou professor aprovado só nos próprios cursos/alunos
-- ---------------------------------------------------------------------------
-- Hoje a aba Analytics só aparece para admin; professor não perde tela.

create or replace function public.assert_teacher_or_admin()
returns void
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  if not (
    seguranca_interna.tem_papel(auth.uid(), 'admin')
    or seguranca_interna.professor_aprovado(auth.uid())
  ) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.get_analytics_overview(
  p_date_from timestamptz default (now() - interval '30 days'),
  p_date_to timestamptz default now()
)
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  if not seguranca_interna.tem_papel(auth.uid(), 'admin') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return public.get_analytics_overview_impl(p_date_from, p_date_to);
end;
$$;

create or replace function public.get_analytics_by_learning_path(p_path_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  if not seguranca_interna.tem_papel(auth.uid(), 'admin') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return public.get_analytics_by_learning_path_impl(p_path_id);
end;
$$;

create or replace function public.get_analytics_by_course(p_course_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  if not (
    seguranca_interna.tem_papel(auth.uid(), 'admin')
    or (
      seguranca_interna.professor_aprovado(auth.uid())
      and exists (select 1 from public.course c where c.id = p_course_id and c.owner_id = auth.uid())
    )
  ) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return public.get_analytics_by_course_impl(p_course_id);
end;
$$;

create or replace function public.get_analytics_by_student(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  if not (
    seguranca_interna.tem_papel(auth.uid(), 'admin')
    or (
      seguranca_interna.professor_aprovado(auth.uid())
      and exists (
        select 1
        from public.enrollment e
        join public.course c on c.id = e.course_id
        where e.user_id = p_user_id and c.owner_id = auth.uid()
      )
    )
  ) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return public.get_analytics_by_student_impl(p_user_id);
end;
$$;

-- create or replace mantém os grants; reafirmados para o caso de alguém ter mexido.
revoke execute on function public.assert_teacher_or_admin() from public, anon;
revoke execute on function public.get_analytics_overview(timestamptz, timestamptz) from public, anon;
revoke execute on function public.get_analytics_by_course(uuid) from public, anon;
revoke execute on function public.get_analytics_by_learning_path(uuid) from public, anon;
revoke execute on function public.get_analytics_by_student(uuid) from public, anon;
grant execute on function public.get_analytics_overview(timestamptz, timestamptz) to authenticated;
grant execute on function public.get_analytics_by_course(uuid) to authenticated;
grant execute on function public.get_analytics_by_learning_path(uuid) to authenticated;
grant execute on function public.get_analytics_by_student(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- (d) Etapa 2 — NÃO RODAR AGORA
-- ---------------------------------------------------------------------------
-- Só depois que estas telas trocarem o join em user_profile por
-- public.get_course_people(), senão o professor passa a ver "Aluno" no lugar
-- do nome:
--   lib/api/assignments.ts (listas de entregas e correções: full_name, email)
--   lib/api/enrollments.ts (alunos do curso e matrícula feita pelo professor: id, full_name)
--   lib/api/activity-chat.ts (nome e foto de quem escreveu no chat)
-- (lib/api/certificates.ts lê full_name/document na emissão pelo professor, mas
-- o trigger enforce_certificate_fields já grava os dados reais; sem impacto.)
--
-- drop policy if exists "Teachers view enrolled student profiles" on public.user_profile;
