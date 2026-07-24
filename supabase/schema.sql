-- Run once in the Supabase SQL editor. Day boundaries are calculated by the app
-- in Asia/Karachi; timestamps remain UTC.
create extension if not exists pgcrypto;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  planned_minutes integer check (planned_minutes between 1 and 120),
  duration_minutes integer not null default 0 check (duration_minutes between 0 and 120),
  category text not null check (category in ('build','read','watch')),
  title text not null check (char_length(title) between 2 and 100),
  detail text not null default '',
  reflection text not null default '',
  evidence_urls text[] not null default '{}',
  status text not null default 'active' check (status in ('active','completed','interrupted')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  check (started_at >= timestamptz '2026-07-24 00:00:00+00')
);

create index if not exists sessions_public_started_idx on public.sessions (is_public, started_at desc);
alter table public.sessions enable row level security;
drop policy if exists "public can read approved sessions" on public.sessions;
create policy "public can read approved sessions" on public.sessions for select using (is_public = true and status <> 'active');
drop policy if exists "owner controls sessions" on public.sessions;
create policy "owner controls sessions" on public.sessions for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(), title text not null,
  metric text not null check (metric in ('minutes','count','checklist','streak')),
  target integer not null check (target > 0), current integer not null default 0 check (current >= 0),
  period text not null check (period in ('week','month','year','custom')),
  category text check (category in ('build','read','watch')), deadline timestamptz,
  is_public boolean not null default true, created_at timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "public can read active goals" on public.goals for select using (is_public = true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "owner uploads evidence" on storage.objects for insert to authenticated
with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);
