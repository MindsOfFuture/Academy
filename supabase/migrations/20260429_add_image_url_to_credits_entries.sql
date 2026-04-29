alter table if exists public.credits_entries
  add column if not exists image_url text;
