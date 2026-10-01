export function isValidPhoneNumber(value: string): boolean {
  const phone = value.trim();
  const digits = phone.replace(/\D/g, '');
  return /^\+?[0-9][0-9\s()/-]*$/.test(phone) && digits.length >= 7 && digits.length <= 15;
}
