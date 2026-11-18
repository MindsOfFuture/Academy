-- Destaques da página inicial: a coordenação muda o texto e escolhe quais aparecem (spec 028)
--
-- A página inicial mostra três números logo abaixo do logo (escolas, alunos, aulas).
-- Até aqui só o número base era editável (spec 019/021). Agora, por destaque:
--   - texto que aparece embaixo do número (`public_home_rotulo_<destaque>`)
--   - se aparece ou não no site (`public_home_mostrar_<destaque>`, 'true' | 'false')
-- O prefixo `public_` já é legível pelo visitante na policy "Public read config" de
-- `public.system_config`; nenhuma policy muda. Sem a chave, o site usa o texto de
-- sempre e esconde "aulas" (pedido da coordenação, 18/11/2026).
--
-- Escrita só por esta função, que reaproveita `gestao.definir_numeros_do_site`
-- (mesma checagem de coordenação e mesma faixa de números) numa única chamada:
-- números e textos mudam juntos ou nada muda.

begin;

create or replace function gestao.definir_destaques_do_site(
  p_escolas integer,
  p_alunos integer,
  p_aulas integer,
  p_rotulo_escolas text,
  p_rotulo_alunos text,
  p_rotulo_aulas text,
  p_mostrar_escolas boolean,
  p_mostrar_alunos boolean,
  p_mostrar_aulas boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = 'gestao', 'public'
as $$
declare
  v_chave text;
  v_valor text;
  v_rotulo text;
begin
  if p_aulas is null then
    raise exception 'gestao: use números inteiros entre 0 e 1.000.000'
      using errcode = '22023';
  end if;
  -- Confere a coordenação e grava os três números base.
  perform gestao.definir_numeros_do_site(p_escolas, p_alunos, p_aulas);

  foreach v_rotulo in array array[p_rotulo_escolas, p_rotulo_alunos, p_rotulo_aulas] loop
    if v_rotulo is null or char_length(btrim(v_rotulo)) < 2 or char_length(btrim(v_rotulo)) > 40 then
      raise exception 'gestao: o texto de cada número precisa ter de 2 a 40 letras'
        using errcode = '22023';
    end if;
  end loop;
  if p_mostrar_escolas is null or p_mostrar_alunos is null or p_mostrar_aulas is null then
    raise exception 'gestao: diga se cada número aparece ou não no site'
      using errcode = '22023';
  end if;

  foreach v_chave in array array[
    'public_home_rotulo_escolas', 'public_home_rotulo_alunos', 'public_home_rotulo_aulas',
    'public_home_mostrar_escolas', 'public_home_mostrar_alunos', 'public_home_mostrar_aulas'
  ] loop
    v_valor := case v_chave
      when 'public_home_rotulo_escolas' then btrim(p_rotulo_escolas)
      when 'public_home_rotulo_alunos' then btrim(p_rotulo_alunos)
      when 'public_home_rotulo_aulas' then btrim(p_rotulo_aulas)
      when 'public_home_mostrar_escolas' then p_mostrar_escolas::text
      when 'public_home_mostrar_alunos' then p_mostrar_alunos::text
      else p_mostrar_aulas::text
    end;
    update public.system_config
       set value = v_valor, updated_at = now(), updated_by = auth.uid()
     where key = v_chave;
    if not found then
      insert into public.system_config (key, value, updated_at, updated_by)
      values (v_chave, v_valor, now(), auth.uid());
    end if;
  end loop;
end;
$$;

revoke execute on function gestao.definir_destaques_do_site(integer, integer, integer, text, text, text, boolean, boolean, boolean) from public, anon;
grant execute on function gestao.definir_destaques_do_site(integer, integer, integer, text, text, text, boolean, boolean, boolean) to authenticated;

commit;
