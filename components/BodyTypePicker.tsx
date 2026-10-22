'use client';

import { useRef } from 'react';
import { Check } from 'lucide-react';
import type { BodyType } from '@/types';
import { BODY_TYPES } from '@/lib/body-types';
import { BodyTypeSilhouette } from '@/components/BodyTypeSilhouette';

interface BodyTypePickerProps {
  value: BodyType | '';
  onChange: (value: BodyType) => void;
  error?: string;
}

export function BodyTypePicker({ value, onChange, error }: BodyTypePickerProps) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  return (
    <div
      role="radiogroup"
      aria-labelledby="car-body-type-label"
      aria-describedby={error ? 'car-body-type-error' : undefined}
      aria-required="true"
      aria-invalid={Boolean(error)}
      className="grid grid-cols-3 gap-2 sm:gap-2.5 lg:grid-cols-6"
    >
      {BODY_TYPES.map(({ value: type, label }, index) => {
        const active = value === type;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (!value && index === 0) ? 0 : -1}
            ref={(element) => { buttons.current[index] = element; }}
            onClick={() => onChange(type)}
            onKeyDown={(event) => {
              const nextIndex = event.key === 'ArrowRight' || event.key === 'ArrowDown'
                ? (index + 1) % BODY_TYPES.length
                : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                  ? (index - 1 + BODY_TYPES.length) % BODY_TYPES.length
                  : event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? BODY_TYPES.length - 1
                      : -1;

              if (nextIndex >= 0) {
                event.preventDefault();
                onChange(BODY_TYPES[nextIndex].value);
                buttons.current[nextIndex]?.focus();
              }
            }}
            className={`relative flex min-h-[76px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card-surface ${index === 6 ? 'lg:col-start-2' : ''} ${
              active
                ? 'border-brand-500 bg-brand-soft text-app-primary'
                : 'border-surface bg-card-surface text-app-secondary hover:border-brand-500/50 hover:bg-elevated hover:text-app-primary'
            }`}
          >
            {active && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-on-accent" aria-hidden="true">
                <Check size={11} strokeWidth={3} />
              </span>
            )}
            <BodyTypeSilhouette type={type} className="h-10 w-full max-w-[112px] shrink-0" />
            <span className="max-w-full text-[10px] font-semibold leading-tight sm:text-[11px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
