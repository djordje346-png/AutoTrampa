-- AutoTrampa initial Supabase schema. Public cars are listings; profile contact
-- details remain private and are never selected through the public Data API.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  city text not null default '',
  phone text not null default '',
  rating numeric not null default 5.0,
  trade_count integer not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  brand text not null,
  model text not null,
  generation text,
  year integer not null default 0,
  body_type text,
  color text,
  mileage integer,
  price numeric not null default 0,
  city text,
  country text,
  image text,
  images text[] not null default '{}',
  specs jsonb not null default '{}',
  features jsonb not null default '{}',
  equipment text[] not null default '{}',
  modifications text not null default '',
  description text not null default '',
  estimated_value numeric not null default 0,
  owner_name text not null default '',
  owner_city text not null default '',
  owner_rating numeric not null default 5.0,
  security_features text[] not null default '{}',
  build_notes text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Add fields when upgrading a project whose cars table was created earlier.
alter table public.cars add column if not exists owner_name text not null default '';
alter table public.cars add column if not exists owner_city text not null default '';
alter table public.cars add column if not exists owner_rating numeric not null default 5.0;
alter table public.cars add column if not exists security_features text[] not null default '{}';
alter table public.cars add column if not exists build_notes text[] not null default '{}';

create table if not exists public.saved_cars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  car_id uuid not null references public.cars (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, car_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);

alter table public.profiles enable row level security;
alter table public.cars enable row level security;
alter table public.saved_cars enable row level security;
alter table public.conversations enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, name, city, phone) on table public.profiles to authenticated;
grant update (name, city, phone) on table public.profiles to authenticated;
revoke all on table public.cars from public, anon, authenticated;
grant select on table public.cars to anon;
grant select, insert, update, delete on table public.cars to authenticated;
revoke all on table public.saved_cars from public, anon, authenticated;
grant select, insert, delete on table public.saved_cars to authenticated;
revoke all on table public.conversations from public, anon, authenticated;
grant select, insert on table public.conversations to authenticated;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can view own profile." on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile." on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users can insert own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Cars are viewable by everyone." on public.cars;
drop policy if exists "Cars are viewable by everyone" on public.cars;
drop policy if exists "anon_select_cars" on public.cars;
drop policy if exists "anon_insert_cars" on public.cars;
drop policy if exists "anon_update_cars" on public.cars;
drop policy if exists "anon_delete_cars" on public.cars;
drop policy if exists "Users can view own cars." on public.cars;
drop policy if exists "Users can view own cars" on public.cars;
drop policy if exists "Users can insert own cars." on public.cars;
drop policy if exists "Users can insert own cars" on public.cars;
drop policy if exists "Users can update own cars." on public.cars;
drop policy if exists "Users can update own cars" on public.cars;
drop policy if exists "Users can delete own cars." on public.cars;
drop policy if exists "Users can delete own cars" on public.cars;
create policy "Cars are publicly readable" on public.cars
  for select to anon, authenticated using (true);
create policy "Users can insert own cars" on public.cars
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own cars" on public.cars
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete own cars" on public.cars
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own saved cars." on public.saved_cars;
drop policy if exists "Users can view own saved cars" on public.saved_cars;
drop policy if exists "Users can insert own saved cars." on public.saved_cars;
drop policy if exists "Users can insert own saved cars" on public.saved_cars;
drop policy if exists "Users can delete own saved cars." on public.saved_cars;
drop policy if exists "Users can delete own saved cars" on public.saved_cars;
create policy "Users can view own saved cars" on public.saved_cars
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own saved cars" on public.saved_cars
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can delete own saved cars" on public.saved_cars
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own conversations." on public.conversations;
drop policy if exists "Users can view own conversations" on public.conversations;
drop policy if exists "Users can insert conversations." on public.conversations;
drop policy if exists "Users can insert conversations" on public.conversations;
create policy "Participants can view conversations" on public.conversations
  for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));
create policy "Buyers can create conversations for listings" on public.conversations
  for insert to authenticated
  with check (
    (select auth.uid()) = buyer_id
    and buyer_id <> seller_id
    and exists (
      select 1 from public.cars
      where cars.id = car_id and cars.user_id = seller_id
    )
  );

create index if not exists cars_user_id_created_at_idx
  on public.cars (user_id, created_at);
create index if not exists saved_cars_car_id_idx
  on public.saved_cars (car_id);
create index if not exists conversations_car_id_idx
  on public.conversations (car_id);
create index if not exists conversations_seller_id_idx
  on public.conversations (seller_id);
create index if not exists conversations_buyer_id_idx
  on public.conversations (buyer_id);

create schema if not exists autotrampa_private;
revoke all on schema autotrampa_private from public, anon, authenticated;

create or replace function autotrampa_private.enforce_garage_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  -- Avoid disclosing another account's garage status before the insert policy runs.
  if (select auth.uid()) is distinct from new.user_id then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 9231));
  select count(*) into current_count
  from public.cars
  where user_id = new.user_id;

  if current_count >= 3 then
    raise exception using errcode = '23514', message = 'GARAGE_LIMIT_REACHED';
  end if;
  return new;
end;
$$;
revoke all on function autotrampa_private.enforce_garage_limit() from public, anon, authenticated;
drop trigger if exists cars_enforce_garage_limit on public.cars;
create trigger cars_enforce_garage_limit
  before insert on public.cars
  for each row execute function autotrampa_private.enforce_garage_limit();

-- A public bucket allows anyone to read listing photos; each account may only
-- upload and remove objects inside its own uid folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('car-images', 'car-images', true, 6291456, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Car owners can upload images" on storage.objects;
drop policy if exists "Car owners can delete images" on storage.objects;
create policy "Car owners can upload images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'car-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Car owners can delete images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'car-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Keep the Auth trigger helper outside exposed schemas and lock its search path.
grant usage on schema autotrampa_private to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
create or replace function autotrampa_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1), 'Korisnik')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function autotrampa_private.handle_new_user() from public, anon, authenticated;
grant execute on function autotrampa_private.handle_new_user() to supabase_auth_admin;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function autotrampa_private.handle_new_user();
