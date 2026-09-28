-- Bolsa sem valor em dinheiro (spec 003, alterada em 28/09/2026 por pedido do
-- Rafael): a tela de equipe não mostra nem pede valor, então a bolsa guarda só
-- modalidade, carga semanal e vigência. Valor de pagamento é assunto do módulo
-- financeiro (spec 007), que registra o valor de cada pagamento.
--
-- Roda depois de 20260928_gestao_papeis_acumulados.sql: `gestao.equipe()` já
-- devolve os dois papéis. Idempotente. Não aplicar automaticamente: produção é
-- compartilhada e a aplicação depende de aprovação explícita do Rafael. Código e
-- migration entram no ar juntos.

begin;

-- Muda o tipo de retorno → drop. Mesma função da spec 012, sem `valor_mensal`.
drop function if exists gestao.equipe();
create function gestao.equipe()
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
    order by m.desligado_em is not null, up.full_name;
end;
$$;

revoke execute on function gestao.equipe() from public, anon;
grant execute on function gestao.equipe() to authenticated;

alter table gestao.bolsa drop column if exists valor_mensal;

notify pgrst, 'reload schema';

commit;
