-- Relatório do mês: atividades que a pessoa fez para o projeto fora dos
-- encontros (preparar aula, reunião externa, montar material...).
--
-- Cada atividade é privada: só quem cadastrou vê, nem a coordenação. Cadastra
-- quem é membro ativo da gestão (bolsista ou coordenação), sempre em nome
-- próprio. Sem edição nem exclusão nesta versão. Idempotente.

begin;

create table if not exists gestao.atividade_relatorio (
  id uuid primary key default gen_random_uuid(),
  user_profile_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 2 and 200),
  data date not null,
  criado_em timestamptz not null default now()
);

create index if not exists atividade_relatorio_dono_data on gestao.atividade_relatorio (user_profile_id, data);

alter table gestao.atividade_relatorio enable row level security;
revoke all on table gestao.atividade_relatorio from public, anon, authenticated;
grant select, insert on table gestao.atividade_relatorio to authenticated;

drop policy if exists "dono_le" on gestao.atividade_relatorio;
create policy "dono_le" on gestao.atividade_relatorio
  for select to authenticated
  using (user_profile_id = auth.uid());

drop policy if exists "membro_cadastra_o_seu" on gestao.atividade_relatorio;
create policy "membro_cadastra_o_seu" on gestao.atividade_relatorio
  for insert to authenticated
  with check (user_profile_id = auth.uid() and gestao.e_membro());

commit;
