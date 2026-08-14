-- Run this file once in Supabase Dashboard → SQL Editor.
-- Static lesson catalogs stay in the app; this table stores each user's progress document.

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "Users can read their own progress" on public.user_progress;
create policy "Users can read their own progress"
on public.user_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own progress" on public.user_progress;
create policy "Users can insert their own progress"
on public.user_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress"
on public.user_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- A privacy-safe public score row for the authenticated leaderboard.
-- Email addresses are never stored here.
create table if not exists public.user_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner' check (char_length(display_name) between 1 and 60),
  overall_score integer not null default 0 check (overall_score between 0 and 1000),
  active_level text not null default 'N4' check (active_level in ('N4', 'N3')),
  breakdown jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists user_scores_overall_idx on public.user_scores (overall_score desc, updated_at asc);
alter table public.user_scores enable row level security;

drop policy if exists "Authenticated users can read scores" on public.user_scores;
create policy "Authenticated users can read scores"
on public.user_scores for select to authenticated
using (true);

drop policy if exists "Users can insert their own score" on public.user_scores;
create policy "Users can insert their own score"
on public.user_scores for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own score" on public.user_scores;
create policy "Users can update their own score"
on public.user_scores for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
