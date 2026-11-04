import Link from 'next/link';
import type { ReactNode } from 'react';
import { LEGAL } from '@/lib/legal';

export default function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <article className="app-container py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Pravila i privatnost" className="mb-6 flex flex-wrap gap-x-5 gap-y-3 text-sm">
          <Link href="/" className="rounded text-app-secondary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">Početna</Link>
          <Link href={LEGAL.termsPath} aria-current={title === 'Uslovi korišćenja' ? 'page' : undefined} className="rounded text-brand-text underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">Uslovi korišćenja</Link>
          <Link href={LEGAL.privacyPath} aria-current={title === 'Politika privatnosti' ? 'page' : undefined} className="rounded text-brand-text underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">Politika privatnosti</Link>
        </nav>
        <header className="mb-8">
          <p className="mb-3 text-xs text-app-muted">Poslednje ažuriranje: {LEGAL.updated}</p>
          <h1 className="text-3xl font-bold tracking-tight text-app-primary sm:text-4xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-app-secondary">{intro}</p>
        </header>
        <div className="space-y-7 rounded-2xl border border-surface bg-card-surface p-5 text-sm leading-7 text-app-secondary sm:p-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-app-primary [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:break-words [&_a]:text-brand-text [&_a]:underline [&_a]:underline-offset-4 [&_a]:rounded [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-brand-500">
          {children}
        </div>
        <aside className="mt-6 rounded-2xl border border-surface bg-elevated p-5 text-sm leading-7 text-app-secondary">
          <h2 className="font-semibold text-app-primary">Kontakt</h2>
          <p>{LEGAL.operator}, {LEGAL.country}. AutoTrampa je nezavisni projekat u razvoju, a ne registrovano privredno društvo.</p>
          <a className="break-all rounded font-medium text-brand-text underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </aside>
      </div>
    </article>
  );
}
