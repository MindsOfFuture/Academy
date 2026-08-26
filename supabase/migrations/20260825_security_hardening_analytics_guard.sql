-- Auditoria de segurança (2026-08-25), parte 2 — APLICADA em 2026-08-26
-- como migration 20260826021041_security_hardening_analytics_guard.
--
-- A migration 20260825_security_hardening.sql já removeu o EXECUTE do papel
-- `anon` nas RPCs de analytics. Falta a outra metade: `authenticated` precisa
-- continuar chamando (a aba Analytics roda no browser com o JWT do usuário),
-- mas as funções não checam quem chama — então qualquer aluno logado consegue
-- pedir get_analytics_by_student('<uuid de outro aluno>') e ler a telemetria
-- de aprendizagem dele.
--
-- A guarda entra por fora: a implementação é renomeada para *_impl e fica sem
-- EXECUTE para todo mundo; o nome original vira um wrapper que valida o papel
-- antes de delegar. Assim não é preciso reescrever os corpos das funções.

create or replace function public.assert_teacher_or_admin()
returns void
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  if not exists (
    select 1
    from public.user_role ur
    join public.role r on r.id = ur.role_id
    where ur.user_profile_id = auth.uid()
      and r.name in ('teacher', 'admin')
  ) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.assert_teacher_or_admin() from public, anon;

alter function public.get_analytics_overview(timestamptz, timestamptz) rename to get_analytics_overview_impl;
alter function public.get_analytics_by_course(uuid) rename to get_analytics_by_course_impl;
alter function public.get_analytics_by_learning_path(uuid) rename to get_analytics_by_learning_path_impl;
alter function public.get_analytics_by_student(uuid) rename to get_analytics_by_student_impl;

revoke execute on function public.get_analytics_overview_impl(timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.get_analytics_by_course_impl(uuid) from public, anon, authenticated;
revoke execute on function public.get_analytics_by_learning_path_impl(uuid) from public, anon, authenticated;
revoke execute on function public.get_analytics_by_student_impl(uuid) from public, anon, authenticated;

create function public.get_analytics_overview(
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
  perform public.assert_teacher_or_admin();
  return public.get_analytics_overview_impl(p_date_from, p_date_to);
end;
$$;

create function public.get_analytics_by_course(p_course_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  perform public.assert_teacher_or_admin();
  return public.get_analytics_by_course_impl(p_course_id);
end;
$$;

create function public.get_analytics_by_learning_path(p_path_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  perform public.assert_teacher_or_admin();
  return public.get_analytics_by_learning_path_impl(p_path_id);
end;
$$;

create function public.get_analytics_by_student(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  perform public.assert_teacher_or_admin();
  return public.get_analytics_by_student_impl(p_user_id);
end;
$$;

revoke execute on function public.get_analytics_overview(timestamptz, timestamptz) from public, anon;
revoke execute on function public.get_analytics_by_course(uuid) from public, anon;
revoke execute on function public.get_analytics_by_learning_path(uuid) from public, anon;
revoke execute on function public.get_analytics_by_student(uuid) from public, anon;

grant execute on function public.get_analytics_overview(timestamptz, timestamptz) to authenticated;
grant execute on function public.get_analytics_by_course(uuid) to authenticated;
grant execute on function public.get_analytics_by_learning_path(uuid) to authenticated;
grant execute on function public.get_analytics_by_student(uuid) to authenticated;
