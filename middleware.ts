import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * Refreshes the Supabase session cookie on navigation.
 *
 * The browser client writes the session into cookies (@supabase/ssr), but it
 * only refreshes the access token while a tab is open. Without this the cookie
 * can be stale on the first server render after a day away, so anything that
 * later reads the session on the server would see an anonymous user.
 *
 * Two invariants from the Supabase SSR guide, both load-bearing:
 *  - never run code between `createServerClient` and `getUser()`; the token
 *    refresh has to reach the response before anything else can throw;
 *  - always return the response you wrote the cookies to, not the request's.
 *
 * Deliberately fail-open: a Supabase outage or bad configuration must degrade
 * to anonymous browsing, never to an unreachable app. The client-side session
 * remains the source of truth for every screen.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const supabase = createServerClient(url, key, {
      auth: { flowType: 'pkce' },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // Touching getUser() is what triggers the refresh.
    await supabase.auth.getUser();
  } catch {
    // Keep serving the request; the client will re-authenticate on demand.
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files, so a page navigation
     * always refreshes the session but the CDN paths never pay for it.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
