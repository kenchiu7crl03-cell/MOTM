-- 1. Add device_id column if it doesn't exist (you might need to run this manually if table exists)
-- alter table "public"."votes" add column if not exists "device_id" text;

-- 2. Add unique constraint to prevent multiple votes per device per category
-- alter table "public"."votes" add constraint "votes_device_id_category_id_key" unique ("device_id", "category_id");

-- Policies
alter table "public"."votes" enable row level security;
alter table "public"."candidates" enable row level security;
alter table "public"."categories" enable row level security;
alter table "public"."config" enable row level security;

-- Public access
create policy "Public can view candidates" on "public"."candidates" for select using (true);
create policy "Public can view categories" on "public"."categories" for select using (true);
create policy "Public can view config" on "public"."config" for select using (true);

-- Allow public to INSERT and UPDATE votes (Upsert requires Update permission)
create policy "Public can insert votes" on "public"."votes" for insert with check (true);
create policy "Public can update votes" on "public"."votes" for update using (true);
create policy "Public can view votes" on "public"."votes" for select using (true);

-- Admin access (full control)
create policy "Admins can do everything on candidates" on "public"."candidates" for all using (auth.role() = 'authenticated');
create policy "Admins can do everything on categories" on "public"."categories" for all using (auth.role() = 'authenticated');
create policy "Admins can do everything on config" on "public"."config" for all using (auth.role() = 'authenticated');
create policy "Admins can do everything on votes" on "public"."votes" for all using (auth.role() = 'authenticated');
