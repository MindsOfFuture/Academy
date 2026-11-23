-- Certificado verdadeiro aparecendo como inválido em /validar.
--
-- generate_verification_code() montava o código como MAIÚSCULO-minúsculo-MAIÚSCULO
-- (o bloco do meio saía de md5 sem upper), e validate_certificate() compara com
-- upper(trim(p_code)). Todo código com a-f no bloco do meio (~85%) nunca valida;
-- em 23/11/2026, 1 dos 2 certificados de produção estava nessa situação.
--
-- 1. validate_certificate compara os dois lados em maiúsculas: os códigos já
--    emitidos passam a validar sem mexer em nenhuma linha.
-- 2. generate_verification_code passa a sortear com gen_random_bytes (pgcrypto,
--    no schema extensions) e devolve tudo em maiúsculas, no mesmo formato
--    XXXX-XXXX-XXXX.
--
-- Assinaturas, SECURITY DEFINER e search_path iguais aos de produção
-- (pg_get_functiondef em 23/11/2026). create or replace mantém os grants.
-- Idempotente.

begin;

create or replace function public.validate_certificate(p_code text)
 returns table(id uuid, verification_code text, student_name text, student_cpf text, course_title text, issued_at timestamp with time zone)
 language sql
 stable security definer
 set search_path to ''
as $function$
  select
    c.id,
    c.verification_code,
    c.student_name,
    case
      when length(regexp_replace(coalesce(c.student_cpf, ''), '\D', '', 'g')) = 11
        then '***.' || substr(regexp_replace(c.student_cpf, '\D', '', 'g'), 4, 3)
             || '.' || substr(regexp_replace(c.student_cpf, '\D', '', 'g'), 7, 3)
             || '-**'
      else null
    end as student_cpf,
    c.course_title,
    c.issued_at
  from public.certificate c
  where upper(c.verification_code) = upper(trim(p_code));
$function$;

create or replace function public.generate_verification_code()
 returns text
 language plpgsql
 set search_path to 'public'
as $function$
declare
  bruto text;
  code text;
  exists_already boolean;
begin
  loop
    -- 6 bytes aleatórios = 12 dígitos hexadecimais, em maiúsculas.
    bruto := upper(encode(extensions.gen_random_bytes(6), 'hex'));
    code := substr(bruto, 1, 4) || '-' || substr(bruto, 5, 4) || '-' || substr(bruto, 9, 4);

    select exists(
      select 1 from public.certificate where upper(verification_code) = code
    ) into exists_already;
    exit when not exists_already;
  end loop;
  return code;
end;
$function$;

commit;
