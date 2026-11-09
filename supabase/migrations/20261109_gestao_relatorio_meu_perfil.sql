-- Cabeçalho do relatório mensal: nome e CPF de quem está logado.
--
-- A migração 20261109_perfil_sem_dados_pessoais_no_navegador tira o CPF
-- (`document`) do que `authenticated` lê em public.user_profile. A gestão não
-- usa service role (ADR 021), então o relatório lê o próprio CPF por esta
-- função: devolve só a linha de auth.uid(), nunca a de outra pessoa.
-- Idempotente.

begin;

create or replace function gestao.meu_perfil_para_relatorio()
 returns table(nome text, cpf text)
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select coalesce(up.full_name, ''), up.document
  from public.user_profile up
  where up.id = auth.uid();
$function$;

revoke execute on function gestao.meu_perfil_para_relatorio() from public, anon;
grant execute on function gestao.meu_perfil_para_relatorio() to authenticated;

commit;
