'use client';

import { useAuth } from '@/hooks/use-auth';
import AuthOverlay from '@/components/AuthOverlay';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import RequiredPhoneModal from '@/components/RequiredPhoneModal';
import { useUser } from '@/hooks/use-user';

/**
 * Browsing is public: listings render on the server so they can be shared and
 * indexed. Sign-in is asked for at the moment an action needs an identity —
 * see `requireAuth` in use-auth — not as a wall in front of the app.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { promptOpen, user, mounted } = useAuth();
  const { user: profile, profileReady } = useUser();
  const requiresPhone = mounted && Boolean(user) && profileReady && !profile.phone.trim();

  return (
    <div className="min-h-screen w-full bg-app text-app-primary dark:bg-zinc-950 dark:text-zinc-100">
      <a
        href="#sadrzaj"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-black"
      >
        Preskoči na sadržaj
      </a>

      <main
        id="sadrzaj"
        className="
          mx-auto
          min-h-screen
          w-full
          max-w-[1600px]
          pb-28
          md:pb-24
        "
      >
        {children}
      </main>

      <Footer />
      {promptOpen && <AuthOverlay />}
      <RequiredPhoneModal open={requiresPhone} />
      <Toaster />
    </div>
  );
}
