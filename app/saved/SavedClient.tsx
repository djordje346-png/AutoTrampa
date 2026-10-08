'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, X, MapPin, Gauge, Fuel, BookmarkX, ArrowRight, ArrowLeftRight, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { formatEuro, formatKm } from '@/lib/cars';
import { getTradeLabel } from '@/lib/trade';
import { fuelLabel } from '@/lib/labels';
import { carSubtitle } from '@/lib/car-row';
import { useSaved } from '@/hooks/use-saved';
import { useGarage } from '@/hooks/use-garage';
import { useAuth } from '@/hooks/use-auth';
import { useMarketplace } from '@/hooks/use-marketplace';
import { TradeOfferSheet } from '@/components/TradeOfferSheet';
import { Car } from '@/types';

export default function SavedClient() {
  const { saved: savedIds, remove: removeSaved, save, clear, mounted } = useSaved();
  const { selectedCar } = useGarage();
  const { cars: marketplaceCars } = useMarketplace();
  const { isLoggedIn, mounted: authReady, requireAuth } = useAuth();
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
    if (!requireAuth('Prijavi se da pošalješ ponudu za zamenu', () => setOfferCar(car))) return;
    if (!selectedCar) {
      toast.error('Prvo dodaj svoj auto u garažu.', {
        description: 'Ponuda je razlika između tvog i ovog vozila.',
        action: { label: 'Garaža', onClick: () => router.push('/garage') },
      });
      return;
    }
    setOfferCar(car);
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
            <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-zinc-100">Sačuvano</h1>
          </div>
        </header>
        <div className="app-container space-y-3 pt-6">
          <div className="h-56 animate-pulse rounded-2xl bg-card-surface dark:bg-zinc-900" />
          <div className="h-56 animate-pulse rounded-2xl bg-card-surface dark:bg-zinc-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="app-page-header safe-top">
        <div className="app-container flex items-center justify-between gap-3 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-zinc-100">Sačuvano</h1>
            <p className="mt-0.5 text-xs text-app-muted">
              {savedCars.length === 0
                ? 'Tvoja lista želja'
                : `${savedCars.length} ${savedCars.length === 1 ? 'oglas' : 'oglasa'}`}
            </p>
          </div>
          {savedCars.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-app-muted transition-colors hover:bg-rose-500/10 hover:text-tone-negative"
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
            <p className="text-base font-semibold text-app-secondary dark:text-zinc-400">Nema sačuvanih oglasa</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-app-muted">
              Pritisni <Heart size={13} className="mx-0.5 inline text-tone-negative" /> ikonu na bilo kom
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
              /* Same card as the feed, with the remove button in place of detail links. */
              <article key={car.id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-surface bg-card-surface transition-all duration-200 hover:border-brand-500/30 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="relative aspect-[16/9] w-full flex-shrink-0 overflow-hidden">
                  <Link href={`/car/${car.id}`} className="block h-full w-full">
                    <img
                      src={car.image}
                      alt={`${car.brand} ${car.model}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  </Link>
                  {!car.ownerId && (
                    <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                      Demo
                    </span>
                  )}
                  <button
                    onClick={() => remove(car)}
                    aria-label={`Ukloni ${car.brand} ${car.model} iz sačuvanih`}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:text-tone-negative"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
                  <div className="min-w-0">
                    <Link href={`/car/${car.id}`}>
                      <h2 className="line-clamp-2 min-h-10 font-bold text-base leading-tight text-app-primary transition-colors hover:text-brand-text dark:text-zinc-100">
                        {car.year} {car.brand} {car.model}
                      </h2>
                    </Link>
                    <p className="mt-0.5 min-h-4 truncate text-xs text-app-muted">{carSubtitle(car)}</p>

                    <div className="mt-2.5 flex min-h-5 flex-wrap content-start items-center gap-x-2.5 gap-y-1.5 text-[11px] text-app-secondary dark:text-zinc-400">
                      <span className="flex min-w-0 items-center gap-1"><Gauge size={12} className="shrink-0 text-app-muted" /><span className="truncate">{formatKm(car.mileage)}</span></span>
                      <span className="text-app-muted/60" aria-hidden="true">·</span>
                      <span className="flex min-w-0 items-center gap-1"><Fuel size={12} className="shrink-0 text-app-muted" /><span className="truncate">{fuelLabel(car.specs.fuelType)}</span></span>
                      <span className="text-app-muted/60" aria-hidden="true">·</span>
                      <span className="flex min-w-0 items-center gap-1"><MapPin size={12} className="shrink-0 text-app-muted" /><span className="truncate">{car.city}</span></span>
                    </div>
                  </div>

                  <div className="mt-auto pt-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="shrink-0 text-lg font-bold tracking-tight text-app-primary dark:text-zinc-100">{formatEuro(car.price)}</p>
                      {tl && (
                        <span className={`inline-flex min-w-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${tl.bg} ${tl.color}`}>
                          <span className="truncate">{tl.label}</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => openOffer(car)}
                      className="btn-primary btn-primary-compact mt-3 flex w-full items-center justify-center gap-1.5 text-sm"
                    >
                      <ArrowLeftRight size={15} className="shrink-0" />
                      Pošalji ponudu
                    </button>
                    <Link
                      href={`/car/${car.id}`}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-surface bg-elevated px-4 py-2.5 text-sm font-semibold text-app-secondary transition-colors hover:bg-hover-surface hover:text-app-primary dark:border-zinc-800"
                    >
                      Pogledaj oglas
                    </Link>
                  </div>
                </div>
              </article>
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
          <div className="relative w-full max-w-sm rounded-2xl border border-surface dark:border-zinc-800 bg-card-surface dark:bg-zinc-900 p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
              <TriangleAlert size={22} className="text-tone-negative" />
            </div>
            <h3 id="clear-title" className="text-center text-base font-bold text-app-primary dark:text-zinc-100">
              Obrisati celu listu?
            </h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-app-secondary dark:text-zinc-400">
              {savedCars.length} sačuvanih oglasa biće uklonjeno.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary dark:text-zinc-100 transition-colors hover:bg-hover-surface"
              >
                Odustani
              </button>
              <button
                onClick={clearAll}
                className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-bold text-white transition-colors hover:bg-rose-400"
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
