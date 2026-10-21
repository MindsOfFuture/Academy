-- Spec 019 — a coordenação muda os números da página inicial.
--
-- A página inicial lê `public.system_config` (chaves `escolas_atendidas` e
-- `alunos_atendidos`, valor em texto). As policies dessa tabela nasceram no
-- painel (ADR 008) e não mudam aqui: a escrita passa só por esta função, que
-- confere o papel de coordenação. Idempotente.

create or replace function gestao.definir_numeros_do_site(p_escolas integer, p_alunos integer)
returns void
language plpgsql
volatile
security definer
set search_path = 'gestao', 'public'
as $$
declare
  v_chave text;
  v_valor integer;
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: só a coordenação muda os números do site'
      using errcode = '42501';
  end if;
  if p_escolas is null or p_alunos is null
     or p_escolas < 0 or p_alunos < 0
     or p_escolas > 1000000 or p_alunos > 1000000 then
    raise exception 'gestao: use números inteiros entre 0 e 1.000.000'
      using errcode = '22023';
  end if;

  foreach v_chave in array array['escolas_atendidas', 'alunos_atendidos'] loop
    v_valor := case v_chave when 'escolas_atendidas' then p_escolas else p_alunos end;
    update public.system_config
       set value = v_valor::text, updated_at = now()
     where key = v_chave;
    if not found then
      insert into public.system_config (key, value, updated_at)
      values (v_chave, v_valor::text, now());
    end if;
  end loop;
end;
$$;

revoke execute on function gestao.definir_numeros_do_site(integer, integer) from public, anon;
grant execute on function gestao.definir_numeros_do_site(integer, integer) to authenticated;
