-- Keep the default private. A browser-local opt-out is not consent to publish
-- a phone number to other accounts, so old localStorage values are not imported.
alter table public.profiles
  add column if not exists phone_after_match boolean not null default true;

grant update (phone_after_match) on public.profiles to authenticated;
comment on column public.profiles.phone_after_match is
  'Hide phone until a confirmed agreement. Mutual likes are not an agreement; while confirmation is unsupported, true keeps the number private.';

-- The private helper resolves the owner from one authorized resource. It never
-- accepts an arbitrary profile id and never provides a bulk profile endpoint.
create or replace function autotrampa_private.get_contact(
  p_car_id uuid,
  p_conversation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_owner uuid;
  v_phone text;
  v_private boolean;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if (p_car_id is null) = (p_conversation_id is null) then
    return jsonb_build_object('status', 'not_found');
  end if;

  if p_car_id is not null then
    select c.user_id into v_owner from public.cars c where c.id = p_car_id;
  else
    select case when c.buyer_id = v_actor then c.seller_id else c.buyer_id end
      into v_owner
    from public.conversations c
    where c.id = p_conversation_id and v_actor in (c.buyer_id, c.seller_id);
  end if;
  if v_owner is null then return jsonb_build_object('status', 'not_found'); end if;

  select p.phone, p.phone_after_match into v_phone, v_private
  from public.profiles p where p.id = v_owner;
  if not found then return jsonb_build_object('status', 'not_found'); end if;

  -- There is no accepted/confirmed trade status in the current schema.
  -- A row in matches is ONLY a mutual like and must not unlock this gate.
  if v_owner <> v_actor and coalesce(v_private, true) then
    return jsonb_build_object('status', 'hidden');
  end if;

  v_phone := regexp_replace(v_phone, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  if v_phone is null or v_phone !~ '^([+]|00)?[0-9][0-9[:space:]()/-]*$' then
    return jsonb_build_object('status', 'missing');
  end if;
  v_phone := regexp_replace(v_phone, '[[:space:]()/-]', '', 'g');
  if left(v_phone, 2) = '00' then v_phone := '+' || substr(v_phone, 3); end if;
  if v_phone !~ '^[+]?[0-9]{7,15}$' then
    return jsonb_build_object('status', 'missing');
  end if;
  return jsonb_build_object('status', 'available', 'phone', v_phone);
end;
$$;
revoke all on function autotrampa_private.get_contact(uuid, uuid) from public, anon, authenticated;
grant usage on schema autotrampa_private to authenticated;
grant execute on function autotrampa_private.get_contact(uuid, uuid) to authenticated;

-- Exposed wrappers run as the caller. Privileged reads are confined to the
-- non-exposed helper, after authentication, ownership/participation and privacy.
create or replace function public.get_listing_contact(p_car_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select autotrampa_private.get_contact(p_car_id, null); $$;
create or replace function public.get_conversation_contact(p_conversation_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select autotrampa_private.get_contact(null, p_conversation_id); $$;
revoke all on function public.get_listing_contact(uuid) from public, anon, authenticated;
revoke all on function public.get_conversation_contact(uuid) from public, anon, authenticated;
grant execute on function public.get_listing_contact(uuid) to authenticated;
grant execute on function public.get_conversation_contact(uuid) to authenticated;

notify pgrst, 'reload schema';
