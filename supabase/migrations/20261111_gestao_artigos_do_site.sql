-- A coordenação cria e edita os artigos do site pela aba "Artigos" da gestão.
--
-- Exceção registrada ao ADR 021 (ver ADR 028): esta migration mexe em tabelas
-- fora do schema `gestao` — `public.article` e `storage.objects` (pasta
-- `site-media/covers/`) — porque artigo é conteúdo do site, não dado da gestão.
-- Sem service role: quem escreve é a própria coordenação, pela RLS abaixo.
-- Apagar artigo continua só com o admin ("Admins manage articles").
--
-- O trigger `trg_article_require_verified_teacher` barra quem não é admin nem
-- professor aprovado; a função dele ganha uma saída para a coordenação, só
-- quando a tabela é `article` (course e learning_path ficam como estavam).
--
-- Depende de 20260923_gestao_fundacao.sql (gestao.usuario_com_papel).
-- Idempotente. Não aplicar automaticamente: produção é compartilhada. Aplicar
-- ANTES do deploy do código.

begin;

-- ---------------------------------------------------------------------------
-- public.article
-- ---------------------------------------------------------------------------
drop policy if exists "Coordenacao le artigos" on public.article;
create policy "Coordenacao le artigos" on public.article
  for select to authenticated
  using (gestao.usuario_com_papel('coordenacao'));

drop policy if exists "Coordenacao cria artigos" on public.article;
create policy "Coordenacao cria artigos" on public.article
  for insert to authenticated
  with check (gestao.usuario_com_papel('coordenacao') and author_id = auth.uid());

drop policy if exists "Coordenacao edita artigos" on public.article;
create policy "Coordenacao edita artigos" on public.article
  for update to authenticated
  using (gestao.usuario_com_papel('coordenacao'))
  with check (gestao.usuario_com_papel('coordenacao'));

-- ---------------------------------------------------------------------------
-- Capa: upload em site-media/covers/
-- ---------------------------------------------------------------------------
drop policy if exists "Coordenacao envia capa de artigo" on storage.objects;
create policy "Coordenacao envia capa de artigo" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and name ~ '^covers/[^/]+$'
    and gestao.usuario_com_papel('coordenacao')
  );

-- ---------------------------------------------------------------------------
-- Trigger de conteúdo: mesmo corpo de produção, mais a saída da coordenação
-- ---------------------------------------------------------------------------
create or replace function public.enforce_verified_teacher_for_content()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();

  if v_actor is null then
    return new;
  end if;

  if public.is_user_admin(v_actor) then
    return new;
  end if;

  if tg_table_name = 'article' and gestao.usuario_com_papel('coordenacao') then
    return new;
  end if;

  if not public.is_teacher_approved(v_actor) then
    raise exception 'Professor não verificado. Aguarde aprovação do administrador.' using errcode = '42501';
  end if;

  return new;
end;
$function$;

commit;
