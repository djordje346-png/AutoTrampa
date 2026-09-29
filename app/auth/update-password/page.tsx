'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function UpdatePasswordPage() {
  const { updatePassword, mounted, isLoggedIn } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (password.length < 8) {
      setMessage('Lozinka mora imati bar 8 karaktera.');
      return;
    }
    if (password !== confirmation) {
      setMessage('Lozinke se ne poklapaju.');
      return;
    }
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (!result.ok) setMessage(result.message);
    else setSaved(true);
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-5 py-12">
      <section className="w-full max-w-sm rounded-2xl border border-surface bg-card-surface p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white">
          <LockKeyhole size={21} />
        </div>
        <h1 className="text-xl font-bold text-app-primary">Promeni lozinku</h1>

        {!mounted ? (
          <p className="mt-3 text-sm text-app-secondary">Proveravam link…</p>
        ) : saved ? (
          <div className="mt-4 space-y-4">
            <p role="status" className="text-sm text-emerald-400">Lozinka je promenjena.</p>
            <Link href="/profile" className="inline-flex rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white">Nastavi u profil</Link>
          </div>
        ) : !isLoggedIn ? (
          <p role="alert" className="mt-3 text-sm text-app-secondary">Link je istekao ili nije važeći. Zatraži novi link za promenu lozinke.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-app-secondary" htmlFor="new-password">Nova lozinka</label>
            <input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-xl border border-surface bg-elevated px-3 text-sm text-app-primary outline-none focus:border-orange-500" />
            <label className="block text-xs font-medium text-app-secondary" htmlFor="confirm-password">Ponovi lozinku</label>
            <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-11 w-full rounded-xl border border-surface bg-elevated px-3 text-sm text-app-primary outline-none focus:border-orange-500" />
            {message && <p role="alert" className="text-sm text-rose-400">{message}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Čuvam…' : 'Sačuvaj novu lozinku'}</button>
          </form>
        )}
      </section>
    </main>
  );
}
