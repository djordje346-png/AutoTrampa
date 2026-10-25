'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/hooks/use-preferences';
import { getSerbianPlace } from '@/lib/city-coordinates';
import type { MyGarageCar } from '@/types';

interface DesktopRadiusControlProps {
  selectedCar: MyGarageCar;
}

export function DesktopRadiusControl({ selectedCar }: DesktopRadiusControlProps) {
  const { preferences, update, mounted: preferencesReady } = usePreferences();
  const [draft, setDraft] = useState(preferences.radius);

  useEffect(() => setDraft(Math.min(550, Math.max(50, Math.round(preferences.radius / 50) * 50))), [preferences.radius]);

  async function saveRadius(value: number) {
    if (value === preferences.radius) return;
    const result = await update({ radius: value });
    if (!result.ok) {
      setDraft(preferences.radius);
      toast.error(result.message || 'Radius pretrage nije sačuvan. Pokušaj ponovo.');
    }
  }

  const city = selectedCar.city && selectedCar.city !== '-'
    ? getSerbianPlace(selectedCar.city)
    : null;
  const radiusLabel = !preferencesReady ? '…' : `${draft >= 550 ? '500+' : draft} km`;

  return (
    <div className="flex h-9 min-w-0 flex-shrink-0 items-center gap-1.5" title={city ? `Centar pretrage: ${city.name}` : 'Dodaj grad svom autu u garaži'}>
      <MapPin size={14} className="flex-shrink-0 text-app-secondary" aria-hidden="true" />
      <label htmlFor="desktop-search-radius" className="whitespace-nowrap text-[11px] font-semibold text-app-secondary dark:text-app-secondary">Radius</label>
      <input
        id="desktop-search-radius"
        type="range"
        min={50}
        max={550}
        step={50}
        value={draft}
        disabled={!preferencesReady}
        onChange={(event) => setDraft(Number(event.target.value))}
        onPointerUp={(event) => void saveRadius(Number(event.currentTarget.value))}
        onBlur={(event) => void saveRadius(Number(event.currentTarget.value))}
        onKeyUp={(event) => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) void saveRadius(Number(event.currentTarget.value));
        }}
        aria-label={`Radius pretrage: ${radiusLabel}`}
        className="h-2 w-20 cursor-pointer appearance-none rounded-full bg-elevated accent-brand-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-24"
      />
      <span className="min-w-[3.25rem] whitespace-nowrap text-right text-[11px] font-bold text-brand-text">{radiusLabel}</span>
    </div>
  );
}
