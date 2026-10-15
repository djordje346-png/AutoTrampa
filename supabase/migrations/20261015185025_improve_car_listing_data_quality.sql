-- Keep new listings honest and complete while preserving existing rows.
-- Before creating this migration, the current cars table was checked for each
-- condition below; existing production rows satisfy them all.

alter table public.cars
  add column if not exists condition text;

-- A year must be explicitly supplied; never let a database default invent one.
alter table public.cars
  alter column year drop default,
  alter column price set not null,
  alter column city set not null,
  alter column body_type set not null,
  alter column image set not null,
  alter column images set not null,
  alter column specs set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cars_condition_allowed_check' and conrelid = 'public.cars'::regclass) then
    alter table public.cars add constraint cars_condition_allowed_check
      check (condition is null or condition in ('good', 'minor_work', 'major_work', 'not_running'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cars_body_type_allowed_check' and conrelid = 'public.cars'::regclass) then
    alter table public.cars add constraint cars_body_type_allowed_check
      check (body_type in ('Sedan', 'Caravan', 'Hatchback', 'SUV', 'Coupe', 'Convertible'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cars_price_valid_check' and conrelid = 'public.cars'::regclass) then
    alter table public.cars add constraint cars_price_valid_check
      check (price > 0 and price <= 1000000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cars_mileage_valid_check' and conrelid = 'public.cars'::regclass) then
    alter table public.cars add constraint cars_mileage_valid_check
      check (mileage is null or mileage between 0 and 2000000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cars_city_required_check' and conrelid = 'public.cars'::regclass) then
    alter table public.cars add constraint cars_city_required_check
      check (btrim(city) <> '');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cars_photo_required_check' and conrelid = 'public.cars'::regclass) then
    alter table public.cars add constraint cars_photo_required_check
      check (btrim(image) <> '' and cardinality(images) > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cars_specs_required_check' and conrelid = 'public.cars'::regclass) then
    alter table public.cars add constraint cars_specs_required_check
      check (
        specs ? 'fuelType'
        and specs->>'fuelType' is not null
        and specs->>'fuelType' in ('Diesel', 'Petrol', 'Hybrid', 'Electric')
        and specs ? 'transmission'
        and specs->>'transmission' is not null
        and specs->>'transmission' in ('Manual', 'Automatic', 'Semi-Auto')
      );
  end if;
end
$$;
