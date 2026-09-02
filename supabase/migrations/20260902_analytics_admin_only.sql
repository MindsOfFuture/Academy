-- Analytics: alinha a autorização das RPCs ao produto (somente administradores).
--
-- A guarda anterior permitia `teacher` e `admin`, mas a interface nunca expõe
-- Analytics para professores: courses-section.tsx só renderiza a aba quando
-- `isAdmin`, e AnalyticsTab também rejeita qualquer usuário não administrador.
-- Como os quatro wrappers são SECURITY DEFINER, confiar apenas na interface
-- deixava qualquer professor consultar métricas globais e dados de qualquer
-- aluno chamando as RPCs diretamente.
--
-- Restringir por course.owner_id não representa o produto atual e quebraria os
-- dados hospedados: os sete cursos pertencem a um perfil com papel `student`.
-- Tornar as RPCs admin-only fecha o vazamento sem depender desse dado inconsistente.

create or replace function public.assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.user_role ur
    join public.role r on r.id = ur.role_id
    where ur.user_profile_id = auth.uid()
      and r.name = 'admin'
  ) then
    raise exception 'Acesso restrito a administradores.' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.assert_admin() from public, anon, authenticated;

create or replace function public.get_analytics_overview(
  p_date_from timestamptz default (now() - interval '30 days'),
  p_date_to timestamptz default now()
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return public.get_analytics_overview_impl(p_date_from, p_date_to);
end;
$$;

create or replace function public.get_analytics_by_course(p_course_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return public.get_analytics_by_course_impl(p_course_id);
end;
$$;

create or replace function public.get_analytics_by_learning_path(p_path_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return public.get_analytics_by_learning_path_impl(p_path_id);
end;
$$;

create or replace function public.get_analytics_by_student(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return public.get_analytics_by_student_impl(p_user_id);
end;
$$;

-- A função genérica só era usada pelos quatro wrappers acima. Removê-la evita
-- que uma nova RPC SECURITY DEFINER volte a adotar acidentalmente a guarda ampla.
drop function if exists public.assert_teacher_or_admin();

-- `create or replace` preserva os grants dos wrappers. Reafirmamos o contrato
-- explicitamente para evitar regressão caso esta migration rode num banco novo.
revoke execute on function public.get_analytics_overview(timestamptz, timestamptz) from public, anon;
revoke execute on function public.get_analytics_by_course(uuid) from public, anon;
revoke execute on function public.get_analytics_by_learning_path(uuid) from public, anon;
revoke execute on function public.get_analytics_by_student(uuid) from public, anon;

grant execute on function public.get_analytics_overview(timestamptz, timestamptz) to authenticated;
grant execute on function public.get_analytics_by_course(uuid) to authenticated;
grant execute on function public.get_analytics_by_learning_path(uuid) to authenticated;
grant execute on function public.get_analytics_by_student(uuid) to authenticated;
