-- Apply in one transaction. Protect the backfill, message moves and new unique
-- index from concurrent offers during migration. Do not run on production
-- before reviewing the preflight report and obtaining approval.
lock table public.conversations, public.messages, public.matches in share row exclusive mode;

alter table public.conversations
  add column if not exists offered_car_id uuid
    references public.cars(id) on delete set null;
alter table public.conversations
  add column if not exists car_pair_low uuid generated always as
    (case when offered_car_id is not null then least(car_id, offered_car_id) end) stored,
  add column if not exists car_pair_high uuid generated always as
    (case when offered_car_id is not null then greatest(car_id, offered_car_id) end) stored;
alter table public.conversations
  add constraint conversations_distinct_cars check (offered_car_id is null or offered_car_id <> car_id);

-- All new conversations are created through the validating atomic RPC. The
-- archive RPC also validates the caller; removing direct writes makes the old
-- archive guard unnecessary and lets the message trigger reopen BOTH sides.
revoke insert, update, delete on table public.conversations from authenticated;
revoke update (buyer_archived, seller_archived) on public.conversations from authenticated;
drop policy if exists "Buyers can create conversations for listings" on public.conversations;
drop policy if exists "Participants can archive conversations" on public.conversations;
drop trigger if exists conversations_guard_archive on public.conversations;
revoke all on function autotrampa_private.guard_conversation_archive() from public, anon, authenticated;

-- Only matches with exactly ONE provable pair and consistent owners/participants
-- can backfill an old thread. Never infer a vehicle from names, message text,
-- trade_summary, a current garage selection or the user's sole current car.
with proof as (
  select c.id,
    max((case when c.car_id = m.car_a_id then m.car_b_id else m.car_a_id end)::text)::uuid as offered_id
  from public.conversations c
  join public.matches m on m.conversation_id = c.id
  left join public.cars target on target.id = c.car_id
  left join public.cars offered on offered.id =
    case when c.car_id = m.car_a_id then m.car_b_id else m.car_a_id end
  group by c.id
  having count(distinct (least(m.car_a_id, m.car_b_id), greatest(m.car_a_id, m.car_b_id))) = 1
    and bool_and(coalesce(
      c.car_id in (m.car_a_id, m.car_b_id)
      and target.user_id = c.seller_id and offered.user_id = c.buyer_id
      and least(c.buyer_id, c.seller_id) = m.user_a_id
      and greatest(c.buyer_id, c.seller_id) = m.user_b_id,
      false
    ))
)
update public.conversations c set offered_car_id = proof.offered_id
from proof where c.id = proof.id and c.offered_car_id is null;

-- Retain the original metadata of any confidently identified duplicate. This
-- non-exposed audit is not readable/writable through either frontend role.
create table autotrampa_private.conversation_merge_audit (
  original_conversation_id uuid primary key,
  merged_into uuid not null,
  original_row jsonb not null,
  merged_at timestamptz not null default now()
);
alter table autotrampa_private.conversation_merge_audit enable row level security;
revoke all on autotrampa_private.conversation_merge_audit from public, anon, authenticated;

do $$
declare
  v_pair record;
  v_keep public.conversations%rowtype;
  v_buyer_archived boolean;
  v_seller_archived boolean;
  v_updated timestamptz;
