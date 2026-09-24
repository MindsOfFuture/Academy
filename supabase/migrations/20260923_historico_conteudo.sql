-- Histórico detalhado de cursos, módulos e aulas.
-- A captura acontece no banco para que nenhuma escrita da aplicação deixe de
-- registrar autoria e os valores necessários para reconstrução manual.

begin;

create table if not exists public.historico_conteudo (
  id bigint generated always as identity primary key,
  tabela text not null check (tabela in ('course', 'course_module', 'lesson')),
  registro_id uuid not null,
  curso_id uuid,
  acao text not null check (acao in ('insert', 'update', 'delete')),
  autor uuid,
  ocorrido_em timestamptz not null default now(),
  antes jsonb,
  depois jsonb,
  campos_alterados text[]
);

create index if not exists historico_conteudo_curso_ocorrido_idx
  on public.historico_conteudo (curso_id, ocorrido_em desc);

alter table public.historico_conteudo enable row level security;
alter table public.historico_conteudo force row level security;

drop policy if exists "responsavel_le_historico_conteudo" on public.historico_conteudo;
create policy "responsavel_le_historico_conteudo"
  on public.historico_conteudo
  as permissive
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.course c
      where c.id = historico_conteudo.curso_id
        and c.owner_id = (select auth.uid())
    )
  );

-- A função roda com o dono da migration para atravessar a RLS forçada somente
-- no caminho interno das triggers. `search_path` vazio impede troca de objetos.
create or replace function public.registrar_historico_conteudo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  linha_antes jsonb;
  linha_depois jsonb;
  linha_referencia jsonb;
  campos text[];
  curso uuid;
begin
  if tg_op = 'INSERT' then
    linha_depois := to_jsonb(new);
    linha_referencia := linha_depois;

    select coalesce(array_agg(chave order by chave), array[]::text[])
      into campos
      from jsonb_object_keys(linha_depois) as chave;
  elsif tg_op = 'DELETE' then
    linha_antes := to_jsonb(old);
    linha_referencia := linha_antes;

    select coalesce(array_agg(chave order by chave), array[]::text[])
      into campos
      from jsonb_object_keys(linha_antes) as chave;
  else
    linha_antes := to_jsonb(old);
    linha_depois := to_jsonb(new);
    linha_referencia := linha_depois;

    select coalesce(array_agg(chave order by chave), array[]::text[])
      into campos
      from (
        select jsonb_object_keys(linha_antes) as chave
        union
        select jsonb_object_keys(linha_depois) as chave
      ) as chaves
      where chave not in ('created_at', 'updated_at')
        and linha_antes -> chave is distinct from linha_depois -> chave;

    if cardinality(campos) = 0 then
      return null;
    end if;
  end if;

  if tg_table_name = 'course' then
    curso := (linha_referencia ->> 'id')::uuid;
  elsif tg_table_name = 'course_module' then
    curso := (linha_referencia ->> 'course_id')::uuid;
  else
    curso := nullif(linha_referencia ->> 'course_id', '')::uuid;
    if curso is null then
      select modulo.course_id
        into curso
        from public.course_module modulo
        where modulo.id = nullif(linha_referencia ->> 'module_id', '')::uuid;
    end if;
  end if;

  insert into public.historico_conteudo (
    tabela,
    registro_id,
    curso_id,
    acao,
    autor,
    antes,
    depois,
    campos_alterados
  )
  values (
    tg_table_name,
    (linha_referencia ->> 'id')::uuid,
    curso,
    lower(tg_op),
    auth.uid(),
    linha_antes,
    linha_depois,
    campos
  );

  return null;
end;
$$;

revoke execute on function public.registrar_historico_conteudo() from public, anon, authenticated;

-- A ausência de grants de escrita barra clientes comuns; esta trigger também
-- barra dono da tabela, admin e service role. Histórico gravado não se reescreve.
create or replace function public.rejeitar_escrita_historico_conteudo()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'historico_conteudo é append-only: % não é permitido', lower(tg_op)
    using errcode = '42501';
end;
$$;

revoke execute on function public.rejeitar_escrita_historico_conteudo() from public, anon, authenticated;

drop trigger if exists registrar_historico_conteudo on public.course;
create trigger registrar_historico_conteudo
  after insert or update or delete on public.course
  for each row execute function public.registrar_historico_conteudo();

drop trigger if exists registrar_historico_conteudo on public.course_module;
create trigger registrar_historico_conteudo
  after insert or update or delete on public.course_module
  for each row execute function public.registrar_historico_conteudo();

drop trigger if exists registrar_historico_conteudo on public.lesson;
create trigger registrar_historico_conteudo
  after insert or update or delete on public.lesson
  for each row execute function public.registrar_historico_conteudo();

drop trigger if exists rejeitar_escrita_historico_conteudo on public.historico_conteudo;
create trigger rejeitar_escrita_historico_conteudo
  before update or delete on public.historico_conteudo
  for each row execute function public.rejeitar_escrita_historico_conteudo();

revoke all on table public.historico_conteudo from public, anon, authenticated, service_role;
revoke all on sequence public.historico_conteudo_id_seq from public, anon, authenticated, service_role;
grant select on table public.historico_conteudo to authenticated;

commit;
