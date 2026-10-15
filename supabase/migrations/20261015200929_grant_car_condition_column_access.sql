-- `condition` was added after the table's column-level grants were set up.
-- Keep its access consistent with the public car fields while RLS continues
-- to restrict writes to the authenticated car owner.
grant select (condition) on table public.cars to anon, authenticated;
grant insert (condition) on table public.cars to authenticated;
grant update (condition) on table public.cars to authenticated;