begin
  for v_pair in
    select car_pair_low, car_pair_high, array_agg(id order by created_at, id) as ids
    from public.conversations where car_pair_low is not null
    group by car_pair_low, car_pair_high having count(*) > 1
  loop
    select * into v_keep from public.conversations where id = v_pair.ids[1];
    if exists (
      select 1 from public.conversations c where c.id = any(v_pair.ids)
        and (least(c.buyer_id, c.seller_id) <> least(v_keep.buyer_id, v_keep.seller_id)
          or greatest(c.buyer_id, c.seller_id) <> greatest(v_keep.buyer_id, v_keep.seller_id))
    ) then
      raise exception 'PAIR_PARTICIPANTS_REQUIRE_MANUAL_REVIEW';
    end if;

    insert into autotrampa_private.conversation_merge_audit
      (original_conversation_id, merged_into, original_row)
    select c.id, v_keep.id, to_jsonb(c) from public.conversations c where c.id = any(v_pair.ids);

    -- Archive flags are participant-specific even when the original direction
    -- differs. Keep a thread visible if it was visible to that user in ANY copy.
    select
      bool_and(case when c.buyer_id = v_keep.buyer_id then c.buyer_archived else c.seller_archived end),
      bool_and(case when c.seller_id = v_keep.seller_id then c.seller_archived else c.buyer_archived end),
      max(c.updated_at)
    into v_buyer_archived, v_seller_archived, v_updated
    from public.conversations c where c.id = any(v_pair.ids);

    -- Moving rows preserves message IDs, authors, bodies, timestamps and read_at.
    -- No insert trigger fires and no messages are marked read during the merge.
    update public.messages set conversation_id = v_keep.id
      where conversation_id = any(v_pair.ids) and conversation_id <> v_keep.id;
    update public.matches set conversation_id = v_keep.id
      where conversation_id = any(v_pair.ids) and conversation_id <> v_keep.id;
    update public.conversations set
      buyer_archived = v_buyer_archived, seller_archived = v_seller_archived,
      updated_at = greatest(v_updated, (select max(created_at) from public.messages where conversation_id = v_keep.id))
      where id = v_keep.id;
    delete from public.conversations where id = any(v_pair.ids) and id <> v_keep.id;
  end loop;
end;
$$;

drop index if exists public.conversations_car_buyer_seller_idx;
-- NULL pairs deliberately remain distinct: their missing vehicle is unknown.
create unique index conversations_vehicle_pair_idx on public.conversations (car_pair_low, car_pair_high);
create index conversations_offered_car_idx on public.conversations (offered_car_id);
create index if not exists conversations_car_id_idx on public.conversations (car_id);

create or replace function autotrampa_private.touch_conversation_on_message()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.conversations
    set updated_at = greatest(updated_at, new.created_at), buyer_archived = false, seller_archived = false
    where id = new.conversation_id;
  return new;
end;
$$;
revoke all on function autotrampa_private.touch_conversation_on_message() from public, anon, authenticated;

-- Internal helper: both manual offers and mutual likes resolve through this
-- same identity. Its callers already run in the protected private schema.
create or replace function autotrampa_private.ensure_vehicle_pair_conversation(
  p_target_car_id uuid, p_offered_car_id uuid
)
returns uuid language plpgsql security invoker set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_target public.cars%rowtype;
  v_offered public.cars%rowtype;
  v_id uuid;
begin
  if v_actor is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  select * into v_target from public.cars where id = p_target_car_id;
  if not found then raise exception using errcode = 'P0002', message = 'TARGET_CAR_NOT_FOUND'; end if;
  select * into v_offered from public.cars where id = p_offered_car_id;
  if not found then raise exception using errcode = 'P0002', message = 'OFFERED_CAR_NOT_FOUND'; end if;
  if v_offered.user_id <> v_actor then raise exception using errcode = '42501', message = 'OFFERED_CAR_NOT_OWNED'; end if;
  if v_target.user_id = v_actor then raise exception using errcode = '22023', message = 'CANNOT_OFFER_FOR_OWN_CAR'; end if;
  if p_target_car_id = p_offered_car_id then raise exception using errcode = '22023', message = 'CARS_MUST_BE_DIFFERENT'; end if;

  -- Same lock order as swipe_car: simultaneous reverse offers/likes serialize.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    least(v_actor, v_target.user_id)::text || ':' || greatest(v_actor, v_target.user_id)::text, 0));

  insert into public.conversations (car_id, offered_car_id, buyer_id, seller_id, buyer_name, trade_summary)
  values (p_target_car_id, p_offered_car_id, v_actor, v_target.user_id,
    coalesce((select name from public.profiles where id = v_actor), 'Korisnik'),
    'Predlog zamene · razlika oglašenih vrednosti ' || round(abs(v_target.price - v_offered.price))::text || ' €')
  on conflict (car_pair_low, car_pair_high) do update set trade_summary = excluded.trade_summary
  returning id into v_id;

  -- Fail closed if historical corruption ever associates a pair with outsiders.
  if not exists (select 1 from public.conversations c where c.id = v_id
    and least(c.buyer_id, c.seller_id) = least(v_actor, v_target.user_id)
    and greatest(c.buyer_id, c.seller_id) = greatest(v_actor, v_target.user_id)) then
    raise exception using errcode = '42501', message = 'PAIR_PARTICIPANT_MISMATCH';
  end if;
  return v_id;
