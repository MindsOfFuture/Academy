-- Telefone, endereço, CPF e nascimento de quem está logado.
--
-- A migração 20261109_perfil_sem_dados_pessoais_no_navegador tirou essas
-- colunas do que `authenticated` lê em public.user_profile, inclusive da própria
-- linha. A página de perfil e o callback de login liam o próprio perfil com
-- service role, o que fazia toda página de perfil depender da chave de serviço.
-- Esta função devolve só a linha de auth.uid(), nunca a de outra pessoa.
create or replace function public.meus_dados_pessoais()
 returns table(phone text, address text, document text, birth_date date)
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select up.phone, up.address, up.document, up.birth_date
  from public.user_profile up
  where up.id = auth.uid();
$function$;

revoke execute on function public.meus_dados_pessoais() from public, anon;
grant execute on function public.meus_dados_pessoais() to authenticated;
