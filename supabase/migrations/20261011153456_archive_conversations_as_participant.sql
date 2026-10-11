create or replace function public.archive_conversation(p_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  update public.conversations
  set buyer_archived = true
  where id = p_conversation_id
    and buyer_id = current_user_id;
  if found then
    return true;
  end if;

  update public.conversations
  set seller_archived = true
  where id = p_conversation_id
    and seller_id = current_user_id;

  return found;
end;
$$;

revoke all on function public.archive_conversation(uuid) from public, anon, authenticated;
grant execute on function public.archive_conversation(uuid) to authenticated;

notify pgrst, 'reload schema';
