import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-elevated">
        <Compass size={34} className="text-app-muted" />
      </div>
      <p className="text-4xl font-black tracking-tight text-orange-400">404</p>
      <h1 className="mt-2 text-lg font-bold text-app-primary">Stranica nije pronađena</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-app-secondary">
        Oglas je možda uklonjen ili adresa nije ispravna.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-400"
      >
        <ArrowLeft size={16} />
        Nazad na Početnu
      </Link>
    </div>
  );
}
