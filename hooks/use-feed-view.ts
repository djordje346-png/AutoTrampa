'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type FeedView = 'grid' | 'swipe';

/** Both feed destinations share the same page, filters, car and pagination. */
export function useFeedView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const viewMode: FeedView = params.get('view') === 'swipe' ? 'swipe' : 'grid';

  const hrefForView = useCallback((view: FeedView) => {
    const next = new URLSearchParams(pathname === '/' ? params.toString() : '');
    if (view === 'swipe') next.set('view', 'swipe');
    else next.delete('view');
    const query = next.toString();
    return query ? `/?${query}` : '/';
  }, [params, pathname]);

  const setViewMode = useCallback((view: FeedView) => {
    router.push(hrefForView(view), { scroll: false });
  }, [hrefForView, router]);

  return { viewMode, setViewMode, hrefForView };
}
