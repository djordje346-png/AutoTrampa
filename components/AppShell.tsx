'use client';

import { useAuth } from '@/hooks/use-auth';
import AuthScreen from '@/components/AuthScreen';
import Footer from '@/components/Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, mounted } = useAuth();

  // Loading state
  if (!mounted) {
    return (
      <main className="min-h-screen w-full bg-zinc-950 text-zinc-100">
        <div className="mx-auto min-h-screen w-full max-w-[1600px]" />
      </main>
    );
  }

  // Authentication screen
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen w-full bg-zinc-950 text-zinc-100">
        <div className="mx-auto min-h-screen w-full max-w-[1600px]">
          <AuthScreen />
        </div>
      </main>
    );
  }

  // Main application
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100">
      <main
        className="
          mx-auto
          min-h-screen
          w-full
          max-w-[1600px]
          px-4
          pb-28
          sm:px-5
          md:px-8
          md:pb-24
          lg:px-10
          xl:px-12
        "
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}