-- Lembrete por e-mail de meta atrasada (pedido da coordenação em 12/11/2026).
--
-- Mesmo caminho do lembrete de encontro (20261009_gestao_gestor_lembrete.sql):
-- o banco escolhe quem recebe e monta o e-mail; o script do VPS
-- (scripts/academy-lembrete-encontros.sh) envia pelo Resend e marca. Entra com
-- o papel `gestao_lembrete`, que só executa as funções de lembrete (ADR 021).
--
-- Um e-mail por responsável ativo, uma vez por prazo: mudar o prazo e atrasar
-- de novo gera outro. Meta concluída ou de teste não lembra.
--
-- Depende de 20261009_gestao_lembrete_no_modelo.sql e
-- 20261115_gestao_atrasos_e_metas.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy do script.

begin;

create table if not exists gestao.lembrete_meta_enviado (
  meta_id uuid not null references gestao.meta (id) on delete cascade,
  user_profile_id uuid not null references public.user_profile (id) on delete cascade,
  prazo date not null,
  enviado_em timestamptz not null default now(),
  primary key (meta_id, user_profile_id, prazo)
);

alter table gestao.lembrete_meta_enviado enable row level security;
alter table gestao.lembrete_meta_enviado force row level security;
revoke all on table gestao.lembrete_meta_enviado from public, anon, authenticated;

create or replace function gestao.lembretes_meta_pendentes(p_de text, p_url_base text, p_redirecionar_para text default null)
returns table (meta_id uuid, user_profile_id uuid, prazo date, email jsonb)
language sql
stable
security definer
set search_path = 'gestao', 'public'
as $$
  select
    m.id,
    r.user_profile_id,
    m.prazo,
    jsonb_build_object(
      'from', p_de,
      'to', jsonb_build_array(coalesce(nullif(btrim(p_redirecionar_para), ''), up.email)),
      'subject', 'Meta atrasada: ' || m.titulo,
      'html', gestao.email_html(
        'Meta atrasada',
        'Olá, ' || gestao.html_escapar(coalesce(nullif(btrim(up.full_name), ''), 'bolsista')) || '. '
          || 'O prazo desta meta, de que você é responsável, já passou:<br><strong>'
          || gestao.html_escapar(m.titulo || ' · prazo ' || to_char(m.prazo, 'DD/MM/YYYY'))
          || '</strong><br>Registre o andamento ou fale com a coordenação.',
        rtrim(p_url_base, '/') || '/gestao/metas/' || m.id
      )
    )
  from gestao.meta m
  join gestao.meta_responsavel r on r.meta_id = m.id
  join gestao.papel_membro pm on pm.user_profile_id = r.user_profile_id and pm.desligado_em is null
  join public.user_profile up on up.id = r.user_profile_id
  where m.concluida_em is null
    and not m.teste
    and m.prazo < (now() at time zone 'America/Sao_Paulo')::date
    and up.email is not null
    and not exists (
      select 1 from gestao.lembrete_meta_enviado l
      where l.meta_id = m.id and l.user_profile_id = r.user_profile_id and l.prazo = m.prazo
    )
$$;

create or replace function gestao.marcar_lembrete_meta_enviado(p_meta uuid, p_pessoa uuid, p_prazo date)
returns void
language sql
security definer
set search_path = 'gestao'
as $$
  insert into gestao.lembrete_meta_enviado (meta_id, user_profile_id, prazo)
  values (p_meta, p_pessoa, p_prazo)
  on conflict do nothing
$$;

revoke execute on function gestao.lembretes_meta_pendentes(text, text, text) from public, anon, authenticated;
revoke execute on function gestao.marcar_lembrete_meta_enviado(uuid, uuid, date) from public, anon, authenticated;
grant execute on function gestao.lembretes_meta_pendentes(text, text, text) to gestao_lembrete;
grant execute on function gestao.marcar_lembrete_meta_enviado(uuid, uuid, date) to gestao_lembrete;

commit;
