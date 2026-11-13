-- Não aplicar automaticamente: aplicada pelo responsável antes do deploy.
--
-- Progresso da jornada do Laboratório de Gestão guardado na conta.
-- Uma linha por pessoa com uma cópia das respostas que o app guarda no
-- navegador (chaves `lg2-*`). Assim a pessoa para quando quiser e continua em
-- outro aparelho. Cada pessoa só lê e grava a própria linha.

begin;

create table if not exists public.lg2_progresso (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  constraint lg2_progresso_dados_objeto check (jsonb_typeof(dados) = 'object'),
  constraint lg2_progresso_dados_tamanho check (pg_column_size(dados) < 512000)
);

alter table public.lg2_progresso enable row level security;

revoke all on table public.lg2_progresso from public, anon;
grant select, insert, update on table public.lg2_progresso to authenticated;

drop policy if exists "lg2_progresso_le_o_proprio" on public.lg2_progresso;
create policy "lg2_progresso_le_o_proprio" on public.lg2_progresso
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "lg2_progresso_cria_o_proprio" on public.lg2_progresso;
create policy "lg2_progresso_cria_o_proprio" on public.lg2_progresso
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "lg2_progresso_altera_o_proprio" on public.lg2_progresso;
create policy "lg2_progresso_altera_o_proprio" on public.lg2_progresso
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

commit;
