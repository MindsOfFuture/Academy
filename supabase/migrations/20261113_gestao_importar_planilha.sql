-- Importar a planilha de calendário da coordenação (pedido de 11/11/2026).
--
-- A coordenação planejava os encontros numa planilha. A importação lança de uma
-- vez os encontros dela (sem equipe) e cadastra as escolas que faltam. Cada
-- importação é um lote (`gestao.importacao`) e pode ser desfeita inteira:
--
--   - importar: só a coordenação; até 400 encontros; pula o que já existe com a
--     mesma data, escola, início e fim; o que já terminou (hora de Brasília)
--     entra concluído; nada novo → erro, e nenhum lote vazio fica gravado;
--   - desfazer: tudo ou nada. Recusa se algum encontro do lote já tiver equipe,
--     aula, relatório ou turma. Senão apaga os encontros do lote e as escolas
--     criadas por ele que ninguém mais usa, e marca o lote como desfeito.
--
-- Depende de 20261112_gestao_link_no_relatorio.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

-- ---------------------------------------------------------------------------
-- Lote de importação
-- ---------------------------------------------------------------------------
create table if not exists gestao.importacao (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null,
  arquivo text not null check (char_length(arquivo) between 1 and 200),
  resumo jsonb not null default '{}'::jsonb,
  desfeita_em timestamptz,
  teste boolean not null default gestao.sou_teste()
);

alter table gestao.importacao enable row level security;
alter table gestao.importacao force row level security;

drop trigger if exists definir_autoria on gestao.importacao;
create trigger definir_autoria before insert or update on gestao.importacao
  for each row execute function gestao.definir_autoria();
drop trigger if exists registrar_auditoria on gestao.importacao;
create trigger registrar_auditoria after insert or update or delete on gestao.importacao
  for each row execute function gestao.registrar_auditoria();

revoke all on table gestao.importacao from public, anon, authenticated;
grant select, insert, update on table gestao.importacao to authenticated;

drop policy if exists "coordenacao_tudo" on gestao.importacao;
create policy "coordenacao_tudo" on gestao.importacao
  as permissive for all to authenticated
  using (gestao.usuario_com_papel('coordenacao'))
  with check (gestao.usuario_com_papel('coordenacao'));

-- Lote do E2E não aparece para a coordenação real, e vice-versa (como escola).
drop policy if exists "teste_separado" on gestao.importacao;
create policy "teste_separado" on gestao.importacao
  as restrictive for all to authenticated
  using (teste = gestao.sou_teste())
  with check (teste = gestao.sou_teste());

alter table gestao.agenda add column if not exists importacao_id uuid references gestao.importacao (id);
alter table gestao.escola add column if not exists importacao_id uuid references gestao.importacao (id);
create index if not exists agenda_importacao on gestao.agenda (importacao_id) where importacao_id is not null;

