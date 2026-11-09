-- CRÍTICO: a policy "Users and Admins update profile" deixa a pessoa atualizar a
-- própria linha de user_profile inteira. O gate de publicação
-- (is_teacher_approved / ensureCurrentTeacherVerifiedForPublishing) lê
-- user_profile.verification_status, então qualquer cadastro como professor
-- (papel dado no signUp) se aprovava com um update pelo navegador.
--
-- Escritas legítimas desses campos vêm do service role (auth.uid() nulo) ou de
-- admin; o navegador só edita nome, e-mail, telefone e endereço.
create or replace function public.proteger_campos_de_verificacao()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_table_name = 'user_profile' then
    if new.verification_status is distinct from old.verification_status
       or new.is_active is distinct from old.is_active then
      raise exception 'Somente a administração altera a verificação da conta.' using errcode = '42501';
    end if;
  elsif tg_op = 'INSERT' then
    if new.status is distinct from 'pending' or new.reviewed_by is not null or new.reviewed_at is not null then
      raise exception 'Somente a administração revisa solicitações de professor.' using errcode = '42501';
    end if;
  elsif new.status is distinct from old.status
        or new.reviewed_by is distinct from old.reviewed_by
        or new.reviewed_at is distinct from old.reviewed_at then
    raise exception 'Somente a administração revisa solicitações de professor.' using errcode = '42501';
  end if;

  return new;
end;
$function$;

revoke execute on function public.proteger_campos_de_verificacao() from public, anon, authenticated;

drop trigger if exists proteger_campos_de_verificacao on public.user_profile;
create trigger proteger_campos_de_verificacao
  before update on public.user_profile
  for each row execute function public.proteger_campos_de_verificacao();

drop trigger if exists proteger_campos_de_verificacao on public.teacher_request;
create trigger proteger_campos_de_verificacao
  before insert or update on public.teacher_request
  for each row execute function public.proteger_campos_de_verificacao();
