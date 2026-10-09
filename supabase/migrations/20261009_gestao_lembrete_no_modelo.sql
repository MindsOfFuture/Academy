-- Lembrete no modelo dos e-mails da plataforma (spec 016, relato da coordenação
-- em 09/10/2026: o lembrete chegou "fora do template").
--
-- `gestao.email_html()` é cópia de `buildEmailHtml` em `lib/email/template.ts`;
-- o teste de migration compara as duas e falha se divergirem. O lembrete passa
-- a mandar `html` (com o botão "Acessar") em vez de texto puro. Nome, turma e
-- escola são escapados: vêm de cadastro.
--
-- Depende de 20261009_gestao_gestor_lembrete.sql. Idempotente.

begin;

create or replace function gestao.html_escapar(p text)
returns text
language sql
immutable
set search_path = 'gestao'
as $$
  select replace(replace(replace(replace(replace(coalesce(p, ''),
    '&', '&#38;'), '<', '&#60;'), '>', '&#62;'), '"', '&#34;'), '''', '&#39;')
$$;

create or replace function gestao.email_html(p_titulo text, p_mensagem text, p_href text default null)
returns text
language sql
immutable
set search_path = 'gestao'
as $$
  select E'\n    <div style="font-family:''Segoe UI'',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9f7fc;border-radius:12px;">'
    || E'\n        <div style="text-align:center;margin-bottom:16px;">'
    || E'\n            <h2 style="color:#684A97;margin:0;">Minds of the Future</h2>'
    || E'\n        </div>'
    || E'\n        <div style="background:#fff;border-radius:8px;padding:20px;border:1px solid #e5e0ed;">'
    || E'\n            <h3 style="margin:0 0 8px;color:#333;">' || p_titulo || '</h3>'
    || E'\n            <p style="margin:0 0 16px;color:#555;line-height:1.5;">' || p_mensagem || '</p>'
    || E'\n            ' || coalesce('<a href="' || p_href || '" style="display:inline-block;background:#684A97;color:#fff;padding:10px 20px;border-radius:24px;text-decoration:none;font-weight:600;">Acessar</a>', '')
    || E'\n        </div>'
    || E'\n        <p style="text-align:center;margin-top:16px;font-size:12px;color:#999;">'
    || E'\n            Você recebeu este e-mail porque tem uma conta na plataforma Minds of the Future.'
    || E'\n        </p>'
    || E'\n    </div>'
$$;

create or replace function gestao.lembretes_pendentes(p_de text, p_url_base text, p_redirecionar_para text default null)
returns table (alocacao_id uuid, email jsonb)
language sql
stable
security definer
set search_path = 'gestao', 'public'
as $$
  select
    ab.id,
    jsonb_build_object(
      'from', p_de,
      'to', jsonb_build_array(coalesce(nullif(btrim(p_redirecionar_para), ''), up.email)),
      'subject', 'Lembrete: ' || a.modalidade || ' em ' || to_char(a.data, 'DD/MM') || ', ' || a.horario,
      'html', gestao.email_html(
        'Lembrete de encontro',
        'Olá, ' || gestao.html_escapar(coalesce(nullif(btrim(up.full_name), ''), 'bolsista')) || '. '
          || 'Você está na equipe deste encontro:<br><strong>'
          || gestao.html_escapar(
               to_char(a.data, 'DD/MM') || ' · ' || a.horario || ' · ' || a.modalidade
               || coalesce(' · ' || t.nome, '') || ' · ' || coalesce(e.nome, 'fora de escola'))
          || '</strong><br>Se não puder ir, avise a coordenação o quanto antes.',
        rtrim(p_url_base, '/') || '/gestao/encontro/' || a.id
      )
    )
  from gestao.agenda_bolsista ab
  join gestao.agenda a on a.id = ab.agenda_id
  join gestao.papel_membro m on m.user_profile_id = ab.bolsista_id and m.desligado_em is null
  join public.user_profile up on up.id = ab.bolsista_id
  left join gestao.turma t on t.id = a.turma_id
  left join gestao.escola e on e.id = a.escola_id
  where ab.situacao = 'prevista'
    and a.cancelado_em is null
    and a.inicio is not null
    and coalesce(t.status, '') <> 'nao_abriu'
    and up.email is not null
    and a.data + a.inicio > (now() at time zone 'America/Sao_Paulo')
    and a.data + a.inicio <= (now() at time zone 'America/Sao_Paulo') + interval '24 hours'
    and not exists (select 1 from gestao.lembrete_enviado l where l.alocacao_id = ab.id)
$$;

revoke execute on function gestao.lembretes_pendentes(text, text, text) from public, anon, authenticated;
grant execute on function gestao.lembretes_pendentes(text, text, text) to gestao_lembrete;

commit;