-- ---------------------------------------------------------------------------
-- Importar
-- ---------------------------------------------------------------------------
-- p_escolas: [{nome, categoria, cidade}] — as que a planilha cita e não estão
--   cadastradas; se já houver uma com o mesmo nome, ela é usada.
-- p_encontros: [{data, inicio, fim, modalidade, aulas, escola_id, escola_nova}]
--   — escola_nova é o nome de uma das p_escolas; os dois nulos = sem escola.
-- Invoker: a RLS da coordenação decide o que se lê e se grava.
create or replace function gestao.importar_planilha(p_arquivo text, p_escolas jsonb, p_encontros jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_mapa jsonb := '{}'::jsonb;
  v_escola jsonb;
  v_encontro jsonb;
  v_nome text;
  v_escola_id uuid;
  v_data date;
  v_inicio time;
  v_fim time;
  v_criados integer := 0;
  v_pulados integer := 0;
  v_escolas integer := 0;
  v_concluidos integer;
  v_resumo jsonb;
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: só a coordenação importa planilhas' using errcode = '42501';
  end if;
  if jsonb_typeof(p_encontros) is distinct from 'array' then
    raise exception 'gestao: a importação precisa ter de 1 a 400 encontros' using errcode = '22023';
  end if;
  if jsonb_array_length(p_encontros) not between 1 and 400 then
    raise exception 'gestao: a importação precisa ter de 1 a 400 encontros' using errcode = '22023';
  end if;
  if p_escolas is not null and jsonb_typeof(p_escolas) <> 'array' then
    raise exception 'gestao: a lista de escolas veio com defeito' using errcode = '22023';
  end if;

  insert into gestao.importacao (arquivo)
    values (left(coalesce(nullif(btrim(p_arquivo), ''), 'planilha.xlsx'), 200))
    returning id into v_id;

  for v_escola in select value from jsonb_array_elements(coalesce(p_escolas, '[]'::jsonb)) loop
    v_nome := btrim(coalesce(v_escola ->> 'nome', ''));
    if char_length(v_nome) not between 2 and 120
       or char_length(btrim(coalesce(v_escola ->> 'categoria', ''))) not between 1 and 40
       or char_length(btrim(coalesce(v_escola ->> 'cidade', ''))) not between 2 and 120 then
      raise exception 'gestao: escola nova sem nome, categoria ou cidade' using errcode = '22023';
    end if;
    select e.id into v_escola_id
      from gestao.escola e
      where lower(btrim(e.nome)) = lower(v_nome)
      order by e.criado_em
      limit 1;
    if v_escola_id is null then
      insert into gestao.escola (nome, categoria, cidade, importacao_id)
        values (v_nome, btrim(v_escola ->> 'categoria'), btrim(v_escola ->> 'cidade'), v_id)
        returning id into v_escola_id;
      v_escolas := v_escolas + 1;
    end if;
    v_mapa := v_mapa || jsonb_build_object(lower(v_nome), v_escola_id);
  end loop;

  for v_encontro in select value from jsonb_array_elements(p_encontros) loop
    v_nome := nullif(btrim(coalesce(v_encontro ->> 'escola_nova', '')), '');
    if v_nome is not null then
      v_escola_id := (v_mapa ->> lower(v_nome))::uuid;
      if v_escola_id is null then
        raise exception 'gestao: a escola % não está na lista de escolas novas', v_nome using errcode = '22023';
      end if;
    else
      v_escola_id := (v_encontro ->> 'escola_id')::uuid;
    end if;
    if char_length(btrim(coalesce(v_encontro ->> 'modalidade', ''))) not between 2 and 80
       or char_length(btrim(coalesce(v_encontro ->> 'aulas', ''))) not between 1 and 200 then
      raise exception 'gestao: encontro sem atividade' using errcode = '22023';
    end if;
    v_data := (v_encontro ->> 'data')::date;
    v_inicio := (v_encontro ->> 'inicio')::time;
    v_fim := (v_encontro ->> 'fim')::time;

    if exists (
      select 1 from gestao.agenda a
      where a.data = v_data
        and a.escola_id is not distinct from v_escola_id
        and a.inicio = v_inicio
        and a.fim = v_fim
    ) then
      v_pulados := v_pulados + 1;
      continue;
    end if;

    insert into gestao.agenda (data, inicio, fim, modalidade, aulas, escola_id, importacao_id)
      values (v_data, v_inicio, v_fim, btrim(v_encontro ->> 'modalidade'), btrim(v_encontro ->> 'aulas'), v_escola_id, v_id);
    v_criados := v_criados + 1;
  end loop;

  if v_criados = 0 then
    raise exception 'gestao: nada novo para importar' using errcode = '23514';
  end if;

  -- O que já terminou entra concluído (o trigger só deixa concluir após o início).
  update gestao.agenda
    set concluido_em = now()
    where importacao_id = v_id
      and data + fim < (now() at time zone 'America/Sao_Paulo');
  get diagnostics v_concluidos = row_count;

  v_resumo := jsonb_build_object('encontros', v_criados, 'pulados', v_pulados, 'escolas', v_escolas, 'concluidos', v_concluidos);
  update gestao.importacao set resumo = v_resumo where id = v_id;
  return v_resumo || jsonb_build_object('id', v_id);
end;
$$;

revoke execute on function gestao.importar_planilha(text, jsonb, jsonb) from public, anon;
grant execute on function gestao.importar_planilha(text, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Desfazer
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER porque ninguém tem `delete` em agenda (encerrar, nunca
-- apagar — 20261009_gestao_alocacao.sql). Esta é a exceção, restrita ao que o
-- próprio lote criou e ainda está intocado. A checagem de papel e de lote de
-- teste é explícita, já que a RLS não vale aqui.
create or replace function gestao.desfazer_importacao(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lote gestao.importacao%rowtype;
  v_ocupados integer;
  v_apagados integer;
  v_escolas_do_lote integer;
  v_escolas_apagadas integer;
  v_resumo jsonb;
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: só a coordenação desfaz importações' using errcode = '42501';
  end if;

  select * into v_lote from gestao.importacao i
    where i.id = p_id and i.teste = gestao.sou_teste()
    for update;
  if not found then
    raise exception 'gestao: importação não encontrada' using errcode = 'P0002';
  end if;
  if v_lote.desfeita_em is not null then
    raise exception 'gestao: esta importação já foi desfeita' using errcode = '23514';
  end if;

  -- Trava os encontros do lote: ninguém aloca no meio da conferência.
  perform 1 from gestao.agenda a where a.importacao_id = p_id for update;

  select count(*) into v_ocupados
    from gestao.agenda a
    where a.importacao_id = p_id
      and (a.relatorio is not null
        or a.turma_id is not null
        or exists (select 1 from gestao.agenda_bolsista ab where ab.agenda_id = a.id)
        or exists (select 1 from gestao.aula au where au.agenda_id = a.id));
  if v_ocupados = 1 then
    raise exception 'gestao: 1 encontro desta importação já tem equipe, aula ou relatório' using errcode = '23514';
  elsif v_ocupados > 1 then
    raise exception 'gestao: % encontros desta importação já têm equipe, aula ou relatório', v_ocupados
      using errcode = '23514';
  end if;

  delete from gestao.agenda a where a.importacao_id = p_id;
  get diagnostics v_apagados = row_count;

  -- Toda tabela que aponta para escola (algumas em cascata, que apagariam dado
  -- alheio): escola criada pelo lote e usada em outro lugar fica. A trava
  -- impede que alguém grave nela entre a conferência e o delete.
  perform 1 from gestao.escola e where e.importacao_id = p_id for update;
  select count(*) into v_escolas_do_lote from gestao.escola e where e.importacao_id = p_id;
  delete from gestao.escola e
    where e.importacao_id = p_id
      and not exists (select 1 from gestao.agenda x where x.escola_id = e.id)
      and not exists (select 1 from gestao.turma x where x.escola_id = e.id)
      and not exists (select 1 from gestao.aluno x where x.escola_id = e.id)
      and not exists (select 1 from gestao.reserva x where x.escola_id = e.id)
      and not exists (select 1 from gestao.lista_enviada x where x.escola_id = e.id);
  get diagnostics v_escolas_apagadas = row_count;

  v_resumo := v_lote.resumo || jsonb_build_object(
    'apagados', v_apagados,
    'escolas_apagadas', v_escolas_apagadas,
    'escolas_mantidas', v_escolas_do_lote - v_escolas_apagadas
  );
  update gestao.importacao set desfeita_em = now(), resumo = v_resumo where id = p_id;
  return v_resumo;
end;
$$;

revoke execute on function gestao.desfazer_importacao(uuid) from public, anon;
grant execute on function gestao.desfazer_importacao(uuid) to authenticated;

commit;
