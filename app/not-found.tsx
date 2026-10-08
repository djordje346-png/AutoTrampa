import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-elevated">
        <Compass size={34} className="text-app-muted" />
      </div>
      <p className="text-4xl font-black tracking-tight text-brand-400">404</p>
      <h1 className="mt-2 text-lg font-bold text-app-primary dark:text-zinc-100">Stranica nije pronađena</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-app-secondary dark:text-zinc-400">
        Oglas je možda uklonjen ili adresa nije ispravna.
      </p>
      <Link
        href="/"
        className="btn-primary mt-6 text-sm"
      >
        <ArrowLeft size={16} />
        Nazad na Početnu
      </Link>
    </div>
  );
}
