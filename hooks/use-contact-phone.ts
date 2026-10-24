'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getSupabase } from '@/lib/supabase';
import { emptyContactPhone, isContactTargetId, parseContactPhone, type ContactPhone } from '@/lib/contact-phone';

type ContactTarget = { carId: string } | { conversationId: string } | null;

/** Targeted server authorization only; no shared or localStorage phone cache. */
export function useContactPhone(target: ContactTarget) {
  const { userId, mounted: authReady } = useAuth();
  const kind = target && 'carId' in target ? 'listing' : 'conversation';
  const targetId = target && ('carId' in target ? target.carId : target.conversationId);
  const key = `${authReady ? userId ?? 'guest' : 'loading'}:${kind}:${targetId ?? ''}`;
  const latestKey = useRef(key);
  latestKey.current = key;
  const requestSequence = useRef(0);
  const active = useRef(false);
  const [snapshot, setSnapshot] = useState<{ key: string; contact: ContactPhone } | null>(null);

  const refresh = useCallback(async (): Promise<ContactPhone> => {
    const sequence = ++requestSequence.current;
    let contact: ContactPhone;
    if (!authReady) contact = emptyContactPhone('loading');
    else if (!userId) contact = emptyContactPhone('signed_out');
    else if (!targetId || !isContactTargetId(targetId)) contact = emptyContactPhone('not_found');
    else {
      try {
        const { data, error } = kind === 'listing'
          ? await getSupabase().rpc('get_listing_contact', { p_car_id: targetId })
          : await getSupabase().rpc('get_conversation_contact', { p_conversation_id: targetId });
        contact = error ? emptyContactPhone('unavailable') : parseContactPhone(data);
      } catch {
        contact = emptyContactPhone('unavailable');
      }
    }
    if (!active.current || latestKey.current !== key || requestSequence.current !== sequence) {
      return emptyContactPhone('unavailable');
    }
    setSnapshot({ key, contact });
    return contact;
  }, [authReady, key, kind, targetId, userId]);

  useEffect(() => {
    active.current = true;
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active.current = false;
      // A pending click or focus request must not survive navigation or a
      // newer request and later dial a stale, no-longer-authorized number.
      requestSequence.current += 1;
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const contact = snapshot?.key === key
    ? snapshot.contact
    : emptyContactPhone(!authReady ? 'loading' : !userId ? 'signed_out' : 'loading');

  /** Recheck privacy at activation, so an old screen cannot dial a revoked number. */
  const dial = useCallback(async (): Promise<ContactPhone> => {
    const sequence = requestSequence.current + 1;
    const current = await refresh();
    if (!active.current || latestKey.current !== key || requestSequence.current !== sequence) {
      return emptyContactPhone('unavailable');
    }
    if (current.status === 'available' && current.href) {
      window.location.assign(current.href);
    }
    return current;
  }, [key, refresh]);

  return { ...contact, refresh, dial };
}
