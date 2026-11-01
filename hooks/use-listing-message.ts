'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useGarage } from '@/hooks/use-garage';
import { getSupabase } from '@/lib/supabase';
import { UUID_RE, offerError } from '@/lib/trade-offers';
import type { Car } from '@/types';

/** Open a canonical conversation only; never creates an offer or sends text. */
export function useListingMessage() {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const { selectedCar } = useGarage();
  const busy = useRef(false);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  async function openMessage(car: Car) {
    if (!car.ownerId || !UUID_RE.test(car.id)) {
      toast.message('Demo oglas nema stvarnog vlasnika. Poruke se ne šalju.');
      return;
    }
    if (busy.current || !requireAuth('Prijavi se da pošalješ poruku vlasniku.')) return;
    busy.current = true;
    setMessagingId(car.id);
    try {
      const { data, error } = await getSupabase().rpc('open_listing_conversation', {
        p_target_car_id: car.id,
        p_offered_car_id: selectedCar?.id ?? null,
      });
      if (error || !UUID_RE.test(data ?? '')) { toast.error(offerError(error)); return; }
      router.push(`/messages?conversation=${data}`);
    } catch { toast.error(offerError(null)); }
    finally { busy.current = false; setMessagingId(null); }
  }

  return { openMessage, messagingId };
}
