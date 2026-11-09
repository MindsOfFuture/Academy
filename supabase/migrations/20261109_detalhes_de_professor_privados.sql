-- BAIXO: "Public can view teacher details" (using true) deixava qualquer
-- visitante, sem login, listar escolas, formação e grau de todos os professores.
-- O app só lê essa tabela para o próprio professor e para o admin, e ambos têm
-- policy própria ("Users can view own teacher details", "Admins can view all
-- teacher details").
drop policy if exists "Public can view teacher details" on public.teacher_details;
