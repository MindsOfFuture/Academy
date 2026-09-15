-- Correções da revisão de 20260825_security_hardening.sql (2026-09-02).
--
-- Por que um arquivo NOVO e não uma edição do 20260825: aquele arquivo já foi
-- commitado (11ffa08) e já foi aplicado no projeto hospedado. Editar migration
-- aplicada não muda nada em produção e desincroniza o histórico. Correção de
-- migration aplicada é sempre migration nova.
--
-- IMPORTANTE — este arquivo foi REESCRITO depois de reproduzir o comportamento
-- real contra o banco hospedado (projeto jrfehrhiyilxhbuwjmat). A versão
-- anterior partia de um diagnóstico que a reprodução REFUTOU. Ver o bloco
-- "Diagnóstico medido" abaixo antes de alterar qualquer coisa aqui.

-- ---------------------------------------------------------------------------
-- Diagnóstico medido (não inferido) — 2026-09-02
-- ---------------------------------------------------------------------------
-- Hipótese original da revisão:
--   "o WITH CHECK da policy de INSERT em certificate quebrou a emissão por
--    professor, porque student_name/student_cpf/course_title são comparados
--    contra o perfil de auth.uid()".
--
-- REFUTADA. Reproduzido com `set local role authenticated` + jwt.claims do
-- professor, em transação revertida: o INSERT com verification_code explícito
-- PASSOU pela policy. Motivo: o 20260825 manteve a policy permissiva
-- "Teachers and Admins can insert certificates" (WITH CHECK is_teacher_or_admin()),
-- e policies permissivas são OR'd — a policy do aluno nunca era o gargalo.
--
-- A QUEBRA REAL, que a revisão não viu, é outra e é PIOR (atinge aluno E
-- professor, ou seja, 100% da emissão):
--
--   20260825 linha 27:  revoke execute on function public.generate_verification_code() ...
--   20260825 linha 26:  revoke execute on function public.set_certificate_verification_code() ...
--
-- `set_certificate_verification_code()` é o trigger BEFORE INSERT que preenche
-- `verification_code` quando ele vem NULL — e o app NUNCA envia esse campo
-- (lib/api/certificates.ts:489-496 e o caminho do próprio aluno). Esse trigger
-- NÃO é SECURITY DEFINER, então roda com os privilégios de quem chama, e chama
-- `generate_verification_code()`, de quem o EXECUTE acabou de ser revogado.
-- Resultado medido, com o INSERT que o app realmente faz:
--
--   ERROR 42501: permission denied for function generate_verification_code
--   CONTEXT: PL/pgSQL function set_certificate_verification_code() line 4
--
-- Confirmado para os dois atores (professor e o próprio aluno). Corroborado
-- pelos dados: a tabela `certificate` tem 2 linhas, emitidas em 2026-04-29 e
-- 2026-05-13 — nenhuma desde que o 20260825 foi aplicado.
--
-- Efeito colateral do mesmo diagnóstico: como a policy de professor só checa
-- papel (nunca os campos), a validação anti-forja que a revisão queria NÃO
-- existia de fato. Medido: um professor conseguiu inserir
-- student_name='NOME TOTALMENTE FORJADO', cpf='00000000000',
-- course_title='CURSO QUE NAO EXISTE' numa matrícula alheia. Então o
-- endurecimento continua necessário — só não pelo motivo alegado.
--
-- Itens B, C e D da versão anterior deste arquivo ficaram FORA porque a
-- consulta ao catálogo mostrou que já estão satisfeitos, e reaplicá-los seria
-- ruído (ou regressão):
--   B. `scrub_deleted_user_personal_data` existe como `(uuid)` (não `()`), e o
--      revoke do 20260825 funcionou: has_function_privilege = false para anon
--      e authenticated. Nada a fazer.
--   C. relrowsecurity já é true em user_profile, certificate e article.
--   D. get_students_list()/get_enrollable_users() já têm proconfig
--      `search_path=""`, que é MAIS restrito que o `'public'` proposto —
--      trocar seria piorar. Nenhuma SECURITY DEFINER em public está com
--      proconfig NULL (verificado: 0 linhas).

-- ---------------------------------------------------------------------------
-- 1. Destrava a emissão de certificado (a regressão P1 de verdade)
-- ---------------------------------------------------------------------------
-- Duas saídas possíveis: devolver EXECUTE de generate_verification_code() para
-- `authenticated`, ou tornar o trigger SECURITY DEFINER. A segunda é a certa:
-- generate_verification_code() RETURNS text, então o PostgREST a exporia como
-- RPC — dar EXECUTE de volta permitiria enumerar/minerar códigos de validação
-- direto da API. Mantendo o revoke e elevando só o trigger, o código continua
-- inacessível de fora e volta a ser gerado no INSERT.
alter function public.set_certificate_verification_code() security definer;

