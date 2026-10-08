'use client';

import { useState } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { BRAND_NAMES } from '@/lib/car-brands';
import { bodyLabel, fuelLabel } from '@/lib/labels';
import { type BodyType, type FuelType } from '@/types';
import { countActiveFilters, type SearchFilters } from '@/hooks/use-search-prefs';

/**
 * The app's filter UI, defined once and rendered two ways: a sticky column on
 * desktop, a bottom sheet on mobile. One definition means a filter can never
 * exist in one layout and be missing in the other.
 *
 * Every control is a button that shows its own selected state, and numeric
 * bounds are typed inputs — no "apply" step, because the list updates as you go.
 */

interface FilterGroupsProps {
  filters: SearchFilters;
  update: (patch: Partial<SearchFilters>) => void;
  /** Trade options only make sense once the user has a car to compare against. */
  showTrade: boolean;
}

const TRADE_OPTIONS: { key: SearchFilters['trade']; label: string }[] = [
  { key: 'all', label: 'Sve' },
  { key: 'similar', label: 'Slična vrednost' },
  { key: 'cheaper', label: 'Vlasnik doplaćuje' },
  { key: 'expensive', label: 'Ja doplaćujem' },
];

const BODY_TYPES: BodyType[] = ['Sedan', 'Caravan', 'Hatchback', 'SUV', 'Coupe', 'Convertible'];
const FUEL_TYPES: FuelType[] = ['Diesel', 'Petrol', 'Hybrid', 'Electric'];

const GROUP_TITLE = 'text-[11px] font-bold uppercase tracking-widest text-app-muted';
const CHIP_BASE = 'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors';
const CHIP_ON = 'border-brand-500 bg-brand-500 text-black';
const CHIP_OFF = 'border-surface bg-elevated text-app-secondary hover:border-brand-500/40 dark:border-zinc-800';
const NUM_INPUT =
  'h-10 w-full rounded-xl border border-surface bg-elevated px-3 text-sm text-app-primary outline-none transition-colors placeholder:text-app-muted focus:border-brand-500 dark:border-zinc-800 dark:text-zinc-100';

export function FilterGroups({ filters, update, showTrade }: FilterGroupsProps) {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const brands = showAllBrands ? BRAND_NAMES : BRAND_NAMES.slice(0, 10);

  return (
    <div className="space-y-5">
      {showTrade && (
        <section>
          <p className={GROUP_TITLE}>Vrednost zamene</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TRADE_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => update({ trade: key })}
                className={`${CHIP_BASE} ${filters.trade === key ? CHIP_ON : CHIP_OFF}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className={GROUP_TITLE}>Marka</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => update({ brand: null })}
            className={`${CHIP_BASE} ${filters.brand === null ? CHIP_ON : CHIP_OFF}`}
          >
            Sve marke
          </button>
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => update({ brand: filters.brand === brand ? null : brand })}
              className={`${CHIP_BASE} ${filters.brand === brand ? CHIP_ON : CHIP_OFF}`}
            >
              {brand}
            </button>
          ))}
        </div>
        {BRAND_NAMES.length > 10 && (
          <button
            onClick={() => setShowAllBrands((v) => !v)}
            className="mt-2 text-[11px] font-semibold text-brand-text hover:underline"
          >
            {showAllBrands ? 'Prikaži manje' : `Prikaži sve (${BRAND_NAMES.length})`}
          </button>
        )}
      </section>

      <section>
        <p className={GROUP_TITLE}>Karoserija</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {BODY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => update({ bodyType: filters.bodyType === type ? null : type })}
              className={`${CHIP_BASE} ${filters.bodyType === type ? CHIP_ON : CHIP_OFF}`}
            >
              {bodyLabel(type)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className={GROUP_TITLE}>Gorivo</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FUEL_TYPES.map((fuel) => (
            <button
              key={fuel}
              onClick={() => update({ fuelType: filters.fuelType === fuel ? null : fuel })}
              className={`${CHIP_BASE} ${filters.fuelType === fuel ? CHIP_ON : CHIP_OFF}`}
            >
              {fuelLabel(fuel)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className={GROUP_TITLE}>Cena (€)</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="od"
            value={filters.priceMin ?? ''}
            onChange={(e) => update({ priceMin: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
            className={NUM_INPUT}
          />
          <span className="text-app-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="do"
            value={filters.priceMax ?? ''}
            onChange={(e) => update({ priceMax: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
            className={NUM_INPUT}
          />
        </div>
      </section>

      <section>
        <p className={GROUP_TITLE}>Godište</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="od"
            value={filters.yearMin ?? ''}
            onChange={(e) => update({ yearMin: e.target.value === '' ? null : Number(e.target.value) })}
            className={NUM_INPUT}
          />
          <span className="text-app-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="do"
            value={filters.yearMax ?? ''}
            onChange={(e) => update({ yearMax: e.target.value === '' ? null : Number(e.target.value) })}
            className={NUM_INPUT}
          />
        </div>
      </section>

      <section>
        <p className={GROUP_TITLE}>Kilometraža</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="od"
            value={filters.kmMin ?? ''}
            onChange={(e) => update({ kmMin: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
            className={NUM_INPUT}
          />
          <span className="text-app-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="do"
            value={filters.kmMax ?? ''}
            onChange={(e) => update({ kmMax: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
            className={NUM_INPUT}
          />
        </div>
      </section>
    </div>
  );
}

interface FilterPanelProps extends FilterGroupsProps {
  /** Extra classes for the desktop column (sticky offset, width). */
  className?: string;
  /** Rendered next to the title: the "reset" button and active count. */
  onReset: () => void;
}

/** Desktop column. Hidden below `lg`, where the sheet takes over. */
export function FilterSidebar({ className = '', onReset, ...groups }: FilterPanelProps) {
  const active = countActiveFilters(groups.filters);

  return (
    <aside className={`hidden lg:block ${className}`}>
      <div className="rounded-2xl border border-surface bg-card-surface p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-brand-text" />
            <p className="text-sm font-bold text-app-primary dark:text-zinc-100">Filteri</p>
            {active > 0 && (
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-text">
                {active}
              </span>
            )}
          </div>
          {active > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-[11px] font-semibold text-app-muted transition-colors hover:text-brand-text"
            >
              <RotateCcw size={11} />
              Očisti
            </button>
          )}
        </div>
        <FilterGroups {...groups} />
      </div>
    </aside>
  );
}

/** The same groups, for the mobile sheet. */
export function FilterSheetBody({ onReset, ...groups }: Omit<FilterPanelProps, 'className'>) {
  const active = countActiveFilters(groups.filters);

  return (
    <div>
      {active > 0 && (
        <button
          onClick={onReset}
          className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-app-muted transition-colors hover:text-brand-text"
        >
          <RotateCcw size={12} />
          Očisti filtere ({active})
        </button>
      )}
      <FilterGroups {...groups} />
    </div>
  );
}
