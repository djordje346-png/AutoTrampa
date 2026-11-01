'use client';

import { LISTINGS_PER_PAGE } from '@/hooks/use-listing-pagination';

export default function ListingPagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  if (!total) return null;
  const pages = Math.ceil(total / LISTINGS_PER_PAGE);
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const button = 'inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-surface px-3 text-xs font-semibold transition-colors hover:bg-hover-surface disabled:cursor-default disabled:opacity-40';
  return <div className="col-span-full flex flex-col items-center gap-3 border-t border-surface py-5">
    <p role="status" className="text-xs text-app-muted">Prikazano {(page - 1) * LISTINGS_PER_PAGE + 1}–{Math.min(page * LISTINGS_PER_PAGE, total)} od {total} oglasa</p>
    {pages > 1 && <nav aria-label="Stranice oglasa" className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
      <button type="button" className={button} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Prethodna stranica">‹</button>
      {numbers.map((n, i) => <span key={n} className="contents">
        {i > 0 && n - numbers[i - 1] > 1 && <span className="px-1 text-app-muted" aria-hidden="true">…</span>}
        <button type="button" aria-label={`Stranica ${n}`} aria-current={n === page ? 'page' : undefined} onClick={() => onChange(n)} className={`${button} ${n === page ? 'border-transparent bg-brand-500 text-on-accent hover:bg-brand-400' : 'text-app-secondary'}`}>{n}</button>
      </span>)}
      <button type="button" className={button} disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Sledeća stranica">›</button>
    </nav>}
  </div>;
}
