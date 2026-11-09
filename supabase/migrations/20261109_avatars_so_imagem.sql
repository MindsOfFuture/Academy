-- MÉDIO: o bucket público `avatars` não limitava tipo nem tamanho. A validação
-- (JPG/PNG/GIF/WEBP, 2MB) só existia no navegador, então qualquer conta podia
-- hospedar HTML/SVG com script ou arquivos grandes no storage do projeto.
-- Mesma regra de `uploadAvatarClient` (lib/api/profiles.ts), agora no servidor.
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    file_size_limit = 2097152
where id = 'avatars';
