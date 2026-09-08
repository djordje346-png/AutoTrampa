/**
 * Safe localStorage access.
 *
 * The app persists everything client-side, so a failed write is a real product
 * event (usually a blown quota from base64 images), not something to swallow.
 * Callers get a typed result and can surface it to the user.
 */

export type StorageFailure = 'unavailable' | 'quota' | 'serialize';

export type StorageResult =
  | { ok: true }
  | { ok: false; reason: StorageFailure };

const OK: StorageResult = { ok: true };

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    // Safari private mode / blocked site data
    return null;
  }
}

function isQuotaError(err: unknown): boolean {
  if (!(err instanceof DOMException)) return false;
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    err.code === 1014
  );
}

export function isStorageAvailable(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    const probe = '__autotrampa_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  const store = storage();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): StorageResult {
  const store = storage();
  if (!store) return { ok: false, reason: 'unavailable' };

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return { ok: false, reason: 'serialize' };
  }

  try {
    store.setItem(key, serialized);
    return OK;
  } catch (err) {
    return { ok: false, reason: isQuotaError(err) ? 'quota' : 'unavailable' };
  }
}

export function removeKey(key: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    // nothing useful to do
  }
}

/** Rough size of everything this app has stored, in bytes (UTF-16 chars × 2). */
export function estimateUsageBytes(prefix = 'autotrampa_'): number {
  const store = storage();
  if (!store) return 0;
  let total = 0;
  try {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      total += (key.length + (store.getItem(key)?.length ?? 0)) * 2;
    }
  } catch {
    return total;
  }
  return total;
}

export const STORAGE_ERROR_MESSAGES: Record<StorageFailure, string> = {
  quota:
    'Memorija pregledača je puna. Obriši nekoliko fotografija ili vozila pa pokušaj ponovo.',
  unavailable:
    'Pregledač ne dozvoljava čuvanje podataka. Promene neće biti sačuvane.',
  serialize: 'Podatke nije moguće sačuvati.',
};
