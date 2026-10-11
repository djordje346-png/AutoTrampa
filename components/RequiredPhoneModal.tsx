'use client';

import { useState } from 'react';
import { Phone, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { useAuth } from '@/hooks/use-auth';
import { isValidPhoneNumber } from '@/lib/phone';

export default function RequiredPhoneModal({
  open,
  loadError = '',
  onRetry,
}: {
  open: boolean;
  loadError?: string;
  onRetry?: () => void;
}) {
  const { updateUser } = useUser();
  const { logout } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!open && !loadError) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidPhoneNumber(phone)) {
      setError('Unesi ispravan broj telefona sa pozivnim brojem.');
      return;
    }

    setSaving(true);
    setError('');
    const result = await updateUser({ phone: phone.trim() });
    setSaving(false);
    if (!result.ok) {
      setError(result.message ? `Broj telefona nije sačuvan. ${result.message}` : 'Broj telefona nije sačuvan. Pokušaj ponovo.');
      return;
    }
    toast.success('Broj telefona je sačuvan.');
  }

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError('');
    const result = await logout();
    setLoggingOut(false);
    if (!result.ok) setLogoutError(`Odjava nije uspela. ${result.message}`);
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="required-phone-title" aria-describedby="required-phone-description">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-surface bg-card-surface p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
          <Phone size={21} className="text-brand-text" />
        </div>
        <h2 id="required-phone-title" className="text-center text-lg font-bold text-app-primary dark:text-zinc-100">Dodaj broj telefona</h2>
        <p id="required-phone-description" className="mt-2 text-center text-sm leading-relaxed text-app-secondary dark:text-zinc-400">
          {loadError
            ? 'Ne možemo trenutno da proverimo podatke profila. Pokušaj ponovo pre nego što nastaviš.'
            : 'Broj telefona je obavezan za korišćenje AutoTrampa. Unesi ga da nastaviš.'}
        </p>

        {loadError ? (
          <>
            <p role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-relaxed text-tone-negative">
              Profil nije učitan: {loadError}
            </p>
            <button type="button" onClick={onRetry} className="btn-primary mt-5 w-full">
              Pokušaj ponovo
            </button>
          </>
        ) : (
          <>
        <label htmlFor="required-phone" className="mb-1.5 mt-5 block text-xs font-medium text-app-secondary dark:text-zinc-400">Broj telefona</label>
        <div className="relative">
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            id="required-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+381 64 123 4567"
            aria-invalid={Boolean(error)}
            className={`w-full rounded-xl border bg-elevated py-3 pl-10 pr-4 text-sm text-app-primary outline-none transition-colors placeholder:text-app-muted focus:ring-2 focus:ring-brand-500/10 dark:text-zinc-100 ${error ? 'border-rose-500/70' : 'border-surface focus:border-brand-500 dark:border-zinc-800'}`}
          />
        </div>
        {error && <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-tone-negative"><TriangleAlert size={12} />{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary mt-5 w-full disabled:cursor-wait disabled:opacity-60">
          {saving ? 'Čuvanje…' : 'Sačuvaj i nastavi'}
        </button>
          </>
        )}

        {logoutError && <p role="alert" className="mt-3 text-center text-xs text-tone-negative">{logoutError}</p>}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-3 w-full rounded-xl border border-surface px-4 py-2.5 text-sm font-semibold text-app-secondary transition-colors hover:bg-elevated disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {loggingOut ? 'Odjavljivanje…' : 'Odjavi se'}
        </button>
      </form>
    </div>
  );
}
