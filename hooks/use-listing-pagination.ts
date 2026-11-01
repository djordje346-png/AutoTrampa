'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export const LISTINGS_PER_PAGE = 9;

export function listingPage(value: string | null, pages: number) {
  const number = value && /^\d+$/.test(value) ? Number(value) : 1;
  return Math.max(1, Math.min(Number.isSafeInteger(number) ? number : 1, Math.max(1, pages)));
}

/** Page URLs survive opening an advert and returning via browser navigation. */
export function useListingPagination<T>(items: T[], resetKey: string, ready: boolean) {
  const router = useRouter();
  const pages = Math.max(1, Math.ceil(items.length / LISTINGS_PER_PAGE));
  const [state, setState] = useState({ key: resetKey, page: 1 });
  const previousKey = useRef<string | null>(null);
  const page = state.key === resetKey ? Math.min(state.page, pages) : 1;

  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    const changed = previousKey.current !== null && previousKey.current !== resetKey;
    previousKey.current = resetKey;
    const next = changed ? 1 : listingPage(url.searchParams.get('page'), pages);
    setState(previous => previous.key === resetKey && previous.page === next ? previous : { key: resetKey, page: next });
    if (changed || (url.searchParams.has('page') && url.searchParams.get('page') !== String(next))) {
      if (next === 1) url.searchParams.delete('page');
      else url.searchParams.set('page', String(next));
      router.replace(url.pathname + url.search + url.hash, { scroll: false });
    }
    const restore = () => setState({ key: resetKey, page: listingPage(new URL(window.location.href).searchParams.get('page'), pages) });
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [ready, resetKey, pages, router]);

  function changePage(next: number) {
    const resolved = listingPage(String(next), pages);
    if (resolved === page) return;
    const url = new URL(window.location.href);
    if (resolved === 1) url.searchParams.delete('page');
    else url.searchParams.set('page', String(resolved));
    setState({ key: resetKey, page: resolved });
    router.push(url.pathname + url.search + url.hash, { scroll: false });
    requestAnimationFrame(() => document.getElementById('listing-results')?.scrollIntoView({ block: 'start' }));
  }

  return { page, changePage, items: items.slice((page - 1) * LISTINGS_PER_PAGE, page * LISTINGS_PER_PAGE) };
}
