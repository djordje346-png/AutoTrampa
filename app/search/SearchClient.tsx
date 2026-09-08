'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, MapPin, Gauge, Fuel, SlidersHorizontal, X, ArrowRight, Heart, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { MARKETPLACE_CARS, formatEuro, formatKm } from '@/lib/cars';
import { getTradeLabel } from '@/lib/trade';
import { fuelLabel, bodyLabel } from '@/lib/labels';
import { useGarage } from '@/hooks/use-garage';
import { useSaved } from '@/hooks/use-saved';
import { useAuth } from '@/hooks/use-auth';
import { useSearchPrefs } from '@/hooks/use-search-prefs';
import { TradeOfferSheet } from '@/components/TradeOfferSheet';
import { BodyType, Car } from '@/types';

const BODY_TYPES: BodyType[] = ['Sedan', 'Caravan', 'Hatchback', 'SUV'];

export default function SearchClient() {
  const { selectedCar, mounted } = useGarage();
  const { isSaved, toggleSave } = useSaved();
  const { isLoggedIn, mounted: authReady, requireAuth } = useAuth();
  const showTrade = authReady && isLoggedIn;
  const { prefs, update } = useSearchPrefs();
  const [query, setQuery] = useState('');
  const [offerCar, setOfferCar] = useState<Car | null>(null);

  const { bodyType: activeType, sortBy } = prefs;
  const setActiveType = (next: BodyType | null) => update({ bodyType: next });
  const setSortBy = (next: typeof prefs.sortBy) => update({ sortBy: next });

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = MARKETPLACE_CARS.filter(car => {
      const matchesQuery =
        !q ||
        car.brand.toLowerCase().includes(q) ||
        car.model.toLowerCase().includes(q) ||
        car.city.toLowerCase().includes(q) ||
        car.generation.toLowerCase().includes(q);
      const matchesType = !activeType || car.bodyType === activeType;
      return matchesQuery && matchesType;
    });

    // A stored "best trade" sort must not survive signing out.
    const effectiveSort = sortBy === 'trade' && !showTrade ? 'price-asc' : sortBy;

    const sorted = [...filtered];
    switch (effectiveSort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'year-desc':
        sorted.sort((a, b) => b.year - a.year);
        break;
      case 'trade':
        sorted.sort((a, b) => Math.abs(a.price - selectedCar.price) - Math.abs(b.price - selectedCar.price));
        break;
    }
    return sorted;
  }, [query, activeType, sortBy, selectedCar, showTrade]);

  const hasFilters = query || activeType;

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-app border-b border-surface px-4 pt-4 pb-3 safe-top">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold tracking-tight text-app-primary">Pretraga</h1>
          {mounted && showTrade && (
            <Link
              href="/garage"
              className="flex items-center gap-1.5 text-xs text-app-muted hover:text-orange-400 transition-colors"
            >
              <TrendingUp size={13} className="text-orange-400" />
              {selectedCar.brand} {selectedCar.model}
            </Link>
          )}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Marka, model, grad..."
            className="w-full bg-elevated border border-surface rounded-xl pl-9 pr-9 py-2.5 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:border-orange-500 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-secondary transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
          <button
            onClick={() => setActiveType(null)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
              !activeType
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'bg-elevated border-surface text-app-secondary hover:border-orange-500/40'
            }`}
          >
            <SlidersHorizontal size={11} />
            Sve
          </button>
          {BODY_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(activeType === type ? null : type)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                activeType === type
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-elevated border-surface text-app-secondary hover:border-orange-500/40'
              }`}
            >
              {bodyLabel(type)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-[10px] text-app-muted font-medium uppercase tracking-wider flex-shrink-0">Sortiraj:</span>
          {([
            ...(showTrade ? [{ key: 'trade', label: 'Najbolja zamena' }] as const : []),
            { key: 'price-asc', label: 'Cena ↑' },
            { key: 'price-desc', label: 'Cena ↓' },
            { key: 'year-desc', label: 'Najnovije' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-all ${
                (sortBy === key || (sortBy === 'trade' && !showTrade && key === 'price-asc'))
                  ? 'text-orange-400 bg-orange-500/10'
                  : 'text-app-muted hover:text-app-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs text-app-muted">
          {results.length === 0 ? 'Nema rezultata' : `${results.length} rezultata`}
        </p>
        {hasFilters && (
          <button
            onClick={() => { setQuery(''); setActiveType(null); }}
            className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
          >
            <X size={12} />
            Očisti
          </button>
        )}
      </div>

      <div className="px-4 space-y-3 pb-4">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4">
              <Search size={28} className="text-app-muted" />
            </div>
            <p className="text-app-secondary font-medium">Nema pronađenih vozila</p>
            <p className="text-app-muted text-sm mt-1">Pokušaj sa drugim terminom</p>
          </div>
        ) : (
          results.map(car => {
            const tl = showTrade ? getTradeLabel(selectedCar, car) : null;
            const saved = isSaved(car.id);
            return (
              <article
                key={car.id}
                className="overflow-hidden rounded-2xl border border-surface bg-card-surface transition-all duration-200 hover:border-orange-500/30"
              >
                <div className="flex">
                  <Link
                    href={`/car/${car.id}`}
                    className="relative w-28 flex-shrink-0"
                    aria-label={`Detalji: ${car.year} ${car.brand} ${car.model}`}
                  >
                    <img
                      src={car.image}
                      alt={`${car.brand} ${car.model}`}
                      className="h-full w-full object-cover"
                    />
                    {tl && (
                      <span
                        className={`absolute bottom-1 left-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${tl.bg} ${tl.color}`}
                      >
                        {tl.short}
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/car/${car.id}`} className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                          {bodyLabel(car.bodyType)}
                        </p>
                        <h3 className="truncate text-sm font-bold leading-tight text-app-primary transition-colors hover:text-orange-400">
                          {car.year} {car.brand} {car.model}
                        </h3>
                        <p className="text-xs text-app-muted">{car.generation}</p>
                      </Link>
                      <div className="flex flex-shrink-0 items-start gap-2">
                        <p className="text-sm font-bold text-orange-400">{formatEuro(car.price)}</p>
                        <button
                          onClick={() => toggleSave(car.id)}
                          aria-label={saved ? 'Ukloni iz sačuvanih' : 'Sačuvaj oglas'}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                            saved
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'text-app-muted hover:bg-hover-surface hover:text-rose-400'
                          }`}
                        >
                          <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2.5">
                      <span className="flex items-center gap-1 text-[11px] text-app-secondary">
                        <Gauge size={11} className="text-app-muted" />
                        {formatKm(car.mileage)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-app-secondary">
                        <Fuel size={11} className="text-app-muted" />
                        {car.specs.displacement} {fuelLabel(car.specs.fuelType)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-app-secondary">
                        <MapPin size={11} className="text-app-muted" />
                        {car.city}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
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
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2 text-[11px] font-bold text-white transition-all duration-200 hover:bg-orange-400 active:scale-95"
                      >
                        <ArrowLeftRight size={12} />
                        Pošalji ponudu
                      </button>
                      <Link
                        href={`/car/${car.id}`}
                        className="flex items-center justify-center gap-1 rounded-lg bg-elevated px-3 py-2 text-[11px] font-semibold text-app-secondary transition-all hover:bg-hover-surface"
                      >
                        Detalji
                        <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <TradeOfferSheet car={offerCar} myCar={selectedCar} onClose={() => setOfferCar(null)} />
    </div>
  );
}
