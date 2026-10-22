'use client';

import { useState } from 'react';
import { Phone, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { isValidPhoneNumber, normalizePhoneNumber } from '@/lib/phone';

export default function PhoneGateModal({
  open,
  loadError = '',
  onRetry,
  onCancel,
  onContinue,
}: {
  open: boolean;
  loadError?: string;
  onRetry?: () => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const { updateUser } = useUser();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizePhoneNumber(phone);
    if (!isValidPhoneNumber(phone)) {
      setError('Unesi ispravan broj telefona.');
      return;
    }

    setSaving(true);
    setError('');
    const result = await updateUser({ phone: normalized });
    setSaving(false);
    if (!result.ok) {
      setError('Broj telefona nije sačuvan. Pokušaj ponovo.');
      return;
    }
    toast.success('Broj telefona je sačuvan.');
    onContinue();
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="phone-gate-title" aria-describedby="phone-gate-description">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-surface bg-card-surface p-6 shadow-2xl dark:border-surface dark:bg-card-surface">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
          <Phone size={21} className="text-brand-text" />
        </div>
        <h2 id="phone-gate-title" className="text-center text-lg font-bold text-app-primary dark:text-app-primary">Dodaj broj telefona</h2>
        <p id="phone-gate-description" className="mt-2 text-center text-sm leading-relaxed text-app-secondary dark:text-app-secondary">
          Broj koristimo kao kontakt podatak u vezi sa oglasima i ponudama. Neće biti javno prikazan bez tvoje dozvole.
        </p>

        {loadError ? (
          <>
            <p role="alert" className="mt-4 rounded-xl border border-tone-negative-surface bg-tone-negative-surface p-3 text-xs leading-relaxed text-tone-negative">
              Profil nije učitan: {loadError}
            </p>
            <button type="button" onClick={onRetry} className="btn-primary mt-4 w-full">Pokušaj ponovo</button>
          </>
        ) : (
          <>
            <label htmlFor="phone-gate-input" className="mb-1.5 mt-5 block text-xs font-medium text-app-secondary dark:text-app-secondary">Broj telefona</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
              <input
                id="phone-gate-input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                autoFocus
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+381 64 123 4567"
                aria-invalid={Boolean(error)}
                className={`w-full rounded-xl border bg-elevated py-3 pl-10 pr-4 text-sm text-app-primary outline-none transition-colors placeholder:text-app-muted focus:ring-2 focus:ring-ring/15 dark:text-app-primary ${error ? 'border-tone-negative' : 'border-surface focus:border-brand-500 dark:border-surface'}`}
              />
            </div>
            {error && <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-tone-negative"><TriangleAlert size={12} />{error}</p>}
          </>
        )}

        <div className="mt-5 flex gap-2">
          {!loadError && (
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm disabled:cursor-wait disabled:opacity-60">
              {saving ? 'Čuvanje…' : 'Sačuvaj i nastavi'}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className={`${loadError ? 'w-full' : 'flex-1'} rounded-xl border border-surface px-4 py-3 text-sm font-semibold text-app-secondary transition-colors hover:bg-elevated disabled:opacity-60 dark:border-surface dark:text-app-secondary dark:hover:bg-elevated`}
          >
            Otkaži
          </button>
        </div>
      </form>
    </div>
  );
}
