-- Keep account-level trade preferences on the existing private profile row.
-- The profiles RLS policies already restrict reads and writes to auth.uid() = id.
alter table public.profiles
  add column if not exists budget numeric(12, 2)
    check (budget is null or budget between 0 and 100000),
  add column if not exists search_radius_km integer not null default 50
    check (search_radius_km between 10 and 200 and mod(search_radius_km, 10) = 0),
  add column if not exists no_top_up boolean not null default false;

-- Keep the existing column-level write boundary while permitting users to
-- update only their contact/profile fields and their own trade preferences.
revoke insert, update on table public.profiles from authenticated;
grant insert (id, name, city, phone) on table public.profiles to authenticated;
grant update (name, city, phone, budget, search_radius_km, no_top_up)
  on table public.profiles to authenticated;

comment on column public.profiles.budget is
  'User budget for a trade top-up in EUR; used for ranking, never as a listing filter.';
comment on column public.profiles.search_radius_km is
  'User search-radius preference in km. Persisted for future distance filtering.';
comment on column public.profiles.no_top_up is
  'Whether the user prefers not to add cash; preserves the existing ranking behavior.';
