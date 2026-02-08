-- Enable RLS
alter table "public"."votes" enable row level security;
alter table "public"."candidates" enable row level security;
alter table "public"."categories" enable row level security;
alter table "public"."config" enable row level security;

-- Policies for public (anonymous) access
create policy "Public can view candidates"
on "public"."candidates"
for select
using (true);

create policy "Public can view categories"
on "public"."categories"
for select
using (true);

create policy "Public can view config"
on "public"."config"
for select
using (true);

create policy "Public can insert votes"
on "public"."votes"
for insert
with check (true);

create policy "Public can view their own vote (optional, for duplicate check)"
on "public"."votes"
for select
using (true);

-- Policies for authenticated (admin) access
create policy "Admins can do everything on candidates"
on "public"."candidates"
for all
using (auth.role() = 'authenticated');

create policy "Admins can do everything on categories"
on "public"."categories"
for all
using (auth.role() = 'authenticated');

create policy "Admins can do everything on config"
on "public"."config"
for all
using (auth.role() = 'authenticated');

create policy "Admins can do everything on votes"
on "public"."votes"
for all
using (auth.role() = 'authenticated');
