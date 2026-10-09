-- Move owner-only car details out of the publicly readable listings table.
create table if not exists public.car_private_details (
  car_id uuid primary key references public.cars (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  estimated_value numeric not null default 0,
  security_features text[] not null default '{}',
  build_notes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.car_private_details enable row level security;
revoke all on table public.car_private_details from public, anon, authenticated;
grant select, insert, update, delete on table public.car_private_details to authenticated;

drop policy if exists "Owners manage their private car details" on public.car_private_details;
create policy "Owners manage their private car details" on public.car_private_details
  for all to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cars
      where cars.id = car_id and cars.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cars
      where cars.id = car_id and cars.user_id = (select auth.uid())
    )
  );

-- Preserve existing private data before removing API access to the old columns.
insert into public.car_private_details (
  car_id, user_id, estimated_value, security_features, build_notes
)
select
  cars.id,
  cars.user_id,
  coalesce(
    nullif(cars.estimated_value, 0),
    case
      when coalesce(cars.features ->> 'estimatedValue', '') ~ '^[0-9]+([.][0-9]+)?$'
        then (cars.features ->> 'estimatedValue')::numeric
      else 0
    end
  ),
  case
    when cardinality(cars.security_features) > 0 then cars.security_features
    when jsonb_typeof(cars.features -> 'securityFeatures') = 'array'
      then array(select jsonb_array_elements_text(cars.features -> 'securityFeatures'))
    else '{}'
  end,
  case
    when cardinality(cars.build_notes) > 0 then cars.build_notes
    when jsonb_typeof(cars.features -> 'buildNotes') = 'array'
      then array(select jsonb_array_elements_text(cars.features -> 'buildNotes'))
    else '{}'
  end
from public.cars as cars
on conflict (car_id) do update set
  user_id = excluded.user_id,
  estimated_value = excluded.estimated_value,
  security_features = excluded.security_features,
  build_notes = excluded.build_notes;

-- Some early app versions stored these owner-only values in the public JSON
-- features object. Remove those copies after preserving them above.
update public.cars
set features = coalesce(features, '{}'::jsonb) - 'securityFeatures' - 'buildNotes' - 'estimatedValue'
where features ?| array['securityFeatures', 'buildNotes', 'estimatedValue'];

-- Public listing fields remain readable. Private columns and rating are not
-- selectable through the public Data API.
revoke select on table public.cars from anon, authenticated;
grant select (
  id, user_id, brand, model, generation, year, body_type, color, mileage, price,
  city, country, image, images, specs, features, equipment, modifications,
  description, owner_name, owner_city, owner_rating, created_at
) on table public.cars to anon, authenticated;

-- The frontend can only write listing fields. Reputation is database-owned.
revoke insert, update on table public.cars from authenticated;
grant insert (
  user_id, brand, model, generation, year, body_type, color, mileage, price,
  city, country, image, images, specs, features, equipment, modifications,
  description, owner_name, owner_city
) on table public.cars to authenticated;
grant update (
  user_id, brand, model, generation, year, body_type, color, mileage, price,
  city, country, image, images, specs, features, equipment, modifications,
  description, owner_name, owner_city
) on table public.cars to authenticated;

-- Refresh legacy denormalized ratings from the protected profile source.
update public.cars as cars
set owner_rating = profiles.rating
from public.profiles as profiles
where profiles.id = cars.user_id;

create or replace function autotrampa_private.set_car_owner_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and (select auth.uid()) is distinct from new.user_id then
    raise exception using errcode = '42501', message = 'CAR_OWNER_MISMATCH';
  end if;

  select profiles.rating into new.owner_rating
  from public.profiles as profiles
  where profiles.id = new.user_id;

  if new.owner_rating is null then
    new.owner_rating := 5.0;
  end if;
  return new;
end;
$$;
revoke all on function autotrampa_private.set_car_owner_rating() from public, anon, authenticated;
drop trigger if exists cars_set_owner_rating on public.cars;
create trigger cars_set_owner_rating
  before insert or update of user_id, owner_rating on public.cars
  for each row execute function autotrampa_private.set_car_owner_rating();
