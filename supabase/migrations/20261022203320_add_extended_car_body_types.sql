-- Extend the existing text enum constraint without rewriting any listing rows.
-- Existing body_type values remain valid and unchanged.
alter table public.cars
  drop constraint if exists cars_body_type_allowed_check;

alter table public.cars
  add constraint cars_body_type_allowed_check
  check (body_type in (
    'Sedan',
    'Caravan',
    'Hatchback',
    'SUV',
    'Coupe',
    'Convertible',
    'MPV',
    'Pickup',
    'Van'
  ));
