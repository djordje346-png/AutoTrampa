'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { FavoriteModelsEditor } from '@/components/FavoriteModelsEditor';
import { usePreferences, type Preferences } from '@/hooks/use-preferences';
import { BODY_TYPES } from '@/lib/body-types';

type Trade = Preferences['tradePreference'];
const directions: {value: Trade; label: string; detail: string}[] = [
  { value: 'cheaper', label: 'Jeftiniji auto', detail: 'Želim da meni doplate' },
  { value: 'similar', label: 'Slična vrednost', detail: 'Zamena uz malu ili nikakvu doplatu' },
  { value: 'expensive', label: 'Skuplji auto', detail: 'Spreman sam da doplatim' },
  { value: 'all', label: 'Sve opcije', detail: 'Otvoren sam za sve zamene' },
];
const distances = [50, 100, 200, 300, 550];

export function MobilePreferences({ hasGarageCar, autoOpen = false, hideTrigger = false, compactTrigger = false, onDismiss }: { hasGarageCar: boolean; autoOpen?: boolean; hideTrigger?: boolean; compactTrigger?: boolean; onDismiss?: () => void }) {
  const { preferences, update, mounted } = usePreferences();
  const autoOpened = useRef(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [trade, setTrade] = useState<Trade>('all');
  const [budget, setBudget] = useState('');
  const [noTopUp, setNoTopUp] = useState(false);
  const [minReceived, setMinReceived] = useState('0');
  const [radius, setRadius] = useState(50);
  const [bodies, setBodies] = useState<string[]>([]);
  const steps = hasGarageCar ? ['Zamena', 'Budžet', 'Udaljenost', 'Karoserija', 'Modeli'] : ['Budžet', 'Udaljenost', 'Karoserija', 'Modeli'];
  const current = steps[step];

  function start() {
    setTrade(preferences.tradePreference);
    setBudget(preferences.budget == null ? '' : String(preferences.budget));
    setNoTopUp(preferences.noTopUp);
    setMinReceived(String(preferences.minReceived));
    setRadius(preferences.radius);
    setBodies([...preferences.bodyPrefs]);
    setStep(0);
    setOpen(true);
  }

  useEffect(() => {
    if (autoOpen && mounted && !autoOpened.current) {
      autoOpened.current = true;
      start();
    }
  }, [autoOpen, mounted]);

  function close() {
    setOpen(false);
    onDismiss?.();
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  async function complete() {
    if (saving) return;
    const value = budget.trim() ? Number(budget) : null;
    const received = minReceived.trim() ? Number(minReceived) : 0;
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100000)) {
      toast.error('Unesi budžet od 0 do 100.000 €.');
      setStep(steps.indexOf('Budžet'));
      return;
    }
    if (!Number.isFinite(received) || received < 0 || received > 100000) {
      toast.error('Unesi očekivanu doplatu od 0 do 100.000 €.');
      setStep(steps.indexOf('Budžet'));
      return;
    }
    setSaving(true);
    try {
      const result = await update({
        tradePreference: hasGarageCar ? trade : 'all',
        budget: noTopUp ? 0 : value,
        noTopUp: trade === 'cheaper' ? false : noTopUp,
        minReceived: trade === 'cheaper' ? received : 0,
        radius,
        bodyPrefs: bodies,
      });
      if (!result.ok) { toast.error(result.message || 'Podešavanja nisu sačuvana.'); return; }
      toast.success('Preferencije su sačuvane.');
      close();
    } finally { setSaving(false); }
  }

  return (
    <>
      {!hideTrigger && (compactTrigger ? (
        <button type="button" onClick={start} disabled={!mounted || !hasGarageCar}
          aria-label="Uredi preferencije izabranog automobila"
          className="control-focus inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-text transition-colors hover:bg-brand-500/10 disabled:opacity-50">
          <SlidersHorizontal size={14} aria-hidden="true" /> Uredi preferencije
        </button>
      ) : (
      <button type="button" onClick={start} className="flex w-full items-center gap-3 rounded-2xl border border-brand-500/40 bg-brand-500/[.055] px-3.5 py-3.5 text-left shadow-[0_3px_12px_rgba(245,138,56,.06)] dark:bg-brand-500/[.07]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-text"><SlidersHorizontal size={20}/></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-app-primary dark:text-app-primary">Moje preferencije</span>
          <span className="mt-0.5 block truncate text-[11px] text-app-secondary dark:text-app-secondary">
            {mounted ? `${preferences.noTopUp ? 'Bez doplate' : preferences.budget ? `Do ${preferences.budget.toLocaleString('sr-RS')} €` : 'Budžet nije zadat'} · ${preferences.radius >= 550 ? '500+ km' : `${preferences.radius} km`}${preferences.favoriteModels.length ? ` · ${preferences.favoriteModels.length} omiljenih modela` : ''}` : 'Prilagodi preporuke za zamenu'}
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-text">Uredi <ChevronRight size={15}/></span>
      </button>
      ))}

      {open && <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="preferences-wizard-title" className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] border border-surface bg-card-surface shadow-2xl dark:border-surface sm:max-h-[90vh] sm:rounded-2xl" style={{maxHeight:'min(92dvh,800px)'}}>
          <div className="flex items-center justify-between border-b border-surface px-5 py-4 dark:border-surface">
            <div className="flex items-center gap-2"><SlidersHorizontal size={18} className="text-brand-text"/><strong className="text-sm text-app-primary">Moje preferencije</strong></div>
            <button type="button" onClick={close} className="rounded-lg p-2 text-app-secondary hover:bg-elevated" aria-label="Zatvori"><X size={20}/></button>
          </div>
          <div className="flex gap-1.5 px-5 pt-4">{steps.map((item,index)=><span key={item} className={`h-1.5 min-w-0 flex-1 rounded-full ${index <= step ? 'bg-brand-500' : 'bg-elevated'}`}/>)}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-6">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand-text">Korak {step+1} od {steps.length}</p>
            <h2 id="preferences-wizard-title" className="text-2xl font-extrabold leading-tight text-app-primary dark:text-app-primary">
              {current === 'Zamena' ? 'Kakvu zamenu želiš?' : current === 'Budžet' ? 'Koliki je tvoj budžet?' : current === 'Udaljenost' ? 'Koliko daleko bi otišao?' : current === 'Karoserija' ? 'Koju karoseriju voliš?' : 'Koji su tvoji omiljeni modeli?'}
            </h2>
            <p className="mb-5 mt-2 text-xs leading-relaxed text-app-secondary dark:text-app-secondary">
              {current === 'Zamena' ? 'Izaberi vrednost zamene koja ti najviše odgovara. Ostale ponude ostaju vidljive.' : current === 'Budžet' ? trade === 'cheaper' ? 'Koliku doplatu najmanje očekuješ da primiš?' : 'Koliko najviše želiš da doplatiš? Ostali automobili ostaju dostupni.' : current === 'Udaljenost' ? 'Prvo ćemo prikazivati bliže oglase, ali nećemo sakriti udaljenije.' : current === 'Karoserija' ? 'Možeš izabrati više tipova ili nijedan.' : 'Izaberi do pet modela da ih češće vidiš među prvim oglasima.'}
            </p>
            {current === 'Zamena' && <div className="grid gap-2">{directions.map(option => <button key={option.value} type="button" aria-pressed={trade === option.value} onClick={() => setTrade(option.value)} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left ${trade===option.value?'border-brand-500 bg-brand-500/10':'border-surface bg-elevated/40 dark:border-surface'}`}><span><strong className="block text-sm text-app-primary">{option.label}</strong><small className="mt-0.5 block text-xs text-app-muted">{option.detail}</small></span>{trade===option.value&&<Check className="shrink-0 text-brand-text" size={18}/>}</button>)}</div>}
            {current === 'Budžet' && <div className="space-y-3">
              {trade === 'cheaper' ? (
                <>
                  <label htmlFor="wizard-received" className="block text-xs font-semibold text-app-secondary">Najmanja doplata koju očekuješ (€)</label>
                  <input id="wizard-received" type="number" inputMode="numeric" min={0} max={100000} step={100} value={minReceived} onChange={event=>setMinReceived(event.target.value)} placeholder="Npr. 1000" className="w-full rounded-xl border border-surface bg-elevated px-4 py-3 text-base text-app-primary outline-none focus:border-brand-500"/>
                </>
              ) : (
                <>
                  <button type="button" aria-pressed={noTopUp} onClick={()=>setNoTopUp(v=>!v)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-sm font-semibold ${noTopUp?'border-brand-500 bg-brand-500/10':'border-surface bg-elevated/40'}`}>Ne želim da doplaćujem {noTopUp&&<Check size={18} className="text-brand-text"/>}</button>
                  <label htmlFor="wizard-budget" className="block text-xs font-semibold text-app-secondary">Maksimalna doplata (€)</label>
                  <input id="wizard-budget" type="number" inputMode="numeric" min={0} max={100000} step={100} disabled={noTopUp} value={budget} onChange={event=>setBudget(event.target.value)} placeholder="Npr. 2000" className="w-full rounded-xl border border-surface bg-elevated px-4 py-3 text-base text-app-primary outline-none focus:border-brand-500 disabled:opacity-40"/>
                </>
              )}
            </div>}
            {current === 'Udaljenost' && <div className="grid grid-cols-2 gap-2">{distances.map(distance=><button type="button" key={distance} onClick={()=>setRadius(distance)} aria-pressed={radius===distance} className={`rounded-xl border px-4 py-4 text-sm font-bold ${radius===distance?'border-brand-500 bg-brand-500/10 text-brand-text':'border-surface bg-elevated/40 text-app-primary'}`}>{distance>=550?'Cela Srbija (500+ km)':`Do ${distance} km`}</button>)}</div>}
            {current === 'Karoserija' && <div className="flex flex-wrap gap-2">{BODY_TYPES.map(item=><button key={item.value} type="button" aria-pressed={bodies.includes(item.value)} onClick={()=>setBodies(prev=>prev.includes(item.value)?prev.filter(x=>x!==item.value):[...prev,item.value])} className={`rounded-full border px-3 py-2 text-xs font-semibold ${bodies.includes(item.value)?'border-brand-500 bg-brand-500/10 text-brand-text':'border-surface bg-elevated text-app-secondary'}`}>{item.label}</button>)}</div>}
            {current === 'Modeli' && <FavoriteModelsEditor />}
          </div>
          <div className="flex items-center gap-2 border-t border-surface px-5 py-4 dark:border-surface">
            <button type="button" onClick={()=>setStep(current=>Math.max(0,current-1))} disabled={step===0||saving} className="flex h-11 w-12 items-center justify-center rounded-xl border border-surface text-app-primary disabled:opacity-30" aria-label="Prethodni korak"><ArrowLeft size={18}/></button>
            <button type="button" disabled={saving} onClick={()=>step===steps.length-1?void complete():setStep(current=>current+1)} className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-bold text-on-accent disabled:opacity-50">{step===steps.length-1?(saving?'Čuvanje…':'Sačuvaj preferencije'):'Nastavi'}{!saving&&(step===steps.length-1?<Check size={16}/>:<ArrowRight size={16}/>)}</button>
          </div>
        </section>
      </div>}
    </>
  );
}
