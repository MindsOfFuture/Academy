-- Spec 015: bounded literal substring search, coordinator-only profile projection.
-- No profile policy changes, service role, or global admin privilege.
begin;
create or replace function gestao.buscar_usuarios(p_busca text, p_limite integer default 20)
returns table(id uuid, nome text, email text, coordenacao boolean, bolsista boolean, desligado_em timestamptz)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  termo text := btrim(p_busca);
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: apenas a coordenação busca pessoas' using errcode = '42501';
  end if;
  if termo is null or char_length(termo) < 2 or char_length(termo) > 100 then
    raise exception 'Digite entre 2 e 100 caracteres para buscar.' using errcode = '22023';
  end if;
  if p_limite is null or p_limite < 1 or p_limite > 50 then
    raise exception 'Limite de busca inválido.' using errcode = '22023';
  end if;
  -- strpos instead of LIKE: %, _ and backslash are ordinary literal input.
  return query
    select up.id, up.full_name, up.email, m.coordenacao, m.bolsista, m.desligado_em
    from public.user_profile up
    left join gestao.papel_membro m on m.user_profile_id = up.id
    where strpos(lower(up.full_name), lower(termo)) > 0
       or strpos(lower(up.email), lower(termo)) > 0
    order by lower(up.full_name) nulls last, lower(up.email), up.id
    limit p_limite;
end;
$$;
revoke all on function gestao.buscar_usuarios(text,integer) from public, anon;
grant execute on function gestao.buscar_usuarios(text,integer) to authenticated;
commit;
