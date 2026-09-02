-- Saneia a propriedade institucional dos cursos do Academy.
--
-- Decisão de produto (Rafael, 2026-09-02): enquanto não houver um mapa
-- curso -> professor, os sete cursos são institucionais e pertencem à conta
-- admin da coordenação do Minds. A coordenadora selecionada é Cristina Sayuri
-- Côrtes Ouchi Dusi (cris@minds.com), perfil
-- 110a372a-c292-4c24-b38a-840e0fcf08ee.
--
-- Esta migration não altera as RPCs de Analytics, que permanecem admin-only.

do $migration$
declare
  v_target_owner constant uuid := '110a372a-c292-4c24-b38a-840e0fcf08ee';
  v_previous_owner constant uuid := '32c9c822-6d5c-48c8-8654-31224c5532e6';
  v_expected_courses constant integer := 7;
  v_found_courses integer;
  v_problem text;
begin
  if not exists (
    select 1
    from public.user_profile up
    where up.id = v_target_owner
      and up.is_active is true
  ) then
    raise exception 'Owner institucional esperado não existe ou está inativo: %', v_target_owner;
  end if;

  if not exists (
    select 1
    from public.user_role ur
    join public.role r on r.id = ur.role_id
    where ur.user_profile_id = v_target_owner
      and r.name = 'admin'
  ) then
    raise exception 'Owner institucional esperado não possui papel admin: %', v_target_owner;
  end if;

  with expected_course(id, title) as (
    values
      ('0ae9df9e-7012-4cee-a56d-d7a159ed384a'::uuid, 'Curso para Alunos - Introdução à Programação'),
      ('c2e0e5d7-4198-4e35-8e4e-6ad57bb3c079'::uuid, 'Curso para Professores - Metodologias de Ensino'),
      ('a1111111-1111-1111-1111-111111111111'::uuid, 'Introdução à Programação com Python'),
      ('a2222222-2222-2222-2222-222222222222'::uuid, 'Desenvolvimento Web com HTML, CSS e JavaScript'),
      ('a3333333-3333-3333-3333-333333333333'::uuid, 'Lógica de Programação e Algoritmos'),
      ('b1111111-1111-1111-1111-111111111111'::uuid, 'Metodologias Ativas no Ensino de Programação'),
      ('b2222222-2222-2222-2222-222222222222'::uuid, 'Criação de Material Didático Digital')
  )
  select count(*)
  into v_found_courses
  from public.course c
  join expected_course expected
    on expected.id = c.id
   and expected.title = c.title;

  if v_found_courses <> v_expected_courses then
    raise exception 'Mapa de cursos divergente: esperados %, encontrados %',
      v_expected_courses, v_found_courses;
  end if;

  with expected_course(id) as (
    values
      ('0ae9df9e-7012-4cee-a56d-d7a159ed384a'::uuid),
      ('c2e0e5d7-4198-4e35-8e4e-6ad57bb3c079'::uuid),
      ('a1111111-1111-1111-1111-111111111111'::uuid),
      ('a2222222-2222-2222-2222-222222222222'::uuid),
      ('a3333333-3333-3333-3333-333333333333'::uuid),
      ('b1111111-1111-1111-1111-111111111111'::uuid),
      ('b2222222-2222-2222-2222-222222222222'::uuid)
  )
  select string_agg(format('%s (%s)', c.title, coalesce(c.owner_id::text, 'sem owner')), ', ' order by c.title)
  into v_problem
  from public.course c
  join expected_course expected on expected.id = c.id
  where c.owner_id is distinct from v_previous_owner
    and c.owner_id is distinct from v_target_owner;

  if v_problem is not null then
    raise exception 'Migration recusou sobrescrever ownership inesperado: %', v_problem;
  end if;

  update public.course
  set owner_id = v_target_owner,
      updated_at = now()
  where id in (
    '0ae9df9e-7012-4cee-a56d-d7a159ed384a'::uuid,
    'c2e0e5d7-4198-4e35-8e4e-6ad57bb3c079'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'a2222222-2222-2222-2222-222222222222'::uuid,
    'a3333333-3333-3333-3333-333333333333'::uuid,
    'b1111111-1111-1111-1111-111111111111'::uuid,
    'b2222222-2222-2222-2222-222222222222'::uuid
  )
    and owner_id is distinct from v_target_owner;

  with expected_course(id) as (
    values
      ('0ae9df9e-7012-4cee-a56d-d7a159ed384a'::uuid),
      ('c2e0e5d7-4198-4e35-8e4e-6ad57bb3c079'::uuid),
      ('a1111111-1111-1111-1111-111111111111'::uuid),
      ('a2222222-2222-2222-2222-222222222222'::uuid),
      ('a3333333-3333-3333-3333-333333333333'::uuid),
      ('b1111111-1111-1111-1111-111111111111'::uuid),
      ('b2222222-2222-2222-2222-222222222222'::uuid)
  )
  select string_agg(c.id::text, ', ' order by c.id)
  into v_problem
  from public.course c
  join expected_course expected on expected.id = c.id
  where c.owner_id is distinct from v_target_owner;

  if v_problem is not null then
    raise exception 'Nem todos os cursos receberam o owner institucional: %', v_problem;
  end if;

  select string_agg(format('%s (%s)', c.title, coalesce(c.owner_id::text, 'sem owner')), ', ' order by c.title)
  into v_problem
  from public.course c
  where c.owner_id is null
     or not exists (
       select 1
       from public.user_role ur
       join public.role r on r.id = ur.role_id
       where ur.user_profile_id = c.owner_id
         and r.name in ('teacher', 'admin')
     );

  if v_problem is not null then
    raise exception 'Há cursos com owner ausente ou sem papel teacher/admin: %', v_problem;
  end if;
end
$migration$;
