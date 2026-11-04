import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthRedirect } from '@/lib/auth-redirect';

function redirect(target: URL) {
  const response = NextResponse.redirect(target);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const requestedPath = request.nextUrl.searchParams.get('next');
  const redirectTarget = getAuthRedirect(request.url, requestedPath);

  if (!code) {
    redirectTarget.searchParams.set('auth', 'callback-error');
    return redirect(redirectTarget);
  }

  const response = redirect(redirectTarget);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    redirectTarget.searchParams.set('auth', 'callback-error');
    return redirect(redirectTarget);
  }

  const supabase = createServerClient(url, key, {
    auth: { flowType: 'pkce' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    redirectTarget.searchParams.set('auth', 'callback-error');
    return redirect(redirectTarget);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile && !profileError) {
    const metadata = data.user.user_metadata ?? {};
    const name = typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : '';
    await supabase.from('profiles').upsert({
      id: data.user.id,
      name,
      city: '',
      phone: '',
    });
  }

  return response;
}
