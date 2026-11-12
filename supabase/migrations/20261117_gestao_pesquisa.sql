-- Aba "Pesquisa" da gestão (pedido da coordenação em 12/11/2026).
--
--   - gestao.reuniao_pesquisa: reuniões de pesquisa (data, participantes, o que
--     foi feito, desdobramentos);
--   - gestao.producao_pesquisa: produções (tipo, título, autores em texto livre,
--     data, onde, link).
--
-- Nas duas: qualquer membro ativo lê e cria; quem criou ou a coordenação edita;
-- só a coordenação apaga. Autoria (`criado_por`) vem do banco.
--
-- Depende de 20261019_gestao_dados_de_teste.sql e 20261009_gestao_alocacao.sql.
-- Idempotente. Não aplicar automaticamente: produção é compartilhada. Aplicar
-- ANTES do deploy.

begin;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------
create table if not exists gestao.reuniao_pesquisa (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  participantes text not null check (char_length(btrim(participantes)) between 2 and 1000),
  feito text not null check (char_length(btrim(feito)) between 2 and 5000),
  desdobramentos text check (char_length(desdobramentos) <= 5000),
  criado_por uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  teste boolean not null default gestao.sou_teste()
);

create table if not exists gestao.producao_pesquisa (
  id uuid primary key default gen_random_uuid(),
  tipo text not null
    check (tipo in ('artigo_congresso', 'artigo_publicado', 'relatorio', 'substack', 'ebook', 'outro')),
  titulo text not null check (char_length(btrim(titulo)) between 2 and 300),
  autores text not null check (char_length(btrim(autores)) between 2 and 1000),
  data date not null,
  onde text check (char_length(onde) <= 300),
  link text check (link ~ '^https?://' and char_length(link) <= 500),
  criado_por uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  teste boolean not null default gestao.sou_teste()
);

create index if not exists reuniao_pesquisa_data on gestao.reuniao_pesquisa (data desc);
create index if not exists producao_pesquisa_data on gestao.producao_pesquisa (data desc);

-- ---------------------------------------------------------------------------
-- Triggers, RLS e grants (iguais nas duas tabelas)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['reuniao_pesquisa', 'producao_pesquisa']
  loop
    execute format('alter table gestao.%I enable row level security', t);
    execute format('alter table gestao.%I force row level security', t);

    execute format('drop trigger if exists definir_autoria on gestao.%I', t);
    execute format(
      'create trigger definir_autoria before insert or update on gestao.%I '
      'for each row execute function gestao.definir_autoria()', t);
    execute format('drop trigger if exists tocar_atualizado_em on gestao.%I', t);
    execute format(
      'create trigger tocar_atualizado_em before update on gestao.%I '
      'for each row execute function gestao.tocar_atualizado_em()', t);
    execute format('drop trigger if exists registrar_auditoria on gestao.%I', t);
    execute format(
      'create trigger registrar_auditoria after insert or update or delete on gestao.%I '
      'for each row execute function gestao.registrar_auditoria()', t);

    execute format('revoke all on table gestao.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table gestao.%I to authenticated', t);

    execute format('drop policy if exists "membro_le" on gestao.%I', t);
    execute format(
      'create policy "membro_le" on gestao.%I as permissive for select to authenticated '
      'using (gestao.e_membro())', t);

    execute format('drop policy if exists "membro_cria" on gestao.%I', t);
    execute format(
      'create policy "membro_cria" on gestao.%I as permissive for insert to authenticated '
      'with check (gestao.e_membro())', t);

    execute format('drop policy if exists "autor_ou_coordenacao_edita" on gestao.%I', t);
    execute format(
      'create policy "autor_ou_coordenacao_edita" on gestao.%I as permissive for update to authenticated '
      'using (gestao.usuario_com_papel(''coordenacao'') or (criado_por = auth.uid() and gestao.e_membro())) '
      'with check (gestao.usuario_com_papel(''coordenacao'') or (criado_por = auth.uid() and gestao.e_membro()))', t);

    execute format('drop policy if exists "coordenacao_apaga" on gestao.%I', t);
    execute format(
      'create policy "coordenacao_apaga" on gestao.%I as permissive for delete to authenticated '
      'using (gestao.usuario_com_papel(''coordenacao''))', t);

    -- Registro do E2E não aparece para a equipe real, e vice-versa (como meta).
    execute format('drop policy if exists "teste_separado" on gestao.%I', t);
    execute format(
      'create policy "teste_separado" on gestao.%I as restrictive for all to authenticated '
      'using (teste = gestao.sou_teste()) with check (teste = gestao.sou_teste())', t);
  end loop;
end;
$$;

commit;
