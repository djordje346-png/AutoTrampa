'use client';

import Link from 'next/link';
import { LockKeyhole, ArrowLeftRight } from 'lucide-react';
import { openAuthPrompt } from '@/hooks/use-auth';

interface SignedOutProps {
  title: string;
  description: string;
  /** Context shown above the sign-in form. */
  reason: string;
}

/** Shown on the personal screens while nobody is signed in. */
export function SignedOut({ title, description, reason }: SignedOutProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-elevated">
        <LockKeyhole size={32} className="text-app-muted" />
      </div>
      <h2 className="text-base font-bold text-app-primary">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-app-secondary">{description}</p>

      <button
        onClick={() => openAuthPrompt(reason)}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-400"
      >
        Prijavi se
      </button>

      <Link
        href="/"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-app-muted transition-colors hover:text-orange-400"
      >
        <ArrowLeftRight size={12} />
        Pregledaj oglase bez naloga
      </Link>
    </div>
  );
}

/** Header shell so signed-out screens keep the page title in place. */
export function SignedOutPage({
  heading,
  ...props
}: SignedOutProps & { heading: string }) {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 border-b border-surface bg-app px-4 py-4 safe-top">
        <h1 className="text-xl font-bold tracking-tight text-app-primary">{heading}</h1>
      </header>
      <SignedOut {...props} />
    </div>
  );
}
