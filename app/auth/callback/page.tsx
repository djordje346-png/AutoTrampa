'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LoaderCircle, TriangleAlert } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Potvrđujem prijavu…');
  const [error, setError] = useState('');
  const exchangeStarted = useRef(false);

  useEffect(() => {
    if (exchangeStarted.current) return;
    exchangeStarted.current = true;
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const providerError = searchParams.get('error_description') || searchParams.get('error');

    async function finishSignIn() {
      if (providerError) {
        setError(providerError);
        setMessage('Prijava nije završena.');
        return;
      }

      if (!code) {
        setError('Nedostaje kod za potvrdu prijave. Pokušaj ponovo.');
        setMessage('Prijava nije završena.');
        return;
      }

      try {
        const { error: exchangeError } = await getSupabase().auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        setMessage('Uspešna prijava. Preusmeravam…');
        window.location.replace('/');
      } catch (exchangeError) {
        setError(exchangeError instanceof Error ? exchangeError.message : 'Prijava nije uspela.');
        setMessage('Prijava nije završena.');
      }
    }

    void finishSignIn();
  }, []);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-surface bg-card-surface p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/25">
          {error ? <TriangleAlert size={21} /> : <LoaderCircle size={21} className="animate-spin" />}
        </div>
        <h1 className="font-heading text-xl font-bold text-app-primary dark:text-zinc-100">{message}</h1>
        {error && (
          <>
            <p role="alert" className="mt-3 text-sm text-app-secondary dark:text-zinc-400">{error}</p>
            <Link href="/" className="btn-primary mt-5 inline-flex">Vrati se na početnu</Link>
          </>
        )}
      </section>
    </main>
  );
}
