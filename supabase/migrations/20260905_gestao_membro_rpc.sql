-- Ponte de autorização para a rota /gestao (spec 002, guardrail #4 do plano).
--
-- O papel de membro vive em gestao.papel_membro e é resolvido por auth.uid().
-- A RLS de gestao.papel_membro só deixa a coordenação ler a tabela, então um
-- bolsista não consegue consultar o próprio vínculo diretamente. Esta função
-- pública (SECURITY DEFINER, set search_path, imune à RLS e sem caminho de
-- service role) devolve o papel do chamador — a única via segura para o guard
-- server-side da rota decidir acesso sem quebrar o modelo "papel de membro".
--
-- Chamada por lib/api/gestao/auth.ts via supabase.rpc('gestao_membro_papel').

begin;

create or replace function public.gestao_membro_papel()
returns text
language plpgsql
stable
security definer
set search_path = 'gestao', 'public'
as $$
begin
  if auth.uid() is null then
    return null;
  end if;
  return (
    select m.papel
    from gestao.papel_membro m
    where m.user_profile_id = auth.uid()
    limit 1
  );
end;
$$;

revoke execute on function public.gestao_membro_papel() from public, anon;
grant execute on function public.gestao_membro_papel() to authenticated;

commit;