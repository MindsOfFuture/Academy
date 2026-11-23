-- E-mail do perfil só muda pelo login (e-mail confirmado), nunca pelo navegador.
--
-- A policy "Users and Admins update profile" deixa a pessoa atualizar a própria
-- linha inteira de user_profile, e o grant de UPDATE de authenticated é na
-- tabela toda (has_column_privilege em 23/11/2026: true para email), então um
-- revoke só da coluna não teria efeito. Com isso dava para gravar no próprio
-- perfil o e-mail de outra pessoa:
--   - gestao.buscar_usuario_por_email casava por user_profile.email com
--     "limit 1" e podia devolver o impostor quando a coordenação ia dar papel
--     de bolsista ou coordenação a alguém;
--   - gestao.buscar_usuarios mostra o começo desse e-mail para separar
--     homônimos;
--   - avisos por e-mail saem para user_profile.email.
--
-- 1. proteger_campos_de_verificacao (já é o BEFORE UPDATE de user_profile)
--    também barra mudança de email vinda de sessão do navegador. Continuam
--    gravando: service role e rotas do servidor (auth.uid() nulo), admin, e
--    funções SECURITY DEFINER (current_user deixa de ser authenticated/anon),
--    como a anonimização da exclusão de conta e a sincronização abaixo.
-- 2. Novo gatilho em auth.users copia o e-mail para o perfil quando o login
--    troca de e-mail. Com "secure email change" ligado, auth.users.email só
--    muda depois da confirmação, então o perfil passa a ter sempre o e-mail
--    confirmado. Antes não havia sincronização: o perfil recebia o e-mail novo
--    direto do navegador, ainda sem confirmar.
-- 3. gestao.buscar_usuario_por_email casa pelo e-mail do login (auth.users),
--    só de conta confirmada, ligado ao perfil pelo id. Assinatura, SECURITY
--    DEFINER, search_path e grants iguais aos de produção.
--
-- Ordem de publicação: o código que para de mandar email no update do perfil
-- (lib/api/profiles.ts) vai antes ou junto; o código antigo manda o mesmo
-- e-mail quando ele não mudou, o que continua passando.
-- Idempotente.

begin;

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
    -- current_user é o papel de quem chamou (esta função não é SECURITY DEFINER):
    -- authenticated/anon = navegador; dentro de função SECURITY DEFINER é o dono dela.
    if new.email is distinct from old.email
       and current_user in ('authenticated', 'anon') then
      raise exception 'O e-mail da conta muda pela confirmação enviada ao novo endereço.' using errcode = '42501';
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

create or replace function public.sincronizar_email_do_perfil()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  update public.user_profile
     set email = new.email
   where id = new.id
     and email is distinct from new.email;
  return new;
end;
$function$;

revoke execute on function public.sincronizar_email_do_perfil() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sincronizar_email_do_perfil();

create or replace function gestao.buscar_usuario_por_email(p_email text)
 returns table(id uuid, nome text, email text, coordenacao boolean, bolsista boolean, desligado_em timestamp with time zone)
 language plpgsql
 stable security definer
 set search_path to 'gestao', 'public'
as $function$
#variable_conflict use_column
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: apenas a coordenação busca pessoas' using errcode = '42501';
  end if;
  return query
    select up.id, up.full_name, u.email::text, m.coordenacao, m.bolsista, m.desligado_em
    from auth.users u
    join public.user_profile up on up.id = u.id
    left join gestao.papel_membro m on m.user_profile_id = up.id
    where lower(u.email) = lower(btrim(p_email))
      and u.email_confirmed_at is not null
    limit 1;
end;
$function$;

revoke execute on function gestao.buscar_usuario_por_email(text) from public, anon;
grant execute on function gestao.buscar_usuario_por_email(text) to authenticated;

commit;