end;
$$;
revoke all on function autotrampa_private.ensure_vehicle_pair_conversation(uuid, uuid) from public, anon, authenticated;

create or replace function autotrampa_private.send_trade_offer(
  p_target_car_id uuid, p_offered_car_id uuid, p_message text
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_body text := btrim(coalesce(p_message, ''));
begin
  if char_length(v_body) > 1000 then raise exception using errcode = '22023', message = 'MESSAGE_TOO_LONG'; end if;
  v_id := autotrampa_private.ensure_vehicle_pair_conversation(p_target_car_id, p_offered_car_id);
  if v_body = '' then
    select left('Zdravo! Nudim ' || offered.brand || ' ' || offered.model || ' za ' || target.brand || ' ' || target.model
      || '. Razlika u oglašenim vrednostima: ' || round(abs(target.price - offered.price))::text || ' €.', 1000)
      into v_body from public.cars target, public.cars offered
      where target.id = p_target_car_id and offered.id = p_offered_car_id;
  end if;
  insert into public.messages (conversation_id, sender_id, body) values (v_id, (select auth.uid()), v_body);
  return jsonb_build_object('conversation_id', v_id);
end;
$$;
revoke all on function autotrampa_private.send_trade_offer(uuid, uuid, text) from public, anon, authenticated;
grant execute on function autotrampa_private.send_trade_offer(uuid, uuid, text) to authenticated;
create or replace function public.send_trade_offer(p_target_car_id uuid, p_offered_car_id uuid, p_message text default '')
returns jsonb language sql security invoker set search_path = ''
as $$ select autotrampa_private.send_trade_offer(p_target_car_id, p_offered_car_id, p_message); $$;
revoke all on function public.send_trade_offer(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.send_trade_offer(uuid, uuid, text) to authenticated;

create or replace function autotrampa_private.archive_conversation(p_conversation_id uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_actor uuid := (select auth.uid());
begin
  if v_actor is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  update public.conversations set buyer_archived = true where id = p_conversation_id and buyer_id = v_actor;
  if found then return true; end if;
  update public.conversations set seller_archived = true where id = p_conversation_id and seller_id = v_actor;
  return found;
end;
$$;
revoke all on function autotrampa_private.archive_conversation(uuid) from public, anon, authenticated;
grant execute on function autotrampa_private.archive_conversation(uuid) to authenticated;
create or replace function public.archive_conversation(p_conversation_id uuid)
returns boolean language sql security invoker set search_path = ''
as $$ select autotrampa_private.archive_conversation(p_conversation_id); $$;
revoke all on function public.archive_conversation(uuid) from public, anon, authenticated;
grant execute on function public.archive_conversation(uuid) to authenticated;

create or replace function autotrampa_private.swipe_car(p_target_car_id uuid, p_offered_car_id uuid, p_liked boolean)
returns jsonb language plpgsql security definer set search_path = ''
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
  v_conversation_id uuid;
  v_match_id uuid;
  v_car_a_title text;
  v_car_b_title text;
  v_difference numeric;
begin
  if v_actor is null then raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED'; end if;
  select user_id into v_target_owner from public.cars where id = p_target_car_id;
  if v_target_owner is null then raise exception using errcode = 'P0002', message = 'TARGET_CAR_NOT_FOUND'; end if;
  if v_target_owner = v_actor then raise exception using errcode = '22023', message = 'CANNOT_SWIPE_OWN_CAR'; end if;
  if p_offered_car_id is not null then
    select user_id into v_offered_owner from public.cars where id = p_offered_car_id;
    if v_offered_owner is distinct from v_actor then raise exception using errcode = '42501', message = 'OFFERED_CAR_NOT_OWNED'; end if;
    if p_offered_car_id = p_target_car_id then raise exception using errcode = '22023', message = 'CARS_MUST_BE_DIFFERENT'; end if;
  end if;
  if p_liked and p_offered_car_id is null then raise exception using errcode = '22023', message = 'ADD_A_CAR_BEFORE_LIKING'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    least(v_actor, v_target_owner)::text || ':' || greatest(v_actor, v_target_owner)::text, 0));

  insert into public.car_swipes (user_id, target_car_id, offered_car_id, liked)
  values (v_actor, p_target_car_id, p_offered_car_id, p_liked)
  on conflict (user_id, target_car_id) do update set
    offered_car_id = case when excluded.liked then excluded.offered_car_id else public.car_swipes.offered_car_id end,
    liked = public.car_swipes.liked or excluded.liked, updated_at = now();
  if not p_liked then return jsonb_build_object('matched', false, 'new_match', false); end if;
  select offered_car_id into v_reverse_offered from public.car_swipes
    where user_id = v_target_owner and target_car_id = p_offered_car_id and offered_car_id = p_target_car_id and liked;
  if v_reverse_offered is null then return jsonb_build_object('matched', false, 'new_match', false); end if;

  if v_actor < v_target_owner then
    v_user_a := v_actor; v_user_b := v_target_owner; v_car_a := p_offered_car_id; v_car_b := p_target_car_id;
  else
    v_user_a := v_target_owner; v_user_b := v_actor; v_car_a := p_target_car_id; v_car_b := p_offered_car_id;
  end if;
  v_conversation_id := autotrampa_private.ensure_vehicle_pair_conversation(p_target_car_id, p_offered_car_id);
  insert into public.matches (user_a_id, user_b_id, car_a_id, car_b_id, conversation_id)
    values (v_user_a, v_user_b, v_car_a, v_car_b, v_conversation_id)
    on conflict (user_a_id, user_b_id, car_a_id, car_b_id) do nothing returning id into v_match_id;
  if v_match_id is null then
    -- Old ambiguous threads stay intact; future activity for a proven pair
    -- uses the canonical pair thread without guessing where old messages belong.
    update public.matches set conversation_id = v_conversation_id
      where user_a_id = v_user_a and user_b_id = v_user_b and car_a_id = v_car_a and car_b_id = v_car_b
        and conversation_id <> v_conversation_id;
  else
    select brand || ' ' || model into v_car_a_title from public.cars where id = v_car_a;
    select brand || ' ' || model into v_car_b_title from public.cars where id = v_car_b;
    select abs(a.price - b.price) into v_difference from public.cars a, public.cars b where a.id = v_car_a and b.id = v_car_b;
    insert into public.messages (conversation_id, sender_id, kind, body) values (
      v_conversation_id, null, 'match',
      left('🎉 Imate match! Oboje ste lajkovali oglase za zamenu.' || E'\n\n'
        || v_car_a_title || ' ↔ ' || v_car_b_title || E'\n'
        || 'Razlika u oglašenim cenama: ' || round(v_difference)::text || ' €.', 1000));
  end if;
  return jsonb_build_object('matched', true, 'new_match', v_match_id is not null, 'conversation_id', v_conversation_id);
end;
$$;
revoke all on function autotrampa_private.swipe_car(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function autotrampa_private.swipe_car(uuid, uuid, boolean) to authenticated;
create or replace function public.swipe_car(p_target_car_id uuid, p_offered_car_id uuid, p_liked boolean)
returns jsonb language sql security invoker set search_path = ''
as $$ select autotrampa_private.swipe_car(p_target_car_id, p_offered_car_id, p_liked); $$;
revoke all on function public.swipe_car(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.swipe_car(uuid, uuid, boolean) to authenticated;

comment on column public.conversations.offered_car_id is 'Original initiating buyer vehicle. NULL only for unproven legacy pairs or removed vehicles.';
comment on column public.conversations.car_pair_low is 'Unordered pair identity, lower vehicle UUID. NULL legacy pairs are never guessed/merged.';
comment on column public.conversations.car_pair_high is 'Unordered pair identity, higher vehicle UUID.';
notify pgrst, 'reload schema';
