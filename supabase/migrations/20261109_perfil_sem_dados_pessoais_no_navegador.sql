-- ALTO: as policies "Students view their teachers profiles" e "Teachers view
-- enrolled student profiles" liberam a linha inteira de user_profile. Bastava
-- se matricular num curso ativo (qualquer aluno pode) para ler CPF, nascimento,
-- telefone e endereço do professor. RLS não filtra coluna, então o corte é por
-- privilégio: `anon`/`authenticated` não leem mais essas quatro colunas, nem do
-- próprio perfil. O app lê o próprio perfil e as listas do admin no servidor,
-- com service role preso ao id verificado ou com createAdminClient.
--
-- Rodar SÓ depois do deploy do código que deixou de ler essas colunas no
-- navegador (commit "fix(seguranca): dados pessoais do perfil só pelo servidor").
-- O código novo funciona com ou sem esta migração.
revoke select on public.user_profile from anon, authenticated;
grant select (
  id, full_name, email, avatar_url, bio, is_active, created_at, updated_at,
  verification_status, specialties, certifications, timezone, notification_preferences
) on public.user_profile to anon, authenticated;
-- anon segue sem policy de SELECT (zero linhas), mas precisa do privilégio de
-- coluna: artigos públicos embutem `author:author_id(full_name)` e, sem ele, a
-- consulta inteira falharia em vez de trazer o autor vazio.
