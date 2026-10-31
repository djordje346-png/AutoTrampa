-- Offers record interest in a specific pair; money is agreed in conversation.
-- Additive migration: existing conversations, messages and matches are retained.
create table public.trade_offers (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  offered_car_id uuid references public.cars(id) on delete set null,
  target_car_id uuid references public.cars(id) on delete set null,
  offered_car jsonb not null,
  target_car jsonb not null,
  sender_name text not null,
  recipient_name text not null,
  note text not null default '' check (char_length(note) <= 500),
  status text not null default 'pending' check (status in ('pending', 'declined', 'withdrawn')),
  conversation_id uuid references public.conversations(id) on delete set null,
  recipient_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  pair_low uuid generated always as (case when offered_car_id is not null and target_car_id is not null then least(offered_car_id,target_car_id) end) stored,
  pair_high uuid generated always as (case when offered_car_id is not null and target_car_id is not null then greatest(offered_car_id,target_car_id) end) stored,
  check (sender_id <> recipient_id),
  check (offered_car_id is null or target_car_id is null or offered_car_id <> target_car_id)
);
create unique index trade_offers_one_pending_pair on public.trade_offers(pair_low,pair_high) where status = 'pending';
create index trade_offers_sender_idx on public.trade_offers(sender_id,created_at desc);
create index trade_offers_recipient_idx on public.trade_offers(recipient_id,created_at desc);
create index trade_offers_offered_car_idx on public.trade_offers(offered_car_id);
create index trade_offers_target_car_idx on public.trade_offers(target_car_id);
create index trade_offers_conversation_idx on public.trade_offers(conversation_id);
alter table public.trade_offers enable row level security;
revoke all on public.trade_offers from public, anon, authenticated;
grant select on public.trade_offers to authenticated;
create policy "Offer participants can read their offers" on public.trade_offers for select to authenticated
  using ((select auth.uid()) in (sender_id,recipient_id));

-- Internal privileged writes: identities and public-only snapshots are derived
-- from the database, never supplied by a client. No phones/private fields copied.
create function autotrampa_private.create_trade_offer(p_target_car_id uuid,p_offered_car_id uuid,p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  target public.cars%rowtype;
  offered public.cars%rowtype;
  offer_id uuid;
  body text := btrim(coalesce(p_note,''));
begin
  if actor is null then raise exception using errcode='42501',message='AUTHENTICATION_REQUIRED'; end if;
  if char_length(body)>500 then raise exception using errcode='22023',message='NOTE_TOO_LONG'; end if;
  select * into target from public.cars where id=p_target_car_id for share;
  if not found then raise exception using errcode='P0002',message='TARGET_CAR_NOT_FOUND'; end if;
  select * into offered from public.cars where id=p_offered_car_id for share;
  if not found then raise exception using errcode='P0002',message='OFFERED_CAR_NOT_FOUND'; end if;
  if offered.user_id<>actor then raise exception using errcode='42501',message='OFFERED_CAR_NOT_OWNED'; end if;
  if target.user_id=actor then raise exception using errcode='22023',message='CANNOT_OFFER_FOR_OWN_CAR'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(actor,target.user_id)::text||':'||greatest(actor,target.user_id)::text,0));
  select id into offer_id from public.trade_offers where pair_low=least(p_target_car_id,p_offered_car_id)
    and pair_high=greatest(p_target_car_id,p_offered_car_id) and status='pending';
  if found then return jsonb_build_object('offer_id',offer_id,'already_exists',true); end if;
  insert into public.trade_offers(sender_id,recipient_id,offered_car_id,target_car_id,offered_car,target_car,sender_name,recipient_name,note)
  values(actor,target.user_id,offered.id,target.id,
    jsonb_build_object('brand',offered.brand,'model',offered.model,'year',offered.year,'image',offered.image,'city',offered.city,'mileage',offered.mileage,'specs',jsonb_build_object('fuelType',offered.specs->>'fuelType','transmission',offered.specs->>'transmission')),
    jsonb_build_object('brand',target.brand,'model',target.model,'year',target.year,'image',target.image,'city',target.city,'mileage',target.mileage,'specs',jsonb_build_object('fuelType',target.specs->>'fuelType','transmission',target.specs->>'transmission')),
    coalesce((select name from public.profiles where id=actor),'Korisnik'),
    coalesce((select name from public.profiles where id=target.user_id),'Korisnik'),body)
  returning id into offer_id;
  return jsonb_build_object('offer_id',offer_id,'already_exists',false);
end; $$;

create function autotrampa_private.update_trade_offer(p_offer_id uuid,p_action text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid()); offer public.trade_offers%rowtype;
begin
  if actor is null then raise exception using errcode='42501',message='AUTHENTICATION_REQUIRED'; end if;
  select * into offer from public.trade_offers where id=p_offer_id for update;
  if not found or actor not in (offer.sender_id,offer.recipient_id) then raise exception using errcode='42501',message='OFFER_NOT_ACCESSIBLE'; end if;
  if p_action='read' and actor=offer.recipient_id then
    update public.trade_offers set recipient_read_at=coalesce(recipient_read_at,now()) where id=offer.id;
  elsif p_action='decline' and actor=offer.recipient_id and offer.status='pending' then
    update public.trade_offers set status='declined',recipient_read_at=coalesce(recipient_read_at,now()),updated_at=now() where id=offer.id;
  elsif p_action='withdraw' and actor=offer.sender_id and offer.status='pending' then
    update public.trade_offers set status='withdrawn',updated_at=now() where id=offer.id;
  else raise exception using errcode='22023',message='OFFER_ACTION_NOT_ALLOWED';
  end if;
  return true;
