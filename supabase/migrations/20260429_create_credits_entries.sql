create extension if not exists "pgcrypto";

create table if not exists public.credits_entries (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in (
    'bolsistas',
    'bolsistas_projetistas',
    'coordenacao',
    'instituicoes',
    'agradecimentos_especiais'
  )),
  name text not null,
  area text,
  description text,
  link text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists credits_entries_category_order_idx
  on public.credits_entries (category, sort_order);

insert into public.credits_entries (category, name, area, description, link, sort_order)
values
  ('bolsistas', 'Bolsista - Desenvolvimento', 'Desenvolvimento web e suporte técnico', null, null, 1),
  ('bolsistas', 'Bolsista - Conteúdo', 'Curadoria de conteúdo e apoio pedagógico', null, null, 2),
  ('bolsistas_projetistas', 'Bolsista projetista - UX', 'Pesquisa com usuários e design de interface', null, null, 1),
  ('bolsistas_projetistas', 'Bolsista projetista - Dados', 'Análise de métricas e relatórios', null, null, 2),
  ('coordenacao', 'Coordenação geral', null, 'Responsável pela orientação acadêmica, articulação institucional e acompanhamento das entregas.', null, 1),
  ('instituicoes', 'Universidade Federal de Juiz de Fora (UFJF)', null, null, 'https://www.ufjf.br/', 1),
  ('instituicoes', 'Governo de Minas Gerais', null, null, 'https://www.mg.gov.br/', 2),
  ('agradecimentos_especiais', 'Equipe docente parceira', null, 'Agradecemos pela participação ativa e pela co-criação de práticas pedagógicas.', null, 1),
  ('agradecimentos_especiais', 'Escolas participantes', null, 'Nosso reconhecimento ao engajamento das escolas da rede pública.', null, 2);
