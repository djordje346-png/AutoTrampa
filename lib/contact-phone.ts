import { isValidPhoneNumber, normalizePhoneNumber } from '@/lib/phone';

export type ContactPhoneStatus = 'loading' | 'available' | 'hidden' | 'missing' | 'not_found' | 'unavailable' | 'signed_out';

export interface ContactPhone {
  status: ContactPhoneStatus;
  phone: string | null;
  href: string | null;
}

export function emptyContactPhone(status: ContactPhoneStatus): ContactPhone {
  return { status, phone: null, href: null };
}

/** A denied or malformed response must never leave a callable number behind. */
export function parseContactPhone(value: unknown): ContactPhone {
  if (!value || typeof value !== 'object') return emptyContactPhone('unavailable');
  const response = value as { status?: unknown; phone?: unknown };
  if (response.status === 'available') {
    if (typeof response.phone !== 'string' || !isValidPhoneNumber(response.phone)) {
      return emptyContactPhone('unavailable');
    }
    const phone = normalizePhoneNumber(response.phone);
    return { status: 'available', phone, href: `tel:${phone}` };
  }
  if (response.status === 'hidden' || response.status === 'missing' || response.status === 'not_found') {
    return emptyContactPhone(response.status);
  }
  return emptyContactPhone('unavailable');
}

export function contactPhoneMessage(status: ContactPhoneStatus): string | null {
  switch (status) {
    case 'available': return null;
    case 'loading': return 'Proveravamo dostupnost broja telefona…';
    case 'signed_out': return 'Prijavi se da proveriš dostupnost broja telefona vlasnika.';
    case 'hidden': return 'Vlasnik deli broj tek posle dogovorene zamene. Potvrda zamene još nije podržana; kontaktiraj ga porukom.';
    case 'missing': return 'Vlasnik nema dostupan broj telefona. Kontaktiraj ga porukom.';
    case 'not_found': return 'Broj telefona nije dostupan za ovaj oglas ili razgovor.';
    default: return 'Broj telefona trenutno nije dostupan. Pokušaj ponovo ili pošalji poruku.';
  }
}

export function isContactTargetId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
