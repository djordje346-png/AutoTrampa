'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useGarage } from '@/hooks/use-garage';
import type { Car } from '@/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RecordSwipe = (
  targetCarId: string,
  offeredCarId: string | null,
  liked: boolean,
) => Promise<{
  ok: true;
  result: { matched: boolean; new_match: boolean; conversation_id?: string };
} | { ok: false; message: string }>;
type SaveCar = (carId: string) => Promise<boolean>;

/** Match likes from every listing surface use the same persisted swipe RPC. */
export function useMatchLike(recordSwipe: RecordSwipe, saveCar: SaveCar) {
  const router = useRouter();
  const { selectedCar } = useGarage();
  const { userId, requireAuth } = useAuth();
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const likeCarRef = useRef<(target: Car) => Promise<boolean>>(async () => false);

  const likeCar = useCallback(async function likeCar(target: Car) {
    if (!requireAuth('Prijavi se i dodaj auto da lajkuješ oglas', () => void likeCarRef.current(target))) return false;

    if (!selectedCar) {
      toast.error('Prvo dodaj svoj auto u garažu.', {
        description: 'Za match je potreban auto koji nudiš za zamenu.',
        action: { label: 'Garaža', onClick: () => router.push('/garage') },
      });
      return false;
    }
    if (!UUID_RE.test(target.id) || !UUID_RE.test(selectedCar.id)) {
      toast.message('Demo oglas ili demo auto ne mogu da naprave match.');
      return false;
    }
    if (target.ownerId === userId) {
      toast.error('Ne možeš da lajkuješ sopstveni oglas.');
      return false;
    }
    if (pendingIds.has(target.id)) return false;

    setPendingIds((previous) => new Set(previous).add(target.id));
    try {
      let saved = false;
      try {
        saved = await saveCar(target.id);
      } catch {
        saved = false;
      }
      if (!saved) {
        toast.error('Oglas nije sačuvan, pa lajk nije poslat. Pokušaj ponovo.');
        return false;
      }
      const result = await recordSwipe(target.id, selectedCar.id, true);
      if (!result.ok) {
        toast.error('Oglas je sačuvan, ali lajk nije poslat. Pokušaj ponovo.');
        return false;
      }
      if (result.result.matched) {
        toast.success(result.result.new_match ? 'Imate match!' : 'Već imate match!', {
          description: 'Razgovor je dostupan u Porukama.',
          action: { label: 'Otvori poruke', onClick: () => router.push('/messages') },
        });
      } else {
        toast.success('Lajk je sačuvan.', {
          description: 'Ako vlasnik uzvrati lajk, otvoriće se razgovor u Porukama.',
        });
      }
      return true;
    } finally {
      setPendingIds((previous) => {
        const next = new Set(previous);
        next.delete(target.id);
        return next;
      });
    }
  }, [pendingIds, recordSwipe, requireAuth, router, saveCar, selectedCar, userId]);

  useEffect(() => {
    likeCarRef.current = likeCar;
  }, [likeCar]);

  return { likeCar, isLiking: (carId: string) => pendingIds.has(carId) };
}
