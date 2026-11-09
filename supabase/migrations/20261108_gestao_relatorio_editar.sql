-- Quem cadastrou edita e apaga a própria atividade do relatório enquanto o mês
-- dela não terminou (horário de Brasília). Mês fechado fica como está: é o que
-- foi para o relatório. A edição também não leva a atividade para um mês
-- fechado. Só nome e data mudam. Idempotente.

begin;

create or replace function gestao.mes_aberto(p_data date)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_data >= date_trunc('month', now() at time zone 'America/Sao_Paulo')::date
$$;

grant execute on function gestao.mes_aberto(date) to authenticated;

grant update (nome, data), delete on table gestao.atividade_relatorio to authenticated;

drop policy if exists "dono_edita_mes_aberto" on gestao.atividade_relatorio;
create policy "dono_edita_mes_aberto" on gestao.atividade_relatorio
  for update to authenticated
  using (user_profile_id = auth.uid() and gestao.mes_aberto(data))
  with check (user_profile_id = auth.uid() and gestao.mes_aberto(data));

drop policy if exists "dono_apaga_mes_aberto" on gestao.atividade_relatorio;
create policy "dono_apaga_mes_aberto" on gestao.atividade_relatorio
  for delete to authenticated
  using (user_profile_id = auth.uid() and gestao.mes_aberto(data));

commit;
