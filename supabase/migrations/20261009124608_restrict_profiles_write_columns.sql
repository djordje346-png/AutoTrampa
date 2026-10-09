-- Lock down columns the app must not be able to write on `profiles`.
--
-- 20261001175804 replaced the column-level grants from the initial migration
-- with `grant insert, update on table public.profiles`. Table-level INSERT and
-- UPDATE are what PostgREST checks, so after that migration an authenticated
-- client could PATCH its own row with `rating`, `verified` or `trade_count`:
-- row level security only restricts *which row* is written, never which
-- columns. Reputation and badges are server-owned, so writing them must be
-- impossible, not merely unused by the app.
--
-- The app only ever sends id/name/city/phone (see hooks/use-user.ts), so
-- restoring the column list leaves every real flow working. Selects are
-- untouched: the owner still reads the whole row to show their own rating.

revoke insert, update on table public.profiles from authenticated;

grant insert (id, name, city, phone) on table public.profiles to authenticated;
grant update (name, city, phone) on table public.profiles to authenticated;

-- `on conflict (id) do update` and the auth trigger only touch these columns as
-- well, and keep working because the column privileges above cover them.
comment on column public.profiles.rating is
  'Server-owned: not writable by authenticated clients (see 20261002120000).';
comment on column public.profiles.trade_count is
  'Server-owned: not writable by authenticated clients (see 20261002120000).';
comment on column public.profiles.verified is
  'Server-owned: not writable by authenticated clients (see 20261002120000).';
