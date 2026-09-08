'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert, RotateCcw, House as Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
        <TriangleAlert size={34} className="text-rose-400" />
      </div>
      <h1 className="text-lg font-bold text-app-primary">Nešto je pošlo naopako</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-app-secondary">
        Došlo je do neočekivane greške. Pokušaj ponovo ili se vrati na početnu stranu.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[10px] text-app-muted">#{error.digest}</p>
      )}
      <div className="mt-6 flex gap-2">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-400"
        >
          <RotateCcw size={16} />
          Pokušaj ponovo
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-elevated px-5 py-3 text-sm font-semibold text-app-primary transition-colors hover:bg-hover-surface"
        >
          <Home size={16} />
          Početna
        </Link>
      </div>
    </div>
  );
}