-- ---------------------------------------------------------------------------
-- 2. Integridade dos campos denormalizados do certificado
-- ---------------------------------------------------------------------------
-- Validação de campo NÃO pode viver na policy: subquery em expressão de policy
-- roda com os privilégios de quem chama e SOFRE a RLS das tabelas lidas. Medido
-- neste banco: a policy "Teachers view enrolled student profiles" exige
-- `course.owner_id = auth.uid()`, então um professor que não é dono do curso
-- lê ZERO linhas de user_profile para aquele aluno. O client cai nos fallbacks
-- (`profile?.full_name || "Aluno"`, `document || ""` —
-- lib/api/certificates.ts:470-471) e manda 'Aluno'/''.
--
-- Por isso a abordagem "comparar e rejeitar" foi descartada: ela transforma
-- exatamente esse caminho legítimo num erro 42501. Medido com o trigger de
-- comparação: `student_name nao corresponde: recebeu Aluno, esperava Leandro
-- Fortunato Moreira`.
--
-- A abordagem adotada é AUTORITATIVA: o trigger SECURITY DEFINER (imune a RLS)
-- IGNORA o que o cliente enviou e SOBRESCREVE os três campos com a verdade do
-- banco, sempre a partir do DONO DO ENROLLMENT — nunca de auth.uid(). Isso
-- fecha a forja e, de bônus, conserta a integridade do dado no caminho em que
-- o professor não conseguia ler o perfil (que hoje gravaria "Aluno"/"").
create or replace function public.enforce_certificate_fields()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_user_id      uuid;
  v_full_name    text;
  v_document     text;
  v_course_title text;
begin
  select e.user_id, c.title
    into v_user_id, v_course_title
  from public.enrollment e
  join public.course c on c.id = e.course_id
  where e.id = new.enrollment_id;

  if v_user_id is null then
    raise exception 'Matrícula inexistente.' using errcode = '23503';
  end if;

  select up.full_name, up.document
    into v_full_name, v_document
  from public.user_profile up
  where up.id = v_user_id;

  -- Mesmos fallbacks do cliente ("Aluno"/"Curso"), para perfil sem nome ou
  -- curso sem título. O que o cliente mandou é descartado.
  new.student_name  := coalesce(v_full_name, 'Aluno');
  new.student_cpf   := coalesce(v_document, '');
  new.course_title  := coalesce(v_course_title, 'Curso');

  return new;
end;
$$;

revoke execute on function public.enforce_certificate_fields() from public, anon, authenticated;

-- `update of <colunas>` dispara só quando essas colunas aparecem no SET, então
-- regeneração de PDF (`update ... set pdf_url = ...`) não passa pelo trigger.
-- Verificado em transação revertida.
drop trigger if exists enforce_certificate_fields on public.certificate;
create trigger enforce_certificate_fields
before insert or update of student_name, student_cpf, course_title, enrollment_id
on public.certificate
for each row execute function public.enforce_certificate_fields();

-- Policy do aluno: as comparações de campo saem (o trigger cobre integridade e
-- não depende de RLS); fica só a autorização, que é o papel da policy.
-- Os privilégios de professor/admin continuam vindo da policy já existente
-- "Teachers and Admins can insert certificates" — deliberadamente NÃO ampliada
-- aqui: neste banco os 7 cursos têm owner_id de um usuário com papel 'student',
-- então liberar por `course.owner_id` concederia emissão a quem não é staff.
-- `create policy` não é idempotente (42710), então o drop cobre os dois nomes.
drop policy if exists "Users can insert own certificates" on public.certificate;
drop policy if exists "Insert certificate for own enrollment" on public.certificate;

create policy "Insert certificate for own enrollment"
on public.certificate
for insert
to authenticated
with check (
  exists (
    select 1
    from public.enrollment e
    where e.id = certificate.enrollment_id
      and e.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- 3. anon não deve enxergar as funções de listagem de pessoas
-- ---------------------------------------------------------------------------
-- Achado da query de verificação nº 4 do arquivo anterior: get_students_list()
-- e get_enrollable_users() são SECURITY DEFINER e ainda tinham EXECUTE para
-- anon. Hoje devolvem 0 linhas para anon, mas são SECURITY DEFINER expostas
-- como RPC — o app as chama autenticado, então anon não perde nada.
--
-- ATENÇÃO: o revoke tem de ser de PUBLIC, não de `anon`. O proacl destas duas
-- era `{=X/postgres, postgres=X/postgres, service_role=X/postgres,
-- authenticated=X/postgres}` — o `=X/postgres` é o grant para PUBLIC, e `anon`
-- herda dele. `revoke ... from anon` é NO-OP nesse cenário: aplicado primeiro
-- assim, has_function_privilege('anon', ...) continuou true.
-- Revogar de PUBLIC é seguro aqui porque `authenticated` tem grant explícito
-- próprio, que sobrevive ao revoke — verificado em transação revertida antes
-- de aplicar (anon: false, authenticated: true).
revoke execute on function public.get_students_list() from public;
revoke execute on function public.get_enrollable_users() from public;

-- ---------------------------------------------------------------------------
-- Verificação pós-aplicação
-- ---------------------------------------------------------------------------
-- Executada após aplicar; resultados registrados no card t_1d3c0fe3.
--
-- 1) Emissão volta a funcionar e a forja é neutralizada (transação revertida,
--    com jwt.claims de professor e de aluno):
--      insert into public.certificate (enrollment_id, student_name, student_cpf, course_title)
--      values ('<enrollment>', 'NOME FORJADO', '00000000000', 'CURSO FALSO')
--      returning student_name, student_cpf, course_title, verification_code;
--    Esperado: os três campos voltam com os dados reais da matrícula e
--    verification_code não-nulo.
--
-- 2) Trigger de código de verificação elevado:
--      select proname, prosecdef from pg_proc
--      where proname = 'set_certificate_verification_code';
--
-- 3) generate_verification_code() continua fora do alcance da API:
--      select has_function_privilege('anon', p.oid, 'execute'),
--             has_function_privilege('authenticated', p.oid, 'execute')
--      from pg_proc p where p.proname = 'generate_verification_code';
--
-- 4) O que anon ainda executa em public:
--      select p.oid::regprocedure from pg_proc p
--      join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute');