end; $$;

create function autotrampa_private.open_offer_conversation(p_offer_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid()); offer public.trade_offers%rowtype; thread_id uuid;
begin
  if actor is null then raise exception using errcode='42501',message='AUTHENTICATION_REQUIRED'; end if;
  select * into offer from public.trade_offers where id=p_offer_id for update;
  if not found or actor not in (offer.sender_id,offer.recipient_id) then raise exception using errcode='42501',message='OFFER_NOT_ACCESSIBLE'; end if;
  if offer.status<>'pending' or offer.target_car_id is null or offer.offered_car_id is null then
    raise exception using errcode='22023',message='OFFER_NOT_ACTIVE';
  end if;
  if not exists(select 1 from public.cars where id=offer.offered_car_id and user_id=offer.sender_id)
    or not exists(select 1 from public.cars where id=offer.target_car_id and user_id=offer.recipient_id) then
    raise exception using errcode='22023',message='OFFER_NOT_ACTIVE';
  end if;
  if actor=offer.sender_id then
    thread_id:=autotrampa_private.ensure_vehicle_pair_conversation(offer.target_car_id,offer.offered_car_id);
  else
    thread_id:=autotrampa_private.ensure_vehicle_pair_conversation(offer.offered_car_id,offer.target_car_id);
  end if;
  update public.conversations set buyer_archived=false,seller_archived=false,trade_summary='Doplata po dogovoru' where id=thread_id;
  update public.trade_offers set conversation_id=thread_id,
    recipient_read_at=case when actor=recipient_id then coalesce(recipient_read_at,now()) else recipient_read_at end
    where id=offer.id;
  return thread_id;
end; $$;

-- A question about a listing can start a chat without a garage car or an offer.
create function autotrampa_private.open_listing_conversation(p_target_car_id uuid,p_offered_car_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid()); target public.cars%rowtype; thread_id uuid;
begin
  if actor is null then raise exception using errcode='42501',message='AUTHENTICATION_REQUIRED'; end if;
  select * into target from public.cars where id=p_target_car_id;
  if not found then raise exception using errcode='P0002',message='TARGET_CAR_NOT_FOUND'; end if;
  if target.user_id=actor then raise exception using errcode='22023',message='CANNOT_MESSAGE_OWN_CAR'; end if;
  if p_offered_car_id is not null then
    thread_id:=autotrampa_private.ensure_vehicle_pair_conversation(p_target_car_id,p_offered_car_id);
  else
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(actor,target.user_id)::text||':'||greatest(actor,target.user_id)::text,0));
    select id into thread_id from public.conversations where car_id=target.id and buyer_id=actor
      and seller_id=target.user_id and offered_car_id is null order by created_at,id limit 1;
    if not found then
      insert into public.conversations(car_id,buyer_id,seller_id,buyer_name,trade_summary)
      values(target.id,actor,target.user_id,coalesce((select name from public.profiles where id=actor),'Korisnik'),'Doplata po dogovoru') returning id into thread_id;
    end if;
  end if;
  update public.conversations set buyer_archived=false,seller_archived=false,trade_summary='Doplata po dogovoru' where id=thread_id;
  return thread_id;
end; $$;

create function public.create_trade_offer(p_target_car_id uuid,p_offered_car_id uuid,p_note text default '') returns jsonb
  language sql security invoker set search_path='' as $$select autotrampa_private.create_trade_offer(p_target_car_id,p_offered_car_id,p_note)$$;
create function public.update_trade_offer(p_offer_id uuid,p_action text) returns boolean
  language sql security invoker set search_path='' as $$select autotrampa_private.update_trade_offer(p_offer_id,p_action)$$;
create function public.open_offer_conversation(p_offer_id uuid) returns uuid
  language sql security invoker set search_path='' as $$select autotrampa_private.open_offer_conversation(p_offer_id)$$;
create function public.open_listing_conversation(p_target_car_id uuid,p_offered_car_id uuid default null) returns uuid
  language sql security invoker set search_path='' as $$select autotrampa_private.open_listing_conversation(p_target_car_id,p_offered_car_id)$$;
revoke all on function autotrampa_private.create_trade_offer(uuid,uuid,text), autotrampa_private.update_trade_offer(uuid,text),
  autotrampa_private.open_offer_conversation(uuid),autotrampa_private.open_listing_conversation(uuid,uuid),
  public.create_trade_offer(uuid,uuid,text),public.update_trade_offer(uuid,text),public.open_offer_conversation(uuid),public.open_listing_conversation(uuid,uuid)
  from public,anon,authenticated;
grant execute on function autotrampa_private.create_trade_offer(uuid,uuid,text), autotrampa_private.update_trade_offer(uuid,text),
  autotrampa_private.open_offer_conversation(uuid),autotrampa_private.open_listing_conversation(uuid,uuid),
  public.create_trade_offer(uuid,uuid,text),public.update_trade_offer(uuid,text),public.open_offer_conversation(uuid),public.open_listing_conversation(uuid,uuid)
  to authenticated;
