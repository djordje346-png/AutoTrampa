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
  const { promptReason, promptInitialTab, closePrompt } = useAuth();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePrompt();
        return;
      }
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [closePrompt]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-zinc-950/60 px-3 py-4 backdrop-blur-sm outline-none sm:px-6 sm:py-6"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="relative mx-auto w-full max-w-[460px]">
        <button
          type="button"
          onClick={closePrompt}
          aria-label="Zatvori prijavu"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-surface bg-card-surface text-app-secondary shadow-sm transition-colors hover:bg-elevated hover:text-app-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-surface dark:bg-elevated dark:text-app-secondary dark:hover:bg-elevated dark:hover:text-app-primary"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <AuthScreen initialTab={promptInitialTab} contextReason={promptReason} />
      </div>
    </div>
  );
}
