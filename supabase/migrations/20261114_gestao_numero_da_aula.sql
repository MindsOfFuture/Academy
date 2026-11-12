-- Número da aula, alunos presentes e aulas realizadas na página inicial
-- (pedido da coordenação em 12/11/2026).
--
--   - agenda.numero_aula: opcional, lançado com o encontro (a repetição semanal
--     soma 1 por semana) ou vindo da planilha importada;
--   - agenda.presentes: quantos alunos estavam no encontro, registrado por quem
--     esteve nele ou pela coordenação (quem registra depois sobrescreve), só por
--     `gestao.registrar_presentes`;
--   - página inicial: "aulas realizadas" = base em system_config
--     (`public_aulas_realizadas`: o anon lê as chaves `public_%`) mais os
--     encontros concluídos com escola real e turma que abriu.
--
-- Compatível com o código antigo: colunas anuláveis, importar_planilha com a
-- mesma assinatura, definir_numeros_do_site com p_aulas opcional (nulo = não
-- mexe na base de aulas) e numeros_da_home com uma coluna a mais.
--
-- Depende de 20261113_gestao_importar_planilha.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

alter table gestao.agenda add column if not exists numero_aula integer check (numero_aula > 0);
alter table gestao.agenda add column if not exists presentes integer check (presentes >= 0);

-- ---------------------------------------------------------------------------
-- Importar: mesmo corpo de 20261113, mais o número da aula
-- ---------------------------------------------------------------------------
-- p_escolas: [{nome, categoria, cidade}] — as que a planilha cita e não estão
--   cadastradas; se já houver uma com o mesmo nome, ela é usada.
-- p_encontros: [{data, inicio, fim, modalidade, aulas, escola_id, escola_nova, numero_aula}]
--   — escola_nova é o nome de uma das p_escolas; os dois nulos = sem escola;
--   numero_aula é opcional.
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

    insert into gestao.agenda (data, inicio, fim, modalidade, aulas, escola_id, importacao_id, numero_aula)
      values (v_data, v_inicio, v_fim, btrim(v_encontro ->> 'modalidade'), btrim(v_encontro ->> 'aulas'), v_escola_id, v_id,
        nullif(btrim(coalesce(v_encontro ->> 'numero_aula', '')), '')::integer);
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
-- Alunos presentes
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER porque o bolsista não tem update em agenda; quem pode é
-- conferido aqui (padrão de escrever_nota_encerramento).
create or replace function gestao.registrar_presentes(p_agenda uuid, p_presentes integer)
returns void
language plpgsql
security definer
set search_path = 'gestao'
as $$
declare
  v_encontro gestao.agenda%rowtype;
begin
  if not gestao.e_membro() then
    raise exception 'gestao: apenas membros do projeto registram os presentes' using errcode = '42501';
  end if;
  if p_presentes is null or p_presentes < 0 or p_presentes > 9999 then
    raise exception 'gestao: informe quantos alunos estavam presentes (de 0 a 9999)' using errcode = '23514';
  end if;

  select * into v_encontro from gestao.agenda where id = p_agenda for update;
  if not found then
    raise exception 'gestao: encontro não encontrado' using errcode = 'P0002';
  end if;
  if v_encontro.cancelado_em is not null then
    raise exception 'gestao: encontro cancelado não recebe número de presentes' using errcode = '23514';
  end if;
  if v_encontro.data + coalesce(v_encontro.inicio, time '00:00') > (now() at time zone 'America/Sao_Paulo') then
    raise exception 'gestao: os presentes só são registrados depois da hora de início do encontro' using errcode = '23514';
  end if;
  if v_encontro.escola_id is null and v_encontro.turma_id is null then
    raise exception 'gestao: só encontro com escola ou turma tem alunos presentes' using errcode = '23514';
  end if;
  if not gestao.usuario_com_papel('coordenacao') and not exists (
    select 1 from gestao.agenda_bolsista
    where agenda_id = p_agenda and bolsista_id = auth.uid() and situacao in ('prevista', 'cumprida')
  ) then
    raise exception 'gestao: só quem esteve no encontro ou a coordenação registra os presentes' using errcode = '42501';
  end if;

  update gestao.agenda set presentes = p_presentes where id = p_agenda;
