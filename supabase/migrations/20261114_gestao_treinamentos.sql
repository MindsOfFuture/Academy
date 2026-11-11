-- Vídeos de treinamento da equipe (spec 025).
-- Não aplicar automaticamente: esta migration é executada pelo lane de Ops.
-- Tabelas sem acesso direto: tudo passa pelas funções abaixo, que conferem o papel
-- de quem chama com public.gestao_membro_papel().

create table public.treinamento_video (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique check (numero between 1 and 999),
  titulo text not null check (char_length(trim(titulo)) between 3 and 200),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.treinamento_visualizacao (
  video_id uuid not null references public.treinamento_video(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  aberto_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz not null default now(),
  acessos integer not null default 1 check (acessos > 0),
  concluido_em timestamptz,
  primary key (video_id, user_id)
);

alter table public.treinamento_video enable row level security;
alter table public.treinamento_visualizacao enable row level security;
revoke all on table public.treinamento_video from public, anon, authenticated;
revoke all on table public.treinamento_visualizacao from public, anon, authenticated;

-- Lista para qualquer membro do projeto, com o que o próprio chamador já viu.
create or replace function public.treinamento_videos()
returns table (id uuid, numero integer, titulo text, youtube_id text, aberto boolean, concluido boolean)
language sql stable security definer set search_path = '' as $$
  select v.id, v.numero, v.titulo, v.youtube_id, w.user_id is not null, w.concluido_em is not null
  from public.treinamento_video v
  left join public.treinamento_visualizacao w on w.video_id = v.id and w.user_id = auth.uid()
  where public.gestao_membro_papel() is not null
  order by v.numero;
$$;

-- Registro de quem abriu (p_concluiu = false) e de quem assistiu até o fim (true).
create or replace function public.treinamento_registrar(p_video uuid, p_concluiu boolean)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if public.gestao_membro_papel() is null then
    raise exception 'Acesso negado. Apenas membros do projeto assistem aos treinamentos.' using errcode = '42501';
  end if;
  insert into public.treinamento_visualizacao (video_id, user_id, concluido_em)
  values (p_video, auth.uid(), case when p_concluiu then now() end)
  on conflict (video_id, user_id) do update set
    ultimo_acesso_em = now(),
    acessos = public.treinamento_visualizacao.acessos + case when p_concluiu then 0 else 1 end,
    concluido_em = coalesce(public.treinamento_visualizacao.concluido_em, excluded.concluido_em);
end;
$$;

-- Coordenação publica ou troca o vídeo de um número.
create or replace function public.treinamento_salvar_video(p_numero integer, p_titulo text, p_youtube_id text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if public.gestao_membro_papel() is distinct from 'coordenacao' then
    raise exception 'Acesso negado. Apenas a coordenação publica treinamentos.' using errcode = '42501';
  end if;
  insert into public.treinamento_video (numero, titulo, youtube_id, criado_por)
  values (p_numero, trim(p_titulo), p_youtube_id, auth.uid())
  on conflict (numero) do update set
    titulo = excluded.titulo, youtube_id = excluded.youtube_id, atualizado_em = now();
end;
$$;

-- Quem assistiu: cada bolsista ativo (sem contas de teste) contra cada vídeo,
-- inclusive quem ainda não abriu.
create or replace function public.treinamento_resumo()
returns table (
  numero integer, titulo text, nome text, email text,
  aberto_em timestamptz, ultimo_acesso_em timestamptz, acessos integer, concluido_em timestamptz
) language sql stable security definer set search_path = '' as $$
  select v.numero, v.titulo, coalesce(nullif(trim(p.full_name), ''), p.email), p.email,
    w.aberto_em, w.ultimo_acesso_em, coalesce(w.acessos, 0), w.concluido_em
  from public.treinamento_video v
  cross join gestao.papel_membro m
  join public.user_profile p on p.id = m.user_profile_id
  left join public.treinamento_visualizacao w on w.video_id = v.id and w.user_id = m.user_profile_id
  where public.gestao_membro_papel() = 'coordenacao'
    and m.bolsista and not m.teste and m.desligado_em is null
  order by v.numero, w.aberto_em is null, 3;
$$;

revoke execute on function public.treinamento_videos() from public, anon;
revoke execute on function public.treinamento_registrar(uuid, boolean) from public, anon;
revoke execute on function public.treinamento_salvar_video(integer, text, text) from public, anon;
revoke execute on function public.treinamento_resumo() from public, anon;
grant execute on function public.treinamento_videos() to authenticated;
grant execute on function public.treinamento_registrar(uuid, boolean) to authenticated;
grant execute on function public.treinamento_salvar_video(integer, text, text) to authenticated;
grant execute on function public.treinamento_resumo() to authenticated;
