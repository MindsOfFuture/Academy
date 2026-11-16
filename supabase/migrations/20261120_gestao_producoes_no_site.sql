-- Produções da pesquisa no site (pedido da coordenação em 15/11/2026).
--
--   - Toda produção cadastrada na aba Pesquisa aparece na página de artigos do
--     site, com o link para onde foi publicada. Ficam de fora só as do E2E.
--   - Tipo novo: vídeo.
--
-- `public.producoes_do_site()` é security definer porque o visitante (anon)
-- não lê `gestao`; ela devolve só o que vai para o site.
--
-- Depende de 20261117_gestao_pesquisa.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

alter table gestao.producao_pesquisa drop constraint if exists producao_pesquisa_tipo_check;
alter table gestao.producao_pesquisa add constraint producao_pesquisa_tipo_check
  check (tipo in ('artigo_congresso', 'artigo_publicado', 'relatorio', 'substack', 'ebook', 'video', 'outro'));

create or replace function public.producoes_do_site()
returns table (id uuid, tipo text, titulo text, autores text, data date, onde text, link text)
language sql
stable
security definer
set search_path = ''
as $$
  -- O link vai para um href público: só http(s), mesmo que o check da tabela mude.
  select p.id, p.tipo, p.titulo, p.autores, p.data, p.onde,
    case when p.link ~* '^https?://' then p.link end
  from gestao.producao_pesquisa p
  where not p.teste
  order by p.data desc, p.criado_em desc
$$;

revoke execute on function public.producoes_do_site() from public;
grant execute on function public.producoes_do_site() to anon, authenticated;

commit;