end;
$$;

revoke execute on function gestao.registrar_presentes(uuid, integer) from public, anon;
grant execute on function gestao.registrar_presentes(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Números do site: mais a base de aulas
-- ---------------------------------------------------------------------------
-- A assinatura muda: sem o drop ficariam duas funções e a chamada com dois
-- argumentos seria ambígua.
drop function if exists gestao.definir_numeros_do_site(integer, integer);

create or replace function gestao.definir_numeros_do_site(p_escolas integer, p_alunos integer, p_aulas integer default null)
returns void
language plpgsql
volatile
security definer
set search_path = 'gestao', 'public'
as $$
declare
  v_chave text;
  v_valor integer;
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: só a coordenação muda os números do site'
      using errcode = '42501';
  end if;
  if p_escolas is null or p_alunos is null
     or p_escolas < 0 or p_alunos < 0
     or p_escolas > 1000000 or p_alunos > 1000000
     or p_aulas < 0 or p_aulas > 1000000 then
    raise exception 'gestao: use números inteiros entre 0 e 1.000.000'
      using errcode = '22023';
  end if;

  foreach v_chave in array array['escolas_atendidas', 'alunos_atendidos', 'public_aulas_realizadas'] loop
    v_valor := case v_chave
      when 'escolas_atendidas' then p_escolas
      when 'alunos_atendidos' then p_alunos
      else p_aulas
    end;
    -- Sem p_aulas (chamada antiga), a base de aulas fica como está.
    continue when v_valor is null;
    update public.system_config
       set value = v_valor::text, updated_at = now()
     where key = v_chave;
    if not found then
      insert into public.system_config (key, value, updated_at)
      values (v_chave, v_valor::text, now());
    end if;
  end loop;
end;
$$;

revoke execute on function gestao.definir_numeros_do_site(integer, integer, integer) from public, anon;
grant execute on function gestao.definir_numeros_do_site(integer, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Números da página inicial: mais as aulas realizadas
-- ---------------------------------------------------------------------------
-- O tipo de retorno muda, e `create or replace` não troca as colunas.
drop function if exists public.numeros_da_home();

create function public.numeros_da_home()
returns table (escolas integer, alunos integer, aulas integer)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select
      coalesce(max(c.value::integer) filter (where c.key = 'escolas_atendidas'), 0) as escolas,
      coalesce(max(c.value::integer) filter (where c.key = 'alunos_atendidos'), 0) as alunos,
      coalesce(max(c.value::integer) filter (where c.key = 'public_aulas_realizadas'), 0) as aulas
    from public.system_config c
    where c.key in ('escolas_atendidas', 'alunos_atendidos', 'public_aulas_realizadas') and c.value ~ '^\s*\d+\s*$'
  )
  select
    base.escolas + (select count(*)::integer from gestao.escola e where not e.teste),
    base.alunos + coalesce((
      select sum(t.n_alunos)::integer
      from gestao.turma t
      join gestao.escola e on e.id = t.escola_id
      where not e.teste and t.status <> 'nao_abriu'
    ), 0),
    base.aulas + (
      select count(*)::integer
      from gestao.agenda a
      join gestao.escola e on e.id = a.escola_id
      left join gestao.turma t on t.id = a.turma_id
      where a.concluido_em is not null and a.cancelado_em is null and not e.teste
        and (t.id is null or t.status <> 'nao_abriu')
    )
  from base
$$;

revoke execute on function public.numeros_da_home() from public;
grant execute on function public.numeros_da_home() to anon, authenticated;

commit;
