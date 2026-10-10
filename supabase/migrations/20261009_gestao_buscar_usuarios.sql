-- Busca de pessoas para adicionar à equipe (spec 015).
--
-- Substitui, na tela, a busca por e-mail exato de 20260923_gestao_fundacao.sql.
-- A coordenação digita parte do nome (ou o começo do e-mail) e escolhe numa
-- lista. A maioria das contas do site é de aluno, então a busca continua
-- estreita de propósito, para não virar listagem de contas:
--   - só a coordenação ativa chama;
--   - pelo menos 3 letras, no máximo 10 resultados;
--   - e-mail só por prefixo (não dá para listar "todo mundo do gmail");
--   - devolve o e-mail parcial ("le***@gmail.com"), só para separar homônimos;
--   - conta excluída (e-mail apagado pela anonimização) não aparece.
--
-- `gestao.buscar_usuario_por_email` fica: o código no ar ainda a usa até o
-- deploy desta mudança. Remover numa migration seguinte.
--
-- Depende de 20260928_gestao_papeis_acumulados.sql. Idempotente.

begin;

create or replace function gestao.buscar_usuarios(p_termo text)
returns table (
  id uuid,
  nome text,
  email_parcial text,
  coordenacao boolean,
  bolsista boolean,
  desligado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = 'gestao', 'public'
as $$
#variable_conflict use_column
declare
  termo text := btrim(coalesce(p_termo, ''));
  -- `%` e `_` digitados são texto, não curinga.
  literal text := replace(replace(replace(btrim(coalesce(p_termo, '')), '\', '\\'), '%', '\%'), '_', '\_');
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: apenas a coordenação busca pessoas' using errcode = '42501';
  end if;
  if char_length(termo) < 3 then
    return;
  end if;

  return query
    select
      up.id,
      up.full_name,
      left(split_part(up.email, '@', 1), 2) || '***@' || split_part(up.email, '@', 2),
      m.coordenacao,
      m.bolsista,
      m.desligado_em
    from public.user_profile up
    left join gestao.papel_membro m on m.user_profile_id = up.id
    where up.email is not null
      and (up.full_name ilike '%' || literal || '%' or up.email ilike literal || '%')
    order by up.full_name
    limit 10;
end;
$$;

revoke execute on function gestao.buscar_usuarios(text) from public, anon;
grant execute on function gestao.buscar_usuarios(text) to authenticated;

commit;
