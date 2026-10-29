'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, X, BookmarkX, ArrowRight, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { getTradeLabel } from '@/lib/trade';
import { useSaved } from '@/hooks/use-saved';
import { useGarage } from '@/hooks/use-garage';
import { useAuth } from '@/hooks/use-auth';
import { useSwipes } from '@/hooks/use-swipes';
import { useMatchLike } from '@/hooks/use-match-like';
import { useMarketplace } from '@/hooks/use-marketplace';
import { TradeOfferSheet } from '@/components/TradeOfferSheet';
import MarketplaceV13Card from '@/components/MarketplaceV13Card';
import { Car } from '@/types';
import { requestPhoneAction } from '@/hooks/use-phone-gate';

export default function SavedClient() {
  const { saved: savedIds, remove: removeSaved, save, clear, mounted } = useSaved();
  const { selectedCar } = useGarage();
  const { cars: marketplaceCars } = useMarketplace();
  const { isLoggedIn, mounted: authReady, requireAuth } = useAuth();
  const { recordSwipe } = useSwipes();
  const { likeCar, isLiking } = useMatchLike(recordSwipe, save);
  const [confirmClear, setConfirmClear] = useState(false);
  const [offerCar, setOfferCar] = useState<Car | null>(null);
  const router = useRouter();

  const showTrade = authReady && isLoggedIn && selectedCar !== null;

  // Keep the order the user saved them in.
  const savedCars: Car[] = savedIds
    .map(id => marketplaceCars.find(c => c.id === id))
    .filter((c): c is Car => Boolean(c));

  /**
   * Wish list is where the offer is usually sent from, so the card keeps the
   * primary action. Same guards as everywhere else: sign in first, then a car
   * of your own, otherwise say why instead of doing nothing.
   */
  function openOffer(car: Car) {
    const continueToOffer = () => requestPhoneAction(() => setOfferCar(car));
    if (!requireAuth('Prijavi se da pošalješ ponudu za zamenu', continueToOffer)) return;
    if (!selectedCar) {
      toast.error('Prvo dodaj svoj auto u garažu.', {
        description: 'Ponuda je razlika između tvog i ovog vozila.',
        action: { label: 'Garaža', onClick: () => router.push('/garage') },
      });
      return;
    }
    continueToOffer();
  }

  function remove(car: Car) {
    removeSaved(car.id);
    toast('Uklonjeno iz sačuvanih', {
      description: `${car.brand} ${car.model}`,
      action: { label: 'Vrati', onClick: () => save(car.id) },
    });
  }

  function clearAll() {
    const restore = [...savedIds];
    clear();
    setConfirmClear(false);
    toast('Lista je ispražnjena', {
      description: `${restore.length} oglasa uklonjeno`,
      action: { label: 'Vrati', onClick: () => restore.forEach(save) },
    });
  }

  if (!mounted) {
    return (
      <div className="flex flex-col">
        <header className="app-page-header safe-top">
          <div className="app-container py-4">
            <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-app-primary">Sačuvano</h1>
          </div>
        </header>
        <div className="app-container space-y-3 pt-6">
          <div className="h-56 animate-pulse rounded-2xl bg-card-surface dark:bg-card-surface" />
          <div className="h-56 animate-pulse rounded-2xl bg-card-surface dark:bg-card-surface" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="app-page-header safe-top">
        <div className="app-container flex items-center justify-between gap-3 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-app-primary">Sačuvano</h1>
            <p className="mt-0.5 text-xs text-app-muted">
              {savedCars.length === 0
                ? 'Tvoja lista želja'
                : `${savedCars.length} ${savedCars.length === 1 ? 'oglas' : 'oglasa'}`}
            </p>
          </div>
          {savedCars.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-app-muted transition-colors hover:bg-tone-negative-surface hover:text-tone-negative"
            >
              Obriši sve
            </button>
          )}
        </div>
      </header>

      <div className="app-container mt-3 grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {savedCars.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-elevated/60">
              <BookmarkX size={36} className="text-app-muted" />
            </div>
            <p className="text-base font-semibold text-app-secondary dark:text-app-secondary">Nema sačuvanih oglasa</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-app-muted">
              Pritisni <Heart size={13} className="mx-0.5 inline text-secondary-accent" /> ikonu na bilo kom
              oglasu da ga sačuvaš ovde.
            </p>
            <Link
              href="/"
              className="btn-primary mt-6 text-sm"
            >
              Pregledaj oglase
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          savedCars.map(car => {
            const tl = showTrade ? getTradeLabel(selectedCar!, car) : null;
            return (
              <MarketplaceV13Card
                key={car.id}
                car={car}
                trade={tl}
                onLike={(likedCar) => { void likeCar(likedCar); }}
                liking={isLiking(car.id)}
                onOffer={openOffer}
                photoActions={
                  <button
                    type="button"
                    onClick={(event) => { event.preventDefault(); event.stopPropagation(); remove(car); }}
                    aria-label={`Ukloni ${car.brand} ${car.model} iz sačuvanih`}
                    className="pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/70 text-white transition-colors hover:text-tone-negative"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                }
              />
            );
          })
        )}
      </div>

      {confirmClear && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="clear-title"
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setConfirmClear(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-surface dark:border-surface bg-card-surface dark:bg-card-surface p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tone-negative-surface">
              <TriangleAlert size={22} className="text-tone-negative" />
            </div>
            <h3 id="clear-title" className="text-center text-base font-bold text-app-primary dark:text-app-primary">
              Obrisati celu listu?
            </h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-app-secondary dark:text-app-secondary">
              {savedCars.length} sačuvanih oglasa biće uklonjeno.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary dark:text-app-primary transition-colors hover:bg-hover-surface"
              >
                Odustani
              </button>
              <button
                onClick={clearAll}
                className="flex-1 rounded-xl bg-tone-negative py-3 text-sm font-bold text-on-tone-negative transition-opacity hover:opacity-90"
              >
                Obriši sve
              </button>
            </div>
          </div>
        </div>
      )}

      <TradeOfferSheet car={offerCar} myCar={selectedCar} onClose={() => setOfferCar(null)} />
    </div>
  );
}
