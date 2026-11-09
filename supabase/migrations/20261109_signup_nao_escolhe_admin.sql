-- CRÍTICO: o papel inicial vinha de `raw_user_meta_data->>'user_type'`, que o
-- próprio usuário escreve no signUp (anon key, no bundle do browser). Quem
-- mandasse `user_type: "admin"` nascia administrador. O cadastro só oferece
-- aluno e professor; qualquer outro valor vira aluno. Admin é dado por admin.
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  user_role_type text;
begin
  user_role_type := case
    when new.raw_user_meta_data->>'user_type' = 'teacher' then 'teacher'
    else 'student'
  end;

  insert into public.user_profile (id, email, full_name, avatar_url, phone, address, document, birth_date)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'document',
    case
      when new.raw_user_meta_data->>'birth_date' is not null
      then (new.raw_user_meta_data->>'birth_date')::date
      else null
    end
  );

  insert into public.user_role (user_profile_id, role_id)
  select new.id, id from public.role where name = user_role_type;

  if user_role_type = 'student' then
    insert into public.student_details (user_id, parent_name, school, grade)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'parent_name', ''),
      coalesce(new.raw_user_meta_data->>'school', ''),
      coalesce(new.raw_user_meta_data->>'grade', '')
    );
  elsif user_role_type = 'teacher' then
    insert into public.teacher_details (user_id, schools, education_level, degree)
    values (
      new.id,
      coalesce(
        array(select jsonb_array_elements_text(new.raw_user_meta_data->'schools')),
        array[coalesce(new.raw_user_meta_data->>'schools', '')]
      ),
      coalesce(new.raw_user_meta_data->>'education_level', ''),
      coalesce(new.raw_user_meta_data->>'degree', '')
    );
  end if;

  return new;
end;
$function$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
