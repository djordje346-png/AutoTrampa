alter table public.conversations
  add column if not exists buyer_name text not null default '',
  add column if not exists trade_summary text not null default '',
  add column if not exists buyer_archived boolean not null default false,
  add column if not exists seller_archived boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists conversations_car_buyer_seller_idx
  on public.conversations (car_id, buyer_id, seller_id);
create index if not exists conversations_buyer_active_idx
  on public.conversations (buyer_id, buyer_archived, updated_at desc);
create index if not exists conversations_seller_active_idx
  on public.conversations (seller_id, seller_archived, updated_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);
create index if not exists messages_unread_idx
  on public.messages (conversation_id, read_at)
  where read_at is null;

alter table public.messages enable row level security;
revoke all on table public.messages from public, anon, authenticated;
grant select on table public.messages to authenticated;
grant insert (conversation_id, sender_id, body) on table public.messages to authenticated;
grant update (read_at) on table public.messages to authenticated;
grant update (buyer_archived, seller_archived) on table public.conversations to authenticated;

drop policy if exists "Participants can view conversations" on public.conversations;
drop policy if exists "Buyers can create conversations for listings" on public.conversations;
drop policy if exists "Users can archive their own conversations" on public.conversations;
create policy "Participants can view active conversations" on public.conversations
  for select to authenticated
  using (
    ((select auth.uid()) = buyer_id and not buyer_archived)
    or ((select auth.uid()) = seller_id and not seller_archived)
  );
create policy "Buyers can create conversations for listings" on public.conversations
  for insert to authenticated
  with check (
    (select auth.uid()) = buyer_id
    and buyer_id <> seller_id
    and exists (
      select 1 from public.cars
      where cars.id = car_id and cars.user_id = seller_id
    )
  );
create policy "Participants can archive conversations" on public.conversations
  for update to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id))
  with check ((select auth.uid()) in (buyer_id, seller_id));

drop policy if exists "Participants can read messages" on public.messages;
drop policy if exists "Participants can send messages" on public.messages;
drop policy if exists "Recipients can mark messages read" on public.messages;
create policy "Participants can read messages" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.buyer_id, c.seller_id)
    )
  );
create policy "Participants can send messages" on public.messages
  for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.buyer_id, c.seller_id)
    )
  );
create policy "Recipients can mark messages read" on public.messages
  for update to authenticated
  using (
    sender_id <> (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.buyer_id, c.seller_id)
    )
  )
  with check (
    sender_id <> (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.buyer_id, c.seller_id)
    )
  );

create or replace function autotrampa_private.guard_conversation_archive()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) = old.buyer_id
     and new.seller_archived is distinct from old.seller_archived then
    raise exception using errcode = '42501', message = 'Cannot change the other participant archive state';
  end if;
  if (select auth.uid()) = old.seller_id
     and new.buyer_archived is distinct from old.buyer_archived then
    raise exception using errcode = '42501', message = 'Cannot change the other participant archive state';
  end if;
  if (select auth.uid()) not in (old.buyer_id, old.seller_id) then
    raise exception using errcode = '42501', message = 'Not a conversation participant';
  end if;
  return new;
end;
$$;
revoke all on function autotrampa_private.guard_conversation_archive() from public, anon;
grant usage on schema autotrampa_private to authenticated;
grant execute on function autotrampa_private.guard_conversation_archive() to authenticated;
drop trigger if exists conversations_guard_archive on public.conversations;
create trigger conversations_guard_archive
  before update of buyer_archived, seller_archived on public.conversations
  for each row execute function autotrampa_private.guard_conversation_archive();

create or replace function autotrampa_private.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set updated_at = new.created_at,
      buyer_archived = false,
      seller_archived = false
  where id = new.conversation_id;
  return new;
end;
$$;
revoke all on function autotrampa_private.touch_conversation_on_message() from public, anon, authenticated;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function autotrampa_private.touch_conversation_on_message();
