-- 1. Tables Structure
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null
);

create table if not exists public.candidates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  number integer not null,
  avatar_url text,
  category_id uuid references public.categories(id) on delete cascade
);

-- Ensure category_id exists (fix for your error)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='candidates' and column_name='category_id') then
    alter table public.candidates add column category_id uuid references public.categories(id) on delete cascade;
  end if;
end $$;

create table if not exists public.votes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  voter_name text,
  device_id text,
  candidate_id uuid references public.candidates(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade
);

-- Ensure columns exist for votes
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='votes' and column_name='device_id') then
    alter table public.votes add column device_id text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='votes' and column_name='category_id') then
    alter table public.votes add column category_id uuid references public.categories(id) on delete cascade;
  end if;
end $$;

-- Fix unique constraint for votes
alter table "public"."votes" drop constraint if exists "votes_device_id_category_id_key";
alter table "public"."votes" add constraint "votes_device_id_category_id_key" unique ("device_id", "category_id");

create table if not exists public.config (
  key text primary key,
  value boolean default true
);

insert into public.config (key, value) values ('voting_active', true) on conflict (key) do nothing;

-- 2. Views
drop view if exists "public"."vote_stats";
create or replace view "public"."vote_stats" as
select 
  category_id,
  candidate_id,
  count(*) as vote_count
from "public"."votes"
group by category_id, candidate_id;

-- 3. RLS Policies
-- Enable RLS
alter table "public"."candidates" enable row level security;
alter table "public"."categories" enable row level security;
alter table "public"."votes" enable row level security;
alter table "public"."config" enable row level security;

-- Clean old policies
drop policy if exists "Public read candidates" on candidates;
drop policy if exists "Admin all candidates" on candidates;
drop policy if exists "Public read categories" on categories;
drop policy if exists "Admin all categories" on categories;
drop policy if exists "Public read config" on config;
drop policy if exists "Admin all config" on config;
drop policy if exists "Public read votes" on votes;
drop policy if exists "Public insert votes" on votes;
drop policy if exists "Public update votes" on votes;
drop policy if exists "Admin all votes" on votes;

-- Create new policies
create policy "Public read candidates" on candidates for select using (true);
create policy "Admin all candidates" on candidates for all using (auth.role() = 'authenticated');

create policy "Public read categories" on categories for select using (true);
create policy "Admin all categories" on categories for all using (auth.role() = 'authenticated');

create policy "Public read config" on config for select using (true);
create policy "Admin all config" on config for all using (auth.role() = 'authenticated');

create policy "Public read votes" on votes for select using (false); -- No direct read
create policy "Public insert votes" on votes for insert with check (true);
create policy "Public update votes" on votes for update using (true);
create policy "Admin all votes" on votes for all using (auth.role() = 'authenticated');

-- Grant view access
grant select on "public"."vote_stats" to anon, authenticated;
