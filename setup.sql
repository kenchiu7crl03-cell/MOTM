-- 1. Ensure Device ID constraint exists (Run this just in case)
alter table "public"."votes" drop constraint if exists "votes_device_id_category_id_key";
alter table "public"."votes" add constraint "votes_device_id_category_id_key" unique ("device_id", "category_id");

-- 2. Create a secure view/function to count votes per candidate per category
-- This allows the frontend to fetch "Results" without needing access to individual vote rows
create or replace view "public"."vote_stats" as
select 
  category_id,
  candidate_id,
  count(*) as vote_count
from "public"."votes"
group by category_id, candidate_id;

-- 3. Update Policies
alter table "public"."votes" enable row level security;

-- Public can VIEW limits
-- Everyone can view candidates/categories/config
create policy "Public view basics" on "public"."votes" for select using (false); -- Hide raw votes from public
create policy "Public insert own vote" on "public"."votes" for insert with check (true);
create policy "Public update own vote" on "public"."votes" for update using (true); -- Allow upsert based on device_id

-- Admin policies
create policy "Admin full access" on "public"."votes" for all using (auth.role() = 'authenticated');
create policy "Admin view stats" on "public"."vote_stats" for select using (true); -- Only admin or public depending on logic (we handle logic in app)

-- Clean up helper to let public read stats (Only when needed, controlled by App Logic)
grant select on "public"."vote_stats" to anon, authenticated;
