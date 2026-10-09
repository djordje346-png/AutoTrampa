create index if not exists car_swipes_offered_car_id_idx
  on public.car_swipes (offered_car_id);

create index if not exists matches_car_a_id_idx
  on public.matches (car_a_id);
create index if not exists matches_car_b_id_idx
  on public.matches (car_b_id);
create index if not exists matches_conversation_id_idx
  on public.matches (conversation_id);

