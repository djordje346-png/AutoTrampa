'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Hide the header row entirely (sheet supplies its own chrome). */
  bare?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared modal chrome for the app's bottom sheets: Escape to close, backdrop
 * click, background scroll lock, and focus moved into the panel so keyboard
 * users are not left behind on the page underneath.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  bare = false,
  children,
  className = '',
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      restoreFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-surface bg-card-surface p-6 outline-none safe-bottom sm:rounded-3xl sm:border ${className}`}
      >
        {!bare && (
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-app-primary">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Zatvori"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-app-secondary transition-colors hover:text-app-primary"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
