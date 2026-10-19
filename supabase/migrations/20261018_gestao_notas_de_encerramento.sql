-- Notas de encerramento por bolsista; sai o gestor do encontro (pedido da
-- coordenação em 18/10/2026).
--
-- Cada bolsista que esteve no encontro ("prevista" ou "cumprida") escreve a
-- própria nota depois da hora de início. Quando a última nota chega, o encontro
-- se conclui sozinho. A coordenação continua podendo concluir a qualquer hora,
-- com ou sem notas; o relatório do encontro passa a ser opcional e fica com ela.
-- A coluna `gestor` sai em 20261018_gestao_sem_gestor.sql, aplicada só depois
-- do deploy: o código anterior ainda a lê.
--
-- Depende de 20261009_gestao_lembrete_no_modelo.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada.

begin;

alter table gestao.agenda_bolsista
  add column if not exists nota_encerramento text check (char_length(nota_encerramento) <= 5000);

-- Mesma regra de 20261009_gestao_gestor_lembrete.sql, sem exigir o relatório.
create or replace function gestao.agenda_conclusao()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  if tg_op = 'INSERT' then
    new.concluido_em := null;
    return new;
  end if;

  if new.concluido_em is not null and old.concluido_em is null then
    if new.cancelado_em is not null then
      raise exception 'gestao: encontro cancelado não pode ser concluído' using errcode = '23514';
    end if;
    if new.data + coalesce(new.inicio, time '00:00') > (now() at time zone 'America/Sao_Paulo') then
      raise exception 'gestao: só dá para concluir depois da hora de início do encontro' using errcode = '23514';
    end if;
    new.concluido_em := now();
  elsif new.concluido_em is not null then
    new.concluido_em := old.concluido_em;
  end if;

  if new.concluido_em is not null and new.cancelado_em is not null then
    raise exception 'gestao: encontro concluído não pode ser cancelado; reabra antes' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Concluir ou reabrir à mão: só a coordenação. O relatório é opcional.
create or replace function gestao.concluir_encontro(p_agenda uuid, p_relatorio text default null, p_concluir boolean default true)
returns void
language plpgsql
security definer
set search_path = 'gestao'
as $$
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: só a coordenação conclui o encontro; a equipe escreve as notas de encerramento'
      using errcode = '42501';
  end if;

  if p_concluir then
    update gestao.agenda
      set concluido_em = now(), relatorio = nullif(btrim(coalesce(p_relatorio, '')), '')
      where id = p_agenda;
  else
    update gestao.agenda set concluido_em = null where id = p_agenda;
  end if;
  if not found then
    raise exception 'gestao: encontro não encontrado' using errcode = 'P0002';
  end if;
end;
$$;

-- A nota da própria pessoa. SECURITY DEFINER porque o bolsista não tem `update`
-- em agenda_bolsista; a autoria continua sendo dele na auditoria (auth.uid()).
-- Devolve true quando esta nota foi a última e concluiu o encontro.
create or replace function gestao.escrever_nota_encerramento(p_agenda uuid, p_nota text)
returns boolean
language plpgsql
security definer
set search_path = 'gestao'
as $$
declare
  v_nota text := btrim(coalesce(p_nota, ''));
  v_encontro gestao.agenda%rowtype;
begin
  if not gestao.e_membro() then
    raise exception 'gestao: apenas membros do projeto escrevem nota de encerramento' using errcode = '42501';
  end if;
  if char_length(v_nota) < 10 or char_length(v_nota) > 5000 then
    raise exception 'gestao: a nota de encerramento precisa ter de 10 a 5000 caracteres' using errcode = '23514';
  end if;

  -- Trava o encontro: duas últimas notas ao mesmo tempo não se perdem uma da outra.
  select * into v_encontro from gestao.agenda where id = p_agenda for update;
  if not found then
    raise exception 'gestao: encontro não encontrado' using errcode = 'P0002';
  end if;
  if v_encontro.cancelado_em is not null then
    raise exception 'gestao: encontro cancelado não recebe nota de encerramento' using errcode = '23514';
  end if;
  if v_encontro.data + coalesce(v_encontro.inicio, time '00:00') > (now() at time zone 'America/Sao_Paulo') then
    raise exception 'gestao: a nota de encerramento só abre depois da hora de início do encontro' using errcode = '23514';
  end if;

  update gestao.agenda_bolsista
    set nota_encerramento = v_nota
    where agenda_id = p_agenda and bolsista_id = auth.uid() and situacao in ('prevista', 'cumprida');
  if not found then
    raise exception 'gestao: só quem esteve no encontro escreve a nota de encerramento' using errcode = '42501';
  end if;

  if v_encontro.concluido_em is null and not exists (
    select 1 from gestao.agenda_bolsista
    where agenda_id = p_agenda and situacao in ('prevista', 'cumprida') and nota_encerramento is null
  ) then
    update gestao.agenda set concluido_em = now() where id = p_agenda;
    return true;
  end if;
  return false;
end;
$$;

revoke execute on function gestao.escrever_nota_encerramento(uuid, text) from public, anon;
grant execute on function gestao.escrever_nota_encerramento(uuid, text) to authenticated;

commit;
