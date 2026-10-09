-- Persist Tinder-style decisions separately from saved/bookmarked listings.
create table public.car_swipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_car_id uuid not null references public.cars (id) on delete cascade,
  offered_car_id uuid references public.cars (id) on delete cascade,
  liked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, target_car_id),
  check (offered_car_id is null or offered_car_id <> target_car_id)
);

create index car_swipes_target_likes_idx
  on public.car_swipes (target_car_id, offered_car_id)
  where liked;

alter table public.car_swipes enable row level security;
revoke all on table public.car_swipes from public, anon, authenticated;
grant select, delete on table public.car_swipes to authenticated;

create policy "Users can read their own swipes" on public.car_swipes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can reset their own passes" on public.car_swipes
  for delete to authenticated using ((select auth.uid()) = user_id and not liked);

-- A match is for a specific pair of listings, and its participants are stored
-- in stable UUID order so either side resolves to the same row.
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles (id) on delete cascade,
  user_b_id uuid not null references public.profiles (id) on delete cascade,
  car_a_id uuid not null references public.cars (id) on delete cascade,
  car_b_id uuid not null references public.cars (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a_id, user_b_id, car_a_id, car_b_id),
  check (user_a_id < user_b_id),
  check (car_a_id <> car_b_id)
);

create index matches_user_a_created_idx on public.matches (user_a_id, created_at desc);
create index matches_user_b_created_idx on public.matches (user_b_id, created_at desc);

alter table public.matches enable row level security;
revoke all on table public.matches from public, anon, authenticated;
grant select on table public.matches to authenticated;
create policy "Users can read their own matches" on public.matches
  for select to authenticated
  using ((select auth.uid()) in (user_a_id, user_b_id));

-- Match announcements are system events, visible to both conversation
-- participants and independent from either user's ordinary messages.
alter table public.messages
  alter column sender_id drop not null,
  add column kind text not null default 'text'
    check (kind in ('text', 'match'));

drop policy if exists "Recipients can mark messages read" on public.messages;
create policy "Recipients can mark messages read" on public.messages
  for update to authenticated
  using (
    (sender_id is null or sender_id <> (select auth.uid()))
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.buyer_id, c.seller_id)
    )
  )
  with check (
    (sender_id is null or sender_id <> (select auth.uid()))
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.buyer_id, c.seller_id)
    )
  );

create or replace function public.swipe_car(
  p_target_car_id uuid,
  p_offered_car_id uuid,
  p_liked boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_target_owner uuid;
  v_offered_owner uuid;
  v_reverse_offered uuid;
  v_user_a uuid;
  v_user_b uuid;
  v_car_a uuid;
  v_car_b uuid;
  v_car_a_title text;
  v_car_b_title text;
  v_car_a_price numeric;
  v_car_b_price numeric;
  v_conversation_id uuid;
  v_match_id uuid;
  v_difference numeric;
  v_trade_summary text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  select c.user_id into v_target_owner
  from public.cars as c
  where c.id = p_target_car_id;
  if v_target_owner is null then
    raise exception using errcode = 'P0002', message = 'TARGET_CAR_NOT_FOUND';
  end if;
  if v_target_owner = v_actor then
    raise exception using errcode = '22023', message = 'CANNOT_SWIPE_OWN_CAR';
  end if;

  if p_offered_car_id is not null then
    select c.user_id into v_offered_owner
    from public.cars as c
    where c.id = p_offered_car_id;
    if v_offered_owner is distinct from v_actor then
      raise exception using errcode = '42501', message = 'OFFERED_CAR_NOT_OWNED';
    end if;
    if p_offered_car_id = p_target_car_id then
      raise exception using errcode = '22023', message = 'CARS_MUST_BE_DIFFERENT';
    end if;
  end if;

  if p_liked and p_offered_car_id is null then
    raise exception using errcode = '22023', message = 'ADD_A_CAR_BEFORE_LIKING';
  end if;

  -- Serialize swipes between the same two users so simultaneous likes cannot
  -- both miss one another's transaction.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      least(v_actor, v_target_owner)::text || ':' || greatest(v_actor, v_target_owner)::text,
      0
    )
  );

  insert into public.car_swipes (user_id, target_car_id, offered_car_id, liked)
  values (v_actor, p_target_car_id, p_offered_car_id, p_liked)
  on conflict (user_id, target_car_id) do update
    set offered_car_id = case when excluded.liked then excluded.offered_car_id else public.car_swipes.offered_car_id end,
        liked = public.car_swipes.liked or excluded.liked,
        updated_at = now();

  if not p_liked then
    return jsonb_build_object('matched', false, 'new_match', false);
  end if;

  select s.offered_car_id into v_reverse_offered
  from public.car_swipes as s
  where s.user_id = v_target_owner
    and s.target_car_id = p_offered_car_id
    and s.offered_car_id = p_target_car_id
    and s.liked;

  if v_reverse_offered is null then
    return jsonb_build_object('matched', false, 'new_match', false);
  end if;

  if v_actor < v_target_owner then
    v_user_a := v_actor;
    v_user_b := v_target_owner;
    v_car_a := p_offered_car_id;
    v_car_b := p_target_car_id;
  else
    v_user_a := v_target_owner;
    v_user_b := v_actor;
    v_car_a := p_target_car_id;
    v_car_b := p_offered_car_id;
  end if;

  select c.brand || ' ' || c.model, c.price
    into v_car_a_title, v_car_a_price
  from public.cars as c where c.id = v_car_a;
  select c.brand || ' ' || c.model, c.price
    into v_car_b_title, v_car_b_price
  from public.cars as c where c.id = v_car_b;
  v_difference := abs(v_car_a_price - v_car_b_price);
  v_trade_summary := 'Match za zamenu · razlika ' || round(v_difference)::text || ' €';

  insert into public.conversations (
    car_id, buyer_id, seller_id, buyer_name, trade_summary
  ) values (
    v_car_b, v_user_a, v_user_b,
    coalesce((select p.name from public.profiles as p where p.id = v_user_a), 'Korisnik'),
    v_trade_summary
  )
  on conflict (car_id, buyer_id, seller_id) do update
    set trade_summary = excluded.trade_summary
  returning id into v_conversation_id;

  insert into public.matches (
    user_a_id, user_b_id, car_a_id, car_b_id, conversation_id
  ) values (
    v_user_a, v_user_b, v_car_a, v_car_b, v_conversation_id
  )
  on conflict (user_a_id, user_b_id, car_a_id, car_b_id) do nothing
  returning id into v_match_id;

  if v_match_id is not null then
    insert into public.messages (conversation_id, sender_id, kind, body)
    values (
      v_conversation_id,
      null,
      'match',
      '🎉 Imate match! Oboje ste lajkovali oglase za zamenu.' || E'\n\n' ||
      v_car_a_title || ' ↔ ' || v_car_b_title || E'\n' ||
      'Razlika u oglašenim cenama: ' || round(v_difference)::text || ' €.'
    );
  end if;

  return jsonb_build_object(
    'matched', true,
    'new_match', v_match_id is not null,
    'conversation_id', v_conversation_id
  );
end;
$$;

revoke all on function public.swipe_car(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.swipe_car(uuid, uuid, boolean) to authenticated;

