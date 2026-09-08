'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, X, MapPin, Gauge, Fuel, Phone, BookmarkX, ArrowRight, ArrowLeftRight, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { MARKETPLACE_CARS, formatEuro, formatKm } from '@/lib/cars';
import { getTradeLabel } from '@/lib/trade';
import { fuelLabel, bodyLabel } from '@/lib/labels';
import { useSaved } from '@/hooks/use-saved';
import { useGarage } from '@/hooks/use-garage';
import { useAuth } from '@/hooks/use-auth';
import { TradeOfferSheet } from '@/components/TradeOfferSheet';
import { Car } from '@/types';

export default function SavedClient() {
  const { saved: savedIds, remove: removeSaved, save, clear, mounted } = useSaved();
  const { selectedCar } = useGarage();
  const { isLoggedIn, mounted: authReady, requireAuth } = useAuth();
  const [offerCar, setOfferCar] = useState<Car | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const showTrade = authReady && isLoggedIn;

  // Keep the order the user saved them in.
  const savedCars: Car[] = savedIds
    .map(id => MARKETPLACE_CARS.find(c => c.id === id))
    .filter((c): c is Car => Boolean(c));

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
        <header className="sticky top-0 z-40 border-b border-surface bg-app px-4 py-4 safe-top">
          <h1 className="text-xl font-bold tracking-tight text-app-primary">Sačuvano</h1>
        </header>
        <div className="space-y-3 px-4 pt-6">
          <div className="h-56 animate-pulse rounded-2xl bg-card-surface" />
          <div className="h-56 animate-pulse rounded-2xl bg-card-surface" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 border-b border-surface bg-app px-4 py-4 safe-top">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-app-primary">Sačuvano</h1>
            <p className="mt-0.5 text-xs text-app-muted">
              {savedCars.length === 0
                ? 'Tvoja lista želja'
                : `${savedCars.length} ${savedCars.length === 1 ? 'oglas' : 'oglasa'}`}
            </p>
          </div>
          {savedCars.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-app-muted transition-colors hover:bg-rose-500/10 hover:text-rose-400"
            >
              Obriši sve
            </button>
          )}
        </div>
      </header>

      <div className="space-y-3 px-4 pb-4 pt-4">
        {savedCars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-elevated/60">
              <BookmarkX size={36} className="text-app-muted" />
            </div>
            <p className="text-base font-semibold text-app-secondary">Nema sačuvanih oglasa</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-app-muted">
              Pritisni <Heart size={13} className="mx-0.5 inline text-rose-400" /> ikonu na bilo kom
              oglasu da ga sačuvaš ovde.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-400"
            >
              Pregledaj oglase
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          savedCars.map(car => {
            const tl = showTrade ? getTradeLabel(selectedCar, car) : null;
            return (
              <article
                key={car.id}
                className="overflow-hidden rounded-2xl border border-surface bg-card-surface"
              >
                <div className="relative h-40">
                  <Link href={`/car/${car.id}`} className="block h-full">
                    <img
                      src={car.image}
                      alt={`${car.brand} ${car.model}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                        {bodyLabel(car.bodyType)}
                      </p>
                      <h2 className="text-base font-bold text-white">
                        {car.year} {car.brand} {car.model}
                      </h2>
                    </div>
                  </Link>

                  <button
                    onClick={() => remove(car)}
                    aria-label={`Ukloni ${car.brand} ${car.model} iz sačuvanih`}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition-colors hover:text-rose-400"
                  >
                    <X size={15} />
                  </button>

                  {tl && (
                    <span
                      className={`absolute bottom-3 right-3 rounded-full border px-2 py-0.5 text-[10px] font-bold ${tl.bg} ${tl.color}`}
                    >
                      {tl.label}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-app-secondary">
                      <span className="flex items-center gap-1">
                        <Gauge size={12} className="text-app-muted" />
                        {formatKm(car.mileage)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Fuel size={12} className="text-app-muted" />
                        {fuelLabel(car.specs.fuelType)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-app-muted" />
                        {car.city}
                      </span>
                    </div>
                    <p className="flex-shrink-0 font-bold text-orange-400">{formatEuro(car.price)}</p>
                  </div>

                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-app-secondary">
                    {car.description}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (
                          !requireAuth('Prijavi se da pošalješ ponudu za zamenu', () =>
                            setOfferCar(car),
                          )
                        ) {
                          return;
                        }
                        setOfferCar(car);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-orange-400 active:scale-95"
                    >
                      <ArrowLeftRight size={14} />
                      Pošalji ponudu
                    </button>
                    <Link
                      href={`/car/${car.id}`}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-elevated px-3 py-2.5 text-sm font-semibold text-app-secondary transition-all duration-200 hover:bg-hover-surface"
                    >
                      Detalji
                    </Link>
                    <a
                      href={`tel:${car.owner.phone}`}
                      aria-label={`Pozovi ${car.owner.name}`}
                      className="flex w-11 items-center justify-center rounded-xl bg-elevated text-app-secondary transition-all duration-200 hover:bg-hover-surface"
                    >
                      <Phone size={14} />
                    </a>
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
          <div className="relative w-full max-w-sm rounded-2xl border border-surface bg-card-surface p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
              <TriangleAlert size={22} className="text-rose-400" />
            </div>
            <h3 id="clear-title" className="text-center text-base font-bold text-app-primary">
              Obrisati celu listu?
            </h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-app-secondary">
              {savedCars.length} sačuvanih oglasa biće uklonjeno.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary transition-colors hover:bg-hover-surface"
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
