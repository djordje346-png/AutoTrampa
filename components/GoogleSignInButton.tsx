'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    setPending(true);
    setError('');
    const result = await signInWithGoogle();
    if (!result.ok) {
      setError(result.message);
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={pending}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-surface bg-card-surface px-6 py-3 text-sm font-semibold text-app-primary shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-brand-500/60 hover:bg-elevated active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10">
          <GoogleMark />
        </span>
        {pending ? 'Povezujem sa Google-om…' : 'Prijavi se preko Google-a'}
      </button>
      {error && <p role="alert" className="text-center text-xs text-tone-negative">{error}</p>}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(2 3)" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.75 7.18l7.73 6C44.43 37.96 46.98 31.86 46.98 24.55Z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(2 3)" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(2 0)" />
    </svg>
  );
}
