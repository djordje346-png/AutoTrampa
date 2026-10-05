import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

/** Create the browser client only when a feature needs it, so public pages can
 * still render during static builds that don't have deployment secrets. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase nije podešen. Dodaj NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    browserClient = createBrowserClient(url, key, {
      auth: {
        autoRefreshToken: true,
        // Callback handlers exchange PKCE codes explicitly, and @supabase/ssr
        // persists sessions in cookies shared by browser and server.
        detectSessionInUrl: false,
        flowType: 'pkce',
        persistSession: true,
      },
    });
  }

  return browserClient;
}
