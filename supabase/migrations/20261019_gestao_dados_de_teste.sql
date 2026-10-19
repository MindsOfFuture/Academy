-- Dados do E2E separados da equipe real.
--
-- O E2E da alocação (e2e/flows/gestao-alocacao.spec.ts) escreve no banco de
-- produção com contas e escolas dedicadas. Até aqui elas apareciam para a
-- coordenação real na equipe, nas listas de escola e na carga do mês.
--
-- Agora membro e escola têm a marca `teste`, e cada lado só vê o seu:
--   - conta real não vê membro nem escola de teste;
--   - conta de teste não vê membro nem escola real — avisos e pendências
--     disparados pelo E2E não chegam a quem trabalha de verdade.
-- Escola criada por conta de teste já nasce marcada.
--
-- A separação vale em `gestao.equipe()` (de onde sai toda lista de pessoas da
-- tela) e numa policy restritiva de leitura em `gestao.escola`. Fora dela, de
-- propósito: `nomes_da_equipe()` (só traduz id em nome no histórico) e
-- `buscar_usuarios()` (busca por nome digitado, para adicionar à equipe).
--
-- Marcar as contas e escolas do E2E é passo de dado, feito à parte pela
-- coordenação. Com tudo `false` nada muda para ninguém. Idempotente.

begin;

alter table gestao.papel_membro add column if not exists teste boolean not null default false;
alter table gestao.escola add column if not exists teste boolean not null default false;

-- Quem chama é conta de teste? Quem não é membro conta como real.
create or replace function gestao.sou_teste()
returns boolean
language sql
stable
security definer
set search_path = 'gestao'
as $$
  select coalesce((select m.teste from gestao.papel_membro m where m.user_profile_id = auth.uid()), false)
$$;

revoke execute on function gestao.sou_teste() from public, anon;
grant execute on function gestao.sou_teste() to authenticated;

alter table gestao.escola alter column teste set default gestao.sou_teste();

drop policy if exists "teste_separado" on gestao.escola;
create policy "teste_separado" on gestao.escola
  as restrictive for select to authenticated
  using (teste = gestao.sou_teste());

create or replace function gestao.equipe()
returns table (
  user_profile_id uuid,
  nome text,
  email text,
  coordenacao boolean,
  bolsista boolean,
  desligado_em timestamptz,
  membro_desde timestamptz,
  bolsa_id uuid,
  modalidade text,
  carga_semanal_horas numeric,
  bolsa_inicio date,
  bolsa_fim date,
  tem_alocacao boolean
)
language plpgsql
stable
security definer
set search_path = 'gestao', 'public'
as $$
#variable_conflict use_column
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: apenas a coordenação vê a equipe' using errcode = '42501';
  end if;
  return query
    select
      m.user_profile_id,
      up.full_name,
      up.email,
      m.coordenacao,
      m.bolsista,
      m.desligado_em,
      m.criado_em,
      b.id,
      b.modalidade,
      b.carga_semanal_horas,
      b.inicio,
      b.fim,
      exists (select 1 from gestao.agenda_bolsista ab where ab.bolsista_id = m.user_profile_id)
    from gestao.papel_membro m
    left join public.user_profile up on up.id = m.user_profile_id
    left join lateral (
      select bb.id, bb.modalidade, bb.carga_semanal_horas, bb.inicio, bb.fim
      from gestao.bolsa bb
      where bb.bolsista_id = m.user_profile_id
        and current_date between bb.inicio and bb.fim
      order by bb.inicio desc
      limit 1
    ) b on true
    where m.teste = gestao.sou_teste()
    order by m.desligado_em is not null, up.full_name;
end;
$$;

revoke execute on function gestao.equipe() from public, anon;
grant execute on function gestao.equipe() to authenticated;

commit;
