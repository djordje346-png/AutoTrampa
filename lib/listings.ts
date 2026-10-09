import { createClient } from '@supabase/supabase-js';
import { PUBLIC_CAR_ROW_COLUMNS, rowToCar, type CarRow } from '@/lib/car-row';
import type { Car } from '@/types';

/**
 * Server-side listing lookup.
 *
 * The route's server shell used to know only about the hardcoded demo cars in
 * `lib/cars.ts`, so a listing a user had actually created in Supabase rendered
 * entirely on the client: no per-listing metadata, and — once `dynamicParams`
 * was tightened — a 404 for every real id. Anything that needs a listing on the
 * server has to be able to read the database, so it lives here.
 *
 * This is a read-only anonymous client and it uses the same public projection
 * as the browse hooks (`PUBLIC_CAR_ROW_COLUMNS`, which only selects public fields),
 * so RLS and the column list stay the only gatekeepers.
 */

function serverCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

function serverClient() {
  const credentials = serverCredentials();
  if (!credentials) return null;
  // A fresh client per call: this runs on the server for one lookup, not as a
  // shared session holder. No session persistence, no token refresh.
  return createClient(credentials.url, credentials.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Reads one listing by id, or null when it does not exist / is unreachable. */
export async function fetchListingRow(id: string): Promise<CarRow | null> {
  const supabase = serverClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('cars')
      .select(PUBLIC_CAR_ROW_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data as unknown as CarRow;
  } catch {
    // A database outage must render as a plain 404, not as a 500 page.
    return null;
  }
}

/**
 * True for a value that can be a primary key of `public.cars` (uuid). The demo
 * ids are slugs, so anything else cannot exist in the database and skips the
 * round trip.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function fetchListing(id: string): Promise<Car | null> {
  if (!UUID_RE.test(id)) return null;
  const row = await fetchListingRow(id);
  return row ? rowToCar(row) : null;
}

/** Title and description shared by metadata and share previews. */
export function listingTitle(car: Car): string {
  // Cars added through the form can end up with a placeholder generation ('-'),
  // which must not leak into an <title> or a share card.
  const generation = car.generation && car.generation !== '-' && car.generation !== String(car.year)
    ? car.generation
    : '';
  return [car.year, car.brand, car.model, generation].filter(Boolean).join(' ');
}
