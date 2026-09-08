'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import AuthScreen from '@/components/AuthScreen';

/**
 * Sign-in as an interruption rather than a wall: opened by `requireAuth` at the
 * moment an action needs an account, and dismissible back to public browsing.
 */
export default function AuthOverlay() {
  const { promptReason, closePrompt } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closePrompt();
    }
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [closePrompt]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Prijava"
      tabIndex={-1}
      className="fixed inset-0 z-[100] overflow-y-auto bg-app outline-none"
    >
      <button
        onClick={closePrompt}
        aria-label="Zatvori prijavu"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-surface bg-elevated text-app-secondary transition-colors hover:text-app-primary safe-top"
      >
        <X size={18} />
      </button>

      <div className="mx-auto w-full max-w-md">
        {promptReason ? (
          <div className="px-6 pt-16">
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-center text-sm font-semibold text-orange-400">
              {promptReason}
            </div>
          </div>
        ) : null}
        <AuthScreen compact={Boolean(promptReason)} />
      </div>
    </div>
  );
}
