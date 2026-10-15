-- Serbian listings commonly use TNG/LPG and CNG; keep those values explicit
-- instead of asking sellers to mislabel them as petrol.
alter table public.cars
  drop constraint if exists cars_specs_required_check;

alter table public.cars
  add constraint cars_specs_required_check
  check (
    specs ? 'fuelType'
    and specs->>'fuelType' is not null
    and specs->>'fuelType' in ('Diesel', 'Petrol', 'Hybrid', 'Electric', 'LPG', 'CNG')
    and specs ? 'transmission'
    and specs->>'transmission' is not null
    and specs->>'transmission' in ('Manual', 'Automatic', 'Semi-Auto')
  );
