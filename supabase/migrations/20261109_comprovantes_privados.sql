-- MÉDIO: comprovantes de professor (diploma, documento) ficavam num bucket
-- público: quem obtivesse a URL lia o arquivo para sempre. O app agora exibe
-- só URL assinada de 1h (lib/api/comprovante.ts) e grava a forma pública como
-- referência, então o bucket pode fechar sem migrar dados: as 4 URLs gravadas
-- (teacher_request e metadados do cadastro) seguem o formato reconhecido.
--
-- Rodar SÓ depois do deploy do commit "fix(seguranca): comprovante de professor
-- só por URL assinada"; antes dele, os links do admin e do perfil quebrariam.
update storage.buckets set public = false where id = 'teacher-qualification-documents';
