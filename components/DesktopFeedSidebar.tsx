'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { CarFront, Check, ChevronDown, Fuel, Pencil, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { DesktopCompactFilterGroups } from '@/components/FilterPanel';
import { usePreferences } from '@/hooks/use-preferences';
import { countActiveFilters, type SearchFilters, type TradeFilter } from '@/hooks/use-search-prefs';
import { formatEuro } from '@/lib/cars';
import { fuelLabel } from '@/lib/labels';
import { displayValue } from '@/lib/car-row';
import { getSerbianPlace } from '@/lib/city-coordinates';
import type { MyGarageCar } from '@/types';

interface TradeOption {
  key: TradeFilter;
  label: string;
}

interface DesktopFeedSidebarProps {
  cars: MyGarageCar[];
  selectedCar: MyGarageCar | null;
  selectedId: string;
  selectCar: (id: string) => void;
  canAddCar: boolean;
  onAddCar: () => void;
  filters: SearchFilters;
  updateFilters: (patch: Partial<SearchFilters>) => void;
  onTradeChange: (trade: TradeFilter) => void;
  onResetFilters: () => void;
  tradeOptions: TradeOption[];
  showTrade: boolean;
}

const SECTION_TITLE = 'text-[11px] font-bold text-app-primary dark:text-zinc-100';
const SURFACE = 'rounded-xl border border-surface bg-card-surface p-3 dark:border-zinc-800 dark:bg-zinc-900';

