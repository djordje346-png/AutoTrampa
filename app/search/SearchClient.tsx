'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Gauge, Fuel, SlidersHorizontal, X, ArrowRight, Heart, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatEuro, formatKm } from '@/lib/cars';
import { getTradeLabel } from '@/lib/trade';
import { fuelLabel, bodyLabel } from '@/lib/labels';
import { useGarage } from '@/hooks/use-garage';
import { useSaved } from '@/hooks/use-saved';
import { useAuth } from '@/hooks/use-auth';
import { countActiveFilters, useSearchPrefs } from '@/hooks/use-search-prefs';
import { filterCars } from '@/hooks/use-filtered-cars';
import { usePreferences } from '@/hooks/use-preferences';
import { useMarketplace } from '@/hooks/use-marketplace';
import { displayValue } from '@/lib/car-row';
import { BottomSheet } from '@/components/BottomSheet';
import { FilterSheetBody, FilterSidebar } from '@/components/FilterPanel';
import { TradeOfferSheet } from '@/components/TradeOfferSheet';
import { Car } from '@/types';

export default function SearchClient() {
  const { selectedCar, mounted } = useGarage();
  const { cars: marketplaceCars } = useMarketplace();
  const { isSaved, toggleSave } = useSaved();
  const { isLoggedIn, mounted: authReady, requireAuth } = useAuth();
  // Trade sorting and labelling need the user's own car; without one there is
  // no difference to compute.
  const showTrade = authReady && isLoggedIn && selectedCar !== null;
  const { filters, update: updateFilters, reset: resetFilters, filtersOpen, setFiltersOpen } = useSearchPrefs();
  const { preferences } = usePreferences();
  const [offerCar, setOfferCar] = useState<Car | null>(null);
  const router = useRouter();

  /**
   * A stored "best trade" ordering must not survive signing out or emptying the
   * garage, so it falls back to price when there is nothing to compare against.
   */
  const effectiveSort = filters.sortBy === 'trade' && selectedCar === null ? 'price-asc' : filters.sortBy;

  const results = useMemo(
    () =>
      filterCars(
        marketplaceCars,
        { ...filters, sortBy: effectiveSort },
        selectedCar,
        preferences.budget,
        preferences.noTopUp,
      ),
    [marketplaceCars, filters, effectiveSort, selectedCar, preferences.budget, preferences.noTopUp],
  );

  const hasFilters =
    filters.query.trim() !== '' || countActiveFilters(filters) > 0;

  return (
    <div className="flex flex-col">
      <header className="app-page-header safe-top">
        <div className="app-container pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-zinc-100">Pretraga</h1>
          {mounted && showTrade && selectedCar && (
            <Link
              href="/garage"
              className="flex items-center gap-1.5 text-xs text-app-muted hover:text-brand-text transition-colors"
            >
              <TrendingUp size={13} className="text-brand-text" />
              {selectedCar.brand} {selectedCar.model}
            </Link>
          )}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            value={filters.query}
            onChange={e => updateFilters({ query: e.target.value })}
            placeholder="Marka, model, grad..."
            className="w-full bg-elevated border border-surface dark:border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-app-primary dark:text-zinc-100 placeholder:text-app-muted focus:outline-none focus:border-brand-500 transition-colors"
          />
          {filters.query && (
            <button
              onClick={() => updateFilters({ query: '' })}
              aria-label="Obriši pretragu"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-secondary dark:text-zinc-400 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {isLoggedIn && (
            <button
              onClick={() => setFiltersOpen(true)}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-surface bg-elevated px-3 py-1.5 text-xs font-semibold text-app-secondary transition-colors hover:border-brand-500/40 dark:border-zinc-800 lg:hidden"
            >
              <SlidersHorizontal size={12} />
              Filteri
              {countActiveFilters(filters) > 0 && (
                <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-black">
                  {countActiveFilters(filters)}
                </span>
              )}
            </button>
          )}

          <span className="flex-shrink-0 text-[10px] text-app-muted font-medium uppercase tracking-wider">Sortiraj:</span>
          {([
            ...(showTrade ? [{ key: 'trade', label: 'Najbolja zamena' }] as const : []),
            { key: 'price-asc', label: 'Cena ↑' },
            { key: 'price-desc', label: 'Cena ↓' },
            { key: 'year-desc', label: 'Najnovije' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => updateFilters({ sortBy: key })}
              className={`flex-shrink-0 whitespace-nowrap text-[11px] font-semibold px-2 py-1 rounded-lg transition-all ${
                (filters.sortBy === key || (filters.sortBy === 'trade' && !showTrade && key === 'price-asc'))
                  ? 'text-brand-text bg-brand-500/10'
                  : 'text-app-muted hover:text-app-secondary dark:text-zinc-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        </div>
      </header>

      <div className="app-container pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs text-app-muted">
          {results.length === 0 ? 'Nema rezultata' : `${results.length} rezultata`}
        </p>
        {hasFilters && (
          <button
            onClick={() => resetFilters()}
            className="text-xs text-brand-text hover:text-brand-text transition-colors flex items-center gap-1"
          >
            <X size={12} />
            Očisti
          </button>
        )}
      </div>

      <div className="app-container flex flex-col gap-5 pt-3 lg:flex-row lg:items-start">
        {/* Filters are for signed-in users; browsing stays open to everyone. */}
        {isLoggedIn && (
          <FilterSidebar
            filters={filters}
            update={updateFilters}
            onReset={resetFilters}
            showTrade={showTrade}
            className="w-full lg:sticky lg:top-40 lg:w-64 lg:flex-shrink-0"
          />
        )}

        <div className="min-w-0 flex-1 space-y-3 pb-4">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4">
              <Search size={28} className="text-app-muted" />
            </div>
            <p className="text-app-secondary dark:text-zinc-400 font-medium">Nema pronađenih vozila</p>
            <p className="text-app-muted text-sm mt-1">Pokušaj sa drugim terminom</p>
          </div>
        ) : (
          results.map(car => {
            const tl = showTrade ? getTradeLabel(selectedCar!, car) : null;
            const saved = isSaved(car.id);
            return (
              <article
                key={car.id}
                className="overflow-hidden rounded-2xl border border-surface dark:border-zinc-800 bg-card-surface dark:bg-zinc-900 transition-all duration-200 hover:border-brand-500/30"
              >
                <div className="flex flex-col sm:flex-row">
                  <Link
                    href={`/car/${car.id}`}
                    className="relative h-36 w-full flex-shrink-0 sm:h-auto sm:w-28"
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
                    {!car.ownerId && (
                      <span className="absolute left-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        Demo
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/car/${car.id}`} className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text">
                          {bodyLabel(car.bodyType)}
                        </p>
                        <h3 className="truncate text-sm font-bold leading-tight text-app-primary dark:text-zinc-100 transition-colors hover:text-brand-text">
                          {car.year} {car.brand} {car.model}
                        </h3>
                        <p className="text-xs text-app-muted">{displayValue(car.generation)}</p>
                      </Link>
                      <div className="flex flex-shrink-0 items-start gap-2">
                        <p className="text-sm font-bold text-app-primary">{formatEuro(car.price)}</p>
                        <button
                          onClick={() => toggleSave(car.id)}
                          aria-label={saved ? 'Ukloni iz sačuvanih' : 'Sačuvaj oglas'}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                            saved
                              ? 'bg-rose-500/10 text-tone-negative'
                              : 'text-app-muted hover:bg-hover-surface hover:text-tone-negative'
                          }`}
                        >
                          <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2.5">
                      <span className="flex items-center gap-1 text-[11px] text-app-secondary dark:text-zinc-400">
                        <Gauge size={11} className="text-app-muted" />
                        {formatKm(car.mileage)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-app-secondary dark:text-zinc-400">
                        <Fuel size={11} className="text-app-muted" />
                        {car.specs.displacement} {fuelLabel(car.specs.fuelType)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-app-secondary dark:text-zinc-400">
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
                          // The offer sheet needs a car of your own to state a
                          // difference; without one it stays shut, so say why.
                          if (!selectedCar) {
                            toast.error('Prvo dodaj svoj auto u garažu.', {
                              description: 'Ponuda je razlika između tvog i ovog vozila.',
                              action: { label: 'Garaža', onClick: () => router.push('/garage') },
                            });
                            return;
                          }
                          setOfferCar(car);
                        }}
                        className="btn-primary btn-primary-compact flex-1 text-[11px]"
                      >
                        <ArrowLeftRight size={12} />
                        Pošalji ponudu
                      </button>
                      <Link
                        href={`/car/${car.id}`}
                        className="flex items-center justify-center gap-1 rounded-lg bg-elevated px-3 py-2 text-[11px] font-semibold text-app-secondary dark:text-zinc-400 transition-all hover:bg-hover-surface"
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
      </div>

      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filteri"
        className="sm:max-w-lg"
      >
        <FilterSheetBody
          filters={filters}
          update={updateFilters}
          onReset={resetFilters}
          showTrade={showTrade}
        />
        <button
          onClick={() => setFiltersOpen(false)}
          className="mt-6 w-full rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary dark:text-zinc-100 transition-colors hover:bg-hover-surface"
        >
          Prikaži {results.length} {results.length === 1 ? 'oglas' : 'oglasa'}
        </button>
      </BottomSheet>

      <TradeOfferSheet car={offerCar} myCar={selectedCar} onClose={() => setOfferCar(null)} />
    </div>
  );
}
