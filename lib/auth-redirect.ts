/** A slash followed by a backslash can resolve to another host; verify origin. */
export function getAuthRedirect(requestUrl: string, requestedPath: string | null): URL {
  const fallback = new URL('/', requestUrl);
  if (!requestedPath?.startsWith('/')) return fallback;
  try {
    const target = new URL(requestedPath, requestUrl);
    return target.origin === fallback.origin ? target : fallback;
  } catch {
    return fallback;
  }
}
