-- Fixture: o que o schema public do Academy tem ANTES das migrations do repo,
-- reconstruído a partir do código (lib/api/*) e dos comentários das migrations
-- 20260825/20260902. As policies aqui são o pior caso plausível (largas), para
-- provar que as travas valem mesmo quando a RLS deixaria passar.

create table public.role (id integer primary key, name text not null unique);
create table public.user_role (
  user_profile_id uuid not null references public.user_profile(id),
  role_id integer not null references public.role(id),
  granted_by uuid
);
alter table public.user_profile
  add column full_name text,
  add column email text,
  add column document text,
  add column phone text,
  add column address text,
  add column birth_date date,
  add column avatar_url text,
  add column bio text,
  add column verification_status text,
  add column is_active boolean default true,
  add column updated_at timestamptz;

create table public.teacher_request (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null default 'pending',
  qualification_document_url text,
  observations text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);
create table public.course (id uuid primary key, title text, owner_id uuid);
create table public.lesson (id uuid primary key, course_id uuid references public.course(id), title text);
create table public.enrollment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id uuid not null references public.course(id),
  status text default 'active',
  completed_at timestamptz
);
create table public.lesson_progress (
  enrollment_id uuid not null references public.enrollment(id),
  lesson_id uuid not null references public.lesson(id),
  is_completed boolean default false
);
create table public.assignment (
  id uuid primary key,
  lesson_id uuid references public.lesson(id),
  title text,
  max_score numeric,
  created_by uuid
);
create table public.assignment_submission (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignment(id),
  user_id uuid,
  enrollment_id uuid,
  content_url text,
  comments text,
  score numeric,
  feedback text,
  graded_at timestamptz,
  graded_by uuid,
  submitted_at timestamptz default now()
);
create table public.certificate (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollment(id),
  student_name text,
  student_cpf text,
  course_title text,
  verification_code text,
  pdf_url text,
  issued_at timestamptz default now()
);
create table public.article (id uuid primary key default gen_random_uuid(), author_id uuid, status text);

-- Funções que existem no projeto hospedado (corpos não versionados): stubs com
-- a mesma assinatura, para as migrations do repo rodarem.
create function public.is_admin() returns boolean language sql stable security definer as $$
  select exists (select 1 from public.user_role ur join public.role r on r.id = ur.role_id
                 where ur.user_profile_id = auth.uid() and r.name = 'admin') $$;
create function public.is_user_admin(uuid) returns boolean language sql stable as $$ select false $$;
create function public.is_teacher_approved(uuid) returns boolean language sql stable as $$ select false $$;
create function public.is_teacher_or_admin() returns boolean language sql stable security definer as $$
  select exists (select 1 from public.user_role ur join public.role r on r.id = ur.role_id
                 where ur.user_profile_id = auth.uid() and r.name in ('teacher', 'admin')) $$;
create function public.scrub_deleted_user_personal_data(uuid) returns void language sql as $$ select $$;
create function public.handle_new_user() returns trigger language plpgsql as $$ begin return new; end $$;
create function public.handle_auth_user_deleted() returns trigger language plpgsql as $$ begin return old; end $$;
create function public.handle_teacher_request_on_signup() returns trigger language plpgsql as $$ begin return new; end $$;
create function public.auto_record_milestone() returns trigger language plpgsql as $$ begin return new; end $$;
create function public.enforce_verified_teacher_for_content() returns trigger language plpgsql as $$ begin return new; end $$;
create function public.auto_fill_submission_enrollment() returns trigger language plpgsql as $$ begin return new; end $$;
create function public.check_course_completion() returns trigger language plpgsql as $$ begin return new; end $$;
create function public.generate_verification_code() returns text language sql as $$ select upper(substr(md5(random()::text), 1, 10)) $$;
create function public.set_certificate_verification_code() returns trigger language plpgsql as $$
begin
  if new.verification_code is null then new.verification_code := public.generate_verification_code(); end if;
  return new;
end $$;
create trigger set_certificate_verification_code before insert on public.certificate
  for each row execute function public.set_certificate_verification_code();
create function public.update_updated_at_column() returns trigger language plpgsql as $$ begin return new; end $$;
create function public.handle_updated_at() returns trigger language plpgsql as $$ begin return new; end $$;
create function public.trigger_set_updated_at() returns trigger language plpgsql as $$ begin return new; end $$;
create function public.get_analytics_overview(p_date_from timestamptz default (now() - interval '30 days'), p_date_to timestamptz default now())
  returns jsonb language sql stable security definer as $$ select '{"scope":"platform"}'::jsonb $$;
create function public.get_analytics_by_course(p_course_id uuid) returns jsonb language sql stable security definer as $$ select jsonb_build_object('course', p_course_id) $$;
create function public.get_analytics_by_learning_path(p_path_id uuid) returns jsonb language sql stable security definer as $$ select jsonb_build_object('path', p_path_id) $$;
create function public.get_analytics_by_student(p_user_id uuid) returns jsonb language sql stable security definer as $$ select jsonb_build_object('student', p_user_id) $$;
create function public.get_students_list() returns table (id uuid, full_name text) language sql security definer as $$ select id, full_name from public.user_profile $$;
create function public.get_enrollable_users() returns table (id uuid, full_name text) language sql security definer as $$ select id, full_name from public.user_profile $$;

-- RLS de pior caso.
alter table public.user_profile enable row level security;
alter table public.user_role enable row level security;
alter table public.teacher_request enable row level security;
alter table public.certificate enable row level security;
alter table public.assignment_submission enable row level security;
alter table public.enrollment enable row level security;
alter table public.article enable row level security;

create policy "own profile read" on public.user_profile for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.user_profile for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.user_profile for insert to authenticated with check (id = auth.uid());
create policy "admin profiles" on public.user_profile for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Teachers view all profiles" on public.user_profile for select to authenticated using (public.is_teacher_or_admin());

create policy "own roles read" on public.user_role for select to authenticated using (user_profile_id = auth.uid());
create policy "own roles write (pior caso)" on public.user_role for all to authenticated using (user_profile_id = auth.uid()) with check (user_profile_id = auth.uid());

create policy "own request" on public.teacher_request for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "read certificates" on public.certificate for select to authenticated using (true);
create policy "Users can insert own certificates" on public.certificate for insert to authenticated with check (true);
create policy "Teachers and Admins can insert certificates" on public.certificate for insert to authenticated with check (public.is_teacher_or_admin());

create policy "own submission" on public.assignment_submission for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "teacher grade any (pior caso)" on public.assignment_submission for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create policy "read enrollments" on public.enrollment for select to authenticated using (true);
create policy "own enrollment" on public.enrollment for insert to authenticated with check (user_id = auth.uid());

create policy "Author manage articles" on public.article for all to authenticated using (author_id = auth.uid());

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage on schema public to service_role;
grant usage on schema auth to service_role;
