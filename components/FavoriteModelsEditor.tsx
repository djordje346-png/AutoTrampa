'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { BRAND_NAMES, CAR_BRANDS } from '@/lib/car-brands';
import { usePreferences } from '@/hooks/use-preferences';
import { toast } from 'sonner';

export function FavoriteModelsEditor({ compact = false }: { compact?: boolean }) {
  const { preferences, update, mounted } = usePreferences();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [saving, setSaving] = useState(false);
  const selected = preferences.favoriteModels;
  const options = brand ? (CAR_BRANDS[brand] || []) : [];

  async function saveFavoriteModels(next: string[]): Promise<boolean> {
    const result = await update({ favoriteModels: next });
    if (!result.ok) {
      toast.error(result.message || 'Nije moguće sačuvati omiljene modele.');
      return false;
    }
    return true;
  }

  async function handleModelChange(nextModel: string) {
    if (!brand || !nextModel || saving) return;
    const key = `${brand}::${nextModel}`;
    if (selected.includes(key)) {
      toast.info('Ovaj model je već dodat.');
      return;
    }
    if (selected.length >= 5) return;
    setModel(nextModel);
    setSaving(true);
    try {
      const saved = await saveFavoriteModels([...selected, key]);
      if (saved) {
        setBrand('');
        setModel('');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold text-app-primary dark:text-app-primary">
            <Star size={14} className="text-brand-text" /> Omiljeni modeli
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-app-muted">
            Izaberi do 5 modela. Oni će imati prednost u pretrazi i Swipe režimu, ali ostala vozila ostaju dostupna.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-500/10 px-2 py-1 text-[10px] font-bold text-brand-text">{selected.length}/5</span>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((key) => {
            const [savedBrand, savedModel] = key.split('::');
            return (
              <span key={key} className="inline-flex max-w-full items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/10 py-1 pl-2.5 pr-1 text-[11px] font-semibold text-app-primary dark:text-app-primary">
                <span className="truncate">{savedBrand} {savedModel}</span>
                <button type="button" disabled={!mounted} aria-label={`Ukloni ${savedBrand} ${savedModel}`} onClick={() => void saveFavoriteModels(selected.filter(item => item !== key))} className="rounded-full p-1 hover:bg-brand-500/20"><X size={13}/></button>
              </span>
            );
          })}
        </div>
      ) : <p className="rounded-lg border border-dashed border-surface p-2.5 text-[11px] text-app-muted dark:border-surface">Još nisi izabrao omiljene modele.</p>}

      {selected.length < 5 && (
        <div className={compact ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
          <select aria-label="Marka omiljenog automobila" disabled={!mounted || saving} value={brand} onChange={event => { setBrand(event.target.value); setModel(''); }} className="min-w-0 rounded-xl border border-surface bg-elevated px-3 py-2 text-xs text-app-primary dark:border-surface dark:bg-app dark:text-app-primary">
            <option value="">Izaberi marku</option>
            {BRAND_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <select aria-label="Omiljeni model" disabled={!mounted || !brand || saving} value={model} onChange={event => void handleModelChange(event.target.value)} className="min-w-0 rounded-xl border border-surface bg-elevated px-3 py-2 text-xs text-app-primary dark:border-surface dark:bg-app dark:text-app-primary">
            <option value="">Izaberi model</option>
            {options.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      )}
      {saving && <p role="status" className="text-[11px] text-app-muted">Čuvanje modela…</p>}

    </div>
  );
}
