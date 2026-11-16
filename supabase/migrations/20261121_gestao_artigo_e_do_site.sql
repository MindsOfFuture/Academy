-- Artigo é o do site (pedido da coordenação em 16/11/2026).
--
-- "Artigo publicado", "Artigo em congresso" e os artigos do site eram a mesma
-- coisa em três lugares. Artigo passa a ser só o do site (`public.article`,
-- com texto, autores e onde foi publicado); as produções ficam com relatório,
-- Substack, e-book, vídeo e outro. Não havia produção cadastrada como artigo.
--
-- Depende de 20261120_gestao_producoes_no_site.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

alter table gestao.producao_pesquisa drop constraint if exists producao_pesquisa_tipo_check;
alter table gestao.producao_pesquisa add constraint producao_pesquisa_tipo_check
  check (tipo in ('relatorio', 'substack', 'ebook', 'video', 'outro'));

commit;
