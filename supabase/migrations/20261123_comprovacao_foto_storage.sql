-- Bucket das fotos de comprovação da gestão (pedido de 21/11/2026), par de
-- 20261123_gestao_foto_e_atividade_com_equipe.sql.
--
-- Privado, até 20 MB, só JPEG/PNG/WebP. Cada membro envia e apaga na própria
-- pasta ("<id>/<uuid>.<ext>"); qualquer membro da gestão lê, porque o relatório
-- de um bolsista mostra as fotos dos colegas do mesmo encontro e a coordenação
-- abre o registro de todos. A tela usa só URL assinada.
--
-- `storage` nasceu no painel; fica fora da cadeia de testes PGlite da gestão.
-- Idempotente. Aplicar ANTES do deploy.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gestao-comprovacao', 'gestao-comprovacao', false, 20971520, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Membro envia foto de comprovacao" on storage.objects;
create policy "Membro envia foto de comprovacao" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'gestao-comprovacao'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
    and split_part(name, '/', 1) = auth.uid()::text
    and gestao.e_membro()
  );

drop policy if exists "Membro le foto de comprovacao" on storage.objects;
create policy "Membro le foto de comprovacao" on storage.objects
  for select to authenticated
  using (bucket_id = 'gestao-comprovacao' and gestao.e_membro());

drop policy if exists "Membro apaga a propria foto de comprovacao" on storage.objects;
create policy "Membro apaga a propria foto de comprovacao" on storage.objects
  for delete to authenticated
  using (bucket_id = 'gestao-comprovacao' and split_part(name, '/', 1) = auth.uid()::text);

commit;
