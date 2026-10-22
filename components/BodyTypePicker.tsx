'use client';

import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import type { BodyType } from '@/types';
import { BODY_TYPES } from '@/lib/body-types';
import { BodyTypeSilhouette } from '@/components/BodyTypeSilhouette';

interface BodyTypePickerProps {
  value: BodyType | '';
  onChange: (value: BodyType) => void;
  error?: string;
  variant?: 'form' | 'filter' | 'compact';
  required?: boolean;
  labelledBy?: string;
  ariaLabel?: string;
}

const LAYOUTS = {
  form: {
    group: 'flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-2 pt-1 [scrollbar-width:thin] lg:grid lg:grid-cols-9 lg:overflow-visible lg:px-0 lg:pb-0 lg:pt-0',
    button: 'min-h-[44px] shrink-0 flex-row gap-2 rounded-full px-3 py-1.5 lg:min-h-[66px] lg:flex-col lg:gap-0.5 lg:rounded-xl lg:px-1 lg:py-1.5',
    silhouette: 'h-5 w-[52px] shrink-0 lg:h-7 lg:w-[76px] lg:max-w-full',
    label: 'text-xs lg:flex lg:min-h-[24px] lg:items-center lg:justify-center lg:text-[10px] lg:leading-3',
    check: 'hidden lg:flex',
  },
  filter: {
    group: 'grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-2',
    button: 'min-h-[64px] flex-col gap-0.5 rounded-xl px-1 py-1.5',
    silhouette: 'h-7 w-[76px] max-w-full shrink-0',
    label: 'text-[11px] leading-4',
    check: 'flex',
  },
  compact: {
    group: 'grid grid-cols-3 gap-1.5',
    button: 'min-h-[60px] flex-col gap-0.5 rounded-lg px-0.5 py-1',
    silhouette: 'h-6 w-[64px] max-w-full shrink-0',
    label: 'text-[10px] leading-3',
    check: 'hidden',
  },
};

export function BodyTypePicker({
  value,
  onChange,
  error,
  variant = 'form',
  required = variant === 'form',
  labelledBy = variant === 'form' ? 'car-body-type-label' : undefined,
  ariaLabel = 'Karoserija',
}: BodyTypePickerProps) {
  const group = useRef<HTMLDivElement>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const isForm = variant === 'form';
  const layout = LAYOUTS[variant];

  useEffect(() => {
    const container = group.current;
    const selected = buttons.current[BODY_TYPES.findIndex((type) => type.value === value)];
    if (!isForm || !container || !selected || container.scrollWidth <= container.clientWidth) return;

    const bounds = container.getBoundingClientRect();
    const selection = selected.getBoundingClientRect();
    if (selection.left < bounds.left) container.scrollLeft += selection.left - bounds.left;
    else if (selection.right > bounds.right) container.scrollLeft += selection.right - bounds.right;
  }, [value, isForm]);

  return (
    <div
      ref={group}
      role={isForm ? 'radiogroup' : 'group'}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : ariaLabel}
      aria-describedby={error ? 'car-body-type-error' : undefined}
      aria-required={isForm ? required : undefined}
      aria-invalid={error ? true : undefined}
      className={layout.group}
    >
      {BODY_TYPES.map(({ value: type, label }, index) => {
        const active = value === type;
        return (
          <button
            key={type}
            type="button"
            role={isForm ? 'radio' : undefined}
            aria-checked={isForm ? active : undefined}
            aria-pressed={isForm ? undefined : active}
            tabIndex={isForm ? (active || (!value && index === 0) ? 0 : -1) : 0}
            ref={(element) => { buttons.current[index] = element; }}
            onClick={() => onChange(type)}
            onKeyDown={isForm ? (event) => {
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
                buttons.current[nextIndex]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
              }
            } : undefined}
            className={`relative flex min-w-0 items-center justify-center border text-center transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-accent focus-visible:ring-offset-1 focus-visible:ring-offset-card-surface ${layout.button} ${
              active
                ? 'border-brand-500 bg-brand-soft text-app-primary'
                : 'border-surface bg-card-surface text-app-primary hover:border-brand-500/60 hover:bg-elevated'
            }`}
          >
            {active && (
              <span className={`absolute right-1 top-1 h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-500 text-on-accent ${layout.check}`} aria-hidden="true">
                <Check size={9} strokeWidth={3} />
              </span>
            )}
            <BodyTypeSilhouette type={type} className={layout.silhouette} />
            <span className={`max-w-full font-medium ${layout.label}`}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
