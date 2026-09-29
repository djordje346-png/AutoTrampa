-- The live database already has a unique constraint on (user_id, car_id).
-- Avoid keeping a second identical index beside its backing index.
drop index if exists public.saved_cars_user_car_idx;