export function DesktopFeedSidebar({
  cars,
  selectedCar,
  selectedId,
  selectCar,
  canAddCar,
  onAddCar,
  filters,
  updateFilters,
  onTradeChange,
  onResetFilters,
  tradeOptions,
  showTrade,
}: DesktopFeedSidebarProps) {
  const { preferences, update, mounted: preferencesReady } = usePreferences();
  const [carPickerOpen, setCarPickerOpen] = useState(false);
  const [budgetEditorOpen, setBudgetEditorOpen] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [radiusDraft, setRadiusDraft] = useState(preferences.radius);
  const activeFilters = countActiveFilters(filters);

  useEffect(() => {
    setBudgetDraft(preferences.budget == null ? '' : String(preferences.budget));
  }, [preferences.budget]);

  useEffect(() => {
    setRadiusDraft(preferences.radius);
  }, [preferences.radius]);

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = budgetDraft.trim();
    const value = raw === '' ? null : Number(raw);
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100000)) {
      toast.error('Unesi iznos između 0 i 100.000 €.');
      return;
    }

    const result = await update({ budget: value });
    if (!result.ok) {
      toast.error(result.message || 'Budžet nije sačuvan. Pokušaj ponovo.');
      return;
    }
    setBudgetEditorOpen(false);
  }

  async function saveRadiusDraft() {
    if (radiusDraft === preferences.radius) return;
    const result = await update({ radius: radiusDraft });
    if (!result.ok) {
      setRadiusDraft(preferences.radius);
      toast.error(result.message || 'Radius pretrage nije sačuvan. Pokušaj ponovo.');
    }
  }

  return (
    <aside className="hidden h-fit max-h-[calc(100vh-6rem)] w-64 flex-shrink-0 flex-col gap-2 overflow-y-auto overscroll-contain pb-2 lg:sticky lg:top-24 lg:flex desktop:hidden">
      <section className={SURFACE} aria-labelledby="desktop-my-car-title">
        <p id="desktop-my-car-title" className={SECTION_TITLE}>Moj auto</p>

        {selectedCar ? (
          <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-surface bg-elevated p-2 dark:border-zinc-800">
            <div className="h-10 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-card-surface">
              {selectedCar.image ? (
                <img src={selectedCar.image} alt={`${selectedCar.brand} ${selectedCar.model}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-app-muted"><CarFront size={20} /></div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-app-primary dark:text-zinc-100">
                {selectedCar.brand} {selectedCar.model}
              </p>
              <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-[9px] text-app-muted">
                <span>{selectedCar.year}</span>
                <span aria-hidden="true">·</span>
                <Fuel size={11} className="flex-shrink-0" />
                <span className="truncate">{fuelLabel(selectedCar.specs.fuelType)}</span>
              </p>
              <p className="mt-0.5 truncate text-[9px] text-app-muted">
                {selectedCar.mileage.toLocaleString('sr-RS')} km · {selectedCar.specs.power}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-elevated p-3 dark:bg-zinc-950">
            <p className="text-xs font-semibold text-app-primary dark:text-zinc-100">Nemaš dodat auto</p>
            <p className="mt-1 text-[11px] leading-relaxed text-app-muted">Dodaj vozilo da vidiš kako se vrednosti uklapaju.</p>
          </div>
        )}

        {cars.length > 1 && selectedCar && (
          <button
            type="button"
            onClick={() => setCarPickerOpen((open) => !open)}
            className="mt-2 flex w-full items-center justify-between rounded-lg border border-surface bg-card-surface px-2.5 py-2 text-[10px] font-semibold text-app-secondary transition-colors hover:border-brand-500/40 dark:border-zinc-800 dark:text-zinc-300"
            aria-expanded={carPickerOpen}
          >
            Promeni auto
            <ChevronDown size={14} className={`transition-transform ${carPickerOpen ? 'rotate-180' : ''}`} />
          </button>
        )}

        {carPickerOpen && (
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
            {cars.map((car) => {
              const active = car.id === selectedId;
              return (
                <button
                  type="button"
                  key={car.id}
                  onClick={() => {
                    selectCar(car.id);
                    setCarPickerOpen(false);
                  }}
                  className={`flex w-full min-w-0 items-center gap-2 rounded-xl p-2 text-left transition-colors ${active ? 'bg-brand-500/10' : 'hover:bg-elevated dark:hover:bg-zinc-950'}`}
                >
                  <span className="h-9 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-elevated">
                    {car.image && <img src={car.image} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold text-app-primary dark:text-zinc-100">
                      {car.brand} {car.model} {displayValue(car.generation)}
                    </span>
                    <span className="block text-[10px] text-app-muted">{car.year} · {formatEuro(car.price)}</span>
                  </span>
                  {active && <Check size={14} className="flex-shrink-0 text-brand-text" />}
                </button>
              );
            })}
          </div>
        )}

        {canAddCar && (
          <button
            type="button"
            onClick={onAddCar}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-surface py-2 text-xs font-semibold text-brand-text transition-colors hover:bg-brand-500/5 dark:border-zinc-800"
          >
            <Plus size={14} />
            Dodaj auto
          </button>
        )}
      </section>

      {showTrade && (
        <section className={SURFACE} aria-labelledby="desktop-trade-type-title">
          <p id="desktop-trade-type-title" className={SECTION_TITLE}>Tip zamene</p>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {tradeOptions.map(({ key, label }) => (
              <button
                type="button"
                key={key}
                onClick={() => onTradeChange(key)}
                aria-pressed={filters.trade === key}
                className={`min-h-8 rounded-full border px-2 py-1 text-[9px] font-semibold leading-tight transition-colors ${
                  filters.trade === key
                    ? 'border-brand-500 bg-brand-500 text-black'
                    : 'border-surface bg-elevated text-app-secondary hover:border-brand-500/40 dark:border-zinc-800 dark:text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={SURFACE} aria-labelledby="desktop-preferences-title">
        <p id="desktop-preferences-title" className={SECTION_TITLE}>Tvoje preference</p>
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-app-primary dark:text-zinc-100">Budžet za doplatu</p>
            <p className="mt-1 truncate text-sm font-bold text-brand-text">
              {!preferencesReady ? 'Učitavanje…' : preferences.noTopUp ? 'Bez doplate' : preferences.budget == null ? 'Nije postavljen' : `do ${formatEuro(preferences.budget)}`}
            </p>
            <p className="mt-1 text-[10px] text-app-muted">Koristi se za preporuke</p>
          </div>
          {preferencesReady && !preferences.noTopUp && (
            <button
              type="button"
              onClick={() => setBudgetEditorOpen((open) => !open)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-elevated hover:text-brand-text dark:hover:bg-zinc-950"
              aria-label={budgetEditorOpen ? 'Zatvori izmenu budžeta' : 'Izmeni budžet'}
              aria-expanded={budgetEditorOpen}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {budgetEditorOpen && (
          <form onSubmit={saveBudget} className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100000}
              step={500}
              inputMode="numeric"
              value={budgetDraft}
              onChange={(event) => setBudgetDraft(event.target.value)}
              placeholder="Iznos u €"
              aria-label="Budžet za doplatu u evrima"
              className="h-9 min-w-0 flex-1 rounded-xl border border-surface bg-elevated px-2.5 text-xs text-app-primary outline-none focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button type="submit" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-black transition-colors hover:bg-brand-400" aria-label="Sačuvaj budžet">
              <Check size={16} />
            </button>
          </form>
        )}

        <div className="mt-3 border-t border-surface pt-3 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-app-primary dark:text-zinc-100">Radius pretrage</p>
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-bold text-brand-text">
              {preferencesReady ? `${radiusDraft >= 200 ? "200+" : radiusDraft} km` : 'Učitavanje…'}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            step={10}
            value={radiusDraft}
            disabled={!preferencesReady}
            onChange={(event) => setRadiusDraft(Number(event.target.value))}
            onPointerUp={() => void saveRadiusDraft()}
            onKeyUp={(event) => {
              if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
                void saveRadiusDraft();
              }
            }}
            aria-label="Radius pretrage u kilometrima"
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-elevated accent-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-2 text-[10px] text-app-muted">
            {!selectedCar?.city || selectedCar.city === '-'
              ? 'Izaberi grad svog auta u garaži.'
              : getSerbianPlace(selectedCar.city)
                ? `Centar: ${getSerbianPlace(selectedCar.city)?.name}`
                : 'Za grad ovog auta nema procene udaljenosti.'}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-app-muted">
            Prvo prikazujemo oglase iz ovog kruga. Ako ih nema dovoljno, proširujemo pretragu na najbliža naselja.
          </p>
        </div>
      </section>

      <section className={SURFACE} aria-labelledby="desktop-filters-title">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p id="desktop-filters-title" className="text-sm font-bold text-app-primary dark:text-zinc-100">Filteri</p>
            {activeFilters > 0 && (
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-text">{activeFilters}</span>
            )}
          </div>
          {activeFilters > 0 && (
            <button type="button" onClick={onResetFilters} className="flex items-center gap-1 text-[11px] font-semibold text-app-muted transition-colors hover:text-brand-text">
              <RotateCcw size={11} />
              Očisti sve
            </button>
          )}
        </div>
        <DesktopCompactFilterGroups filters={filters} update={updateFilters} />
      </section>
    </aside>
  );
}
