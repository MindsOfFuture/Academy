create or replace function public.scrub_deleted_user_personal_data()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_profile
    set full_name = 'Usuario excluido',
        email = null,
        avatar_url = null,
        bio = null,
        phone = null,
        address = null,
        document = null,
        birth_date = null,
        specialties = '{}'::text[],
        certifications = '{}'::text[],
        verification_status = null,
        is_active = false,
        updated_at = now()
  where id = old.id;

  delete from public.user_role where user_profile_id = old.id;
  delete from public.student_details where user_id = old.id;
  delete from public.teacher_details where user_id = old.id;
  delete from public.teacher_request where user_id = old.id;
  delete from public.notification where user_id = old.id;

  return old;
end;
$$;

drop trigger if exists scrub_deleted_user_personal_data on auth.users;
create trigger scrub_deleted_user_personal_data
after delete on auth.users
for each row execute procedure public.scrub_deleted_user_personal_data();
