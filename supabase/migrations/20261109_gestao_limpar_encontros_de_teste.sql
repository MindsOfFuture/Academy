-- O E2E da alocação (e2e/flows/gestao-alocacao.spec.ts) lança encontros num dia
-- de 2001 a cada execução, e a alocação não apaga encontro (de propósito). Sem
-- limpeza eles acumulam no banco de produção, o único que existe.
--
-- Esta função é a única exclusão de encontro, e só para dado de teste: quem
-- chama precisa ser conta de teste da gestão, e só some encontro de 2001 cuja
-- escola (se houver) é de teste e cujas pessoas alocadas são todas de teste.
-- Equipe e aula do encontro vão junto (ON DELETE CASCADE).
-- Só encontro criado há mais de uma hora: duas execuções do CI ao mesmo tempo
-- (development e main) usam o mesmo ano, e uma não pode apagar o da outra.
create or replace function gestao.limpar_encontros_de_teste()
 returns integer
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_apagados integer;
begin
  if not exists (
    select 1 from gestao.papel_membro pm where pm.user_profile_id = auth.uid() and pm.teste
  ) then
    raise exception 'gestao: só conta de teste limpa dados de teste' using errcode = '42501';
  end if;

  delete from gestao.agenda a
  where a.data < date '2002-01-01'
    and a.criado_em < now() - interval '1 hour'
    and (a.escola_id is null or exists (
      select 1 from gestao.escola e where e.id = a.escola_id and e.teste
    ))
    and not exists (
      select 1
      from gestao.agenda_bolsista ab
      left join gestao.papel_membro pm on pm.user_profile_id = ab.bolsista_id
      where ab.agenda_id = a.id and coalesce(pm.teste, false) = false
    );

  get diagnostics v_apagados = row_count;
  return v_apagados;
end;
$function$;

revoke execute on function gestao.limpar_encontros_de_teste() from public, anon;
grant execute on function gestao.limpar_encontros_de_teste() to authenticated;
