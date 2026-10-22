'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { normalizeVehicleName } from '@/lib/car-catalog';

const OTHER_OPTION = '__other_vehicle_model__';

interface VehicleComboboxProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
  className: string;
  onChange: (value: string) => void;
  onChooseOther?: (searchText: string) => void;
}

export function VehicleCombobox({
  id,
  label,
  value,
  options,
  placeholder,
  disabled = false,
  invalid = false,
  className,
  onChange,
  onChooseOther,
}: VehicleComboboxProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const activeOptionRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const visibleOptions = useMemo(() => {
    const needle = normalizeVehicleName(query.trim());
    const matches = needle
      ? options.filter((option) => normalizeVehicleName(option).includes(needle))
      : options;
    return onChooseOther
      ? [...matches, OTHER_OPTION]
      : matches;
  }, [onChooseOther, options, query]);

  useEffect(() => {
    activeOptionRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function choose(option: string) {
    if (option === OTHER_OPTION) {
      onChooseOther?.(query.trim());
    } else {
      onChange(option);
    }
    setOpen(false);
    setQuery('');
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setQuery('');
        setOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((index) => Math.min(index + 1, visibleOptions.length - 1));
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(Math.max(visibleOptions.length - 1, 0));
    } else if (event.key === 'Enter' && open && visibleOptions.length > 0) {
      event.preventDefault();
      choose(visibleOptions[activeIndex] ?? visibleOptions[0]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      setQuery('');
    }
  }

  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="mb-2 block text-xs font-medium text-app-muted">
        {label} *
      </label>
      <div className="relative">
        <Search
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted"
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && visibleOptions.length ? `${listId}-option-${activeIndex}` : undefined}
          aria-invalid={invalid}
          autoComplete="off"
          disabled={disabled}
          value={open ? query : value}
          placeholder={disabled ? 'Prvo izaberi marku' : placeholder}
          onFocus={() => {
            if (disabled) return;
            setQuery('');
            setActiveIndex(0);
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setOpen(false);
            setQuery('');
          }}
          className={`${className} pl-10 pr-10 disabled:cursor-not-allowed disabled:opacity-50 ${invalid ? 'border-tone-negative focus:border-tone-negative focus:ring-ring/15' : ''}`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={open ? `Zatvori listu: ${label}` : `Otvori listu: ${label}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (disabled) return;
            if (open) {
              setOpen(false);
              setQuery('');
            } else {
              inputRef.current?.focus();
            }
          }}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-hover-surface"
        >
          <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && !disabled && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-[100] mt-1 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-surface bg-card-surface p-1 shadow-xl dark:border-surface dark:bg-card-surface"
        >
          {visibleOptions.length > 0 ? visibleOptions.map((option, index) => {
            const isOther = option === OTHER_OPTION;
            const selected = !isOther && normalizeVehicleName(value) === normalizeVehicleName(option);
            const active = index === activeIndex;
            return (
              <button
                key={option}
                ref={active ? activeOptionRef : null}
                id={`${listId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  active || selected
                    ? 'bg-brand-500/10 text-app-primary dark:text-app-primary'
                    : 'text-app-secondary hover:bg-elevated dark:text-app-secondary dark:hover:bg-elevated'
                }`}
              >
                <span className="min-w-0 truncate">
                  {isOther ? 'Drugi model / Nije na listi' : option}
                  {isOther && <span className="ml-2 text-xs text-app-muted">Unesi ručno</span>}
                </span>
                {selected && <Check size={15} className="shrink-0 text-brand-text" />}
              </button>
            );
          }) : (
            <p className="px-3 py-3 text-xs text-app-muted">Nema rezultata za ovaj unos.</p>
          )}
        </div>
      )}
    </div>
  );
}
