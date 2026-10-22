'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, MapPin, Search } from 'lucide-react';
import {
  POPULAR_SERBIAN_PLACES,
  SERBIAN_PLACES,
  getSerbianPlace,
  type SerbianPlace,
} from '@/lib/city-coordinates';

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  className?: string;
  invalid?: boolean;
  required?: boolean;
  id?: string;
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sr-Latn')
    .replace(/đ/g, 'dj');
}

/** Searchable city picker backed by the local GeoNames Serbia dataset. */
export function CitySelect({ value, onChange, className, invalid, required, id }: CitySelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = getSerbianPlace(value);
  const displayValue = selected?.name ?? value;
  const options = useMemo(() => {
    const needle = normalizeSearch(query.trim());
    if (!needle) return POPULAR_SERBIAN_PLACES;
    return SERBIAN_PLACES.filter((place) =>
      [place.name, ...place.searchNames].some((name) => normalizeSearch(name).includes(needle)),
    ).slice(0, 12);
  }, [query]);

  function choose(place: SerbianPlace) {
    onChange(place.name);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={id ? `${id}-options` : undefined}
          aria-invalid={invalid}
          aria-required={required}
          autoComplete="off"
          value={open ? query : displayValue}
          onFocus={(event) => {
            setQuery(displayValue);
            setOpen(true);
            event.currentTarget.select();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
            setQuery('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              setQuery('');
            } else if (event.key === 'Enter' && open && options[0]) {
              event.preventDefault();
              choose(options[0]);
            }
          }}
          placeholder="Pretraži grad ili naselje"
          className={`${className ?? ''} pl-10 pr-10 ${invalid ? 'border-tone-negative focus:border-tone-negative focus:ring-ring/15' : ''}`}
        />
        <ChevronDown size={15} className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-app-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div
          id={id ? `${id}-options` : undefined}
          role="listbox"
          className="absolute inset-x-0 top-full z-[90] mt-1 max-h-64 overflow-y-auto rounded-xl border border-surface bg-card-surface p-1 shadow-xl dark:border-surface dark:bg-card-surface"
        >
          {options.length ? options.map((place) => (
            <button
              key={place.id}
              type="button"
              role="option"
              aria-selected={selected?.id === place.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(place)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-app-primary transition-colors hover:bg-elevated dark:text-app-primary dark:hover:bg-elevated"
            >
              <MapPin size={14} className="flex-shrink-0 text-brand-text" />
              <span className="min-w-0 flex-1 truncate">{place.name}</span>
              {selected?.id === place.id && <Check size={14} className="flex-shrink-0 text-brand-text" />}
            </button>
          )) : (
            <p className="px-3 py-3 text-xs text-app-muted">Nema naselja za ovaj unos.</p>
          )}
          <div className="border-t border-surface px-2.5 py-1.5 text-[10px] text-app-muted dark:border-surface">
            Podaci i koordinate: <a href="https://www.geonames.org/" target="_blank" rel="noreferrer" className="underline underline-offset-2">GeoNames</a>
          </div>
        </div>
      )}
    </div>
  );
}
