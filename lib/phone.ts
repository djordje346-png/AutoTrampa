export function isValidPhoneNumber(value: string): boolean {
  const input = value.trim();
  if (!/^(?:\+|00)?[0-9][0-9\s()/-]*$/.test(input)) return false;
  const phone = normalizePhoneNumber(value);
  const digits = phone.replace(/\D/g, '');
  return /^\+?\d+$/.test(phone) && digits.length >= 7 && digits.length <= 15;
}

/** Normalize common international input without guessing a country code. */
export function normalizePhoneNumber(value: string): string {
  const compact = value.trim().replace(/[\s()/-]/g, '');
  if (compact.startsWith('00')) return `+${compact.slice(2).replace(/\D/g, '')}`;
  if (compact.startsWith('+')) return `+${compact.slice(1).replace(/\D/g, '')}`;
  return compact.replace(/\D/g, '');
}
