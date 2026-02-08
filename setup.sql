-- 1. Ensure Device ID constraint exists
alter table "public"."votes" drop constraint if exists "votes_device_id_category_id_key";
alter table "public"."votes" add constraint "votes_device_id_category_id_key" unique ("device_id", "category_id");

-- 2. Create a secure view/function to count votes per candidate per category
drop view if exists "public"."vote_stats";
create or replace view "public"."vote_stats" as
select 
  category_id,
  candidate_id,
  count(*) as vote_count
from "public"."votes"
group by category_id, candidate_id;

-- 3. Reset Policies (Drop old ones first to avoid conflict)
alter table "public"."votes" enable row level security;

drop policy if exists "Public view basics" on "public"."votes";
drop policy if exists "Public insert own vote" on "public"."votes";
drop policy if exists "Public update own vote" on "public"."votes";
drop policy if exists "Public can insert votes" on "public"."votes";
drop policy if exists "Public can update votes" on "public"."votes";
drop policy if exists "Public can view votes" on "public"."votes";
drop policy if exists "Admin full access" on "public"."votes";
drop policy if exists "Admins can do everything on votes" on "public"."votes";

-- Re-create Policies
-- Public
create policy "Public view basics" on "public"."votes" for select using (false); -- Hide raw votes base
create policy "Public insert own vote" on "public"."votes" for insert with check (true);
create policy "Public update own vote" on "public"."votes" for update using (true);

-- Admin
create policy "Admin full access" on "public"."votes" for all using (auth.role() = 'authenticated');

-- Grant access to view
grant select on "public"."vote_stats" to anon, authenticated;
