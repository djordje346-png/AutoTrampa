'use client';

import Link from 'next/link';
import { ArrowLeftRight, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

export default function Header() {
  const { user, mounted, logout, requireAuth } = useAuth();
  const metadata = user?.user_metadata ?? {};
  const displayName =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    user?.email?.split('@')[0] ||
    'Korisnik';
  const avatar = typeof metadata.avatar_url === 'string'
    ? metadata.avatar_url
    : typeof metadata.picture === 'string'
      ? metadata.picture
      : null;

  async function handleLogout() {
    const result = await logout();
    if (result.ok) toast.success('Uspešno ste se odjavili.');
    else toast.error(result.message);
  }

  return (
    <header className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-5 md:px-8 lg:px-10 xl:px-12">
      <Link href="/" className="group flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/25 transition-transform duration-200 group-hover:scale-[1.03]">
          <ArrowLeftRight size={20} strokeWidth={2.5} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-heading text-base font-bold leading-tight text-app-primary dark:text-zinc-100">AutoTrampa</span>
          <span className="hidden text-[11px] text-app-muted sm:block">Platforma za zamenu automobila</span>
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        {!mounted ? (
          <span aria-hidden="true" className="h-10 w-24 animate-pulse rounded-xl bg-elevated dark:bg-zinc-900" />
        ) : user ? (
          <>
            <div className="flex items-center gap-2">
              {avatar ? (
                <img src={avatar} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full border border-orange-500/30 object-cover" />
              ) : (
                <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-sm font-bold text-orange-500">
                  {displayName.slice(0, 1).toLocaleUpperCase('sr')}
                </span>
              )}
              <span className="max-w-16 truncate text-xs font-semibold text-app-primary dark:text-zinc-100 sm:max-w-36 sm:text-sm">{displayName}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Odjavi se"
              className="inline-flex items-center gap-2 rounded-xl border border-surface bg-card-surface px-3 py-2.5 text-sm font-semibold text-app-secondary transition-all duration-200 hover:border-orange-500/50 hover:text-orange-500 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-orange-400"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Odjavi se</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => requireAuth('Prijavi se na AutoTrampu')}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition-all duration-200 hover:scale-[1.02] hover:bg-orange-600 active:scale-[0.98]"
          >
            <LogIn size={16} />
            Prijavi se
          </button>
        )}
      </div>
    </header>
  );
}
