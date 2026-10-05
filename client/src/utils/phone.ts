/**
 * Kenyan phone utilities.
 * Canonical form: 254712345678 (E.164 without '+', what Daraja expects).
 */

export function normalizeKenyanPhone(input: string | null | undefined): string | null {
  if (!input) return null;

  let digits = String(input).replace(/\D/g, '');

  // Strip international 00 prefix
  if (digits.startsWith('00')) digits = digits.slice(2);

  // 07XXXXXXXX / 01XXXXXXXX  -> 2547XXXXXXXX / 2541XXXXXXXX
  if (digits.startsWith('0') && digits.length === 10) {
    digits = `254${digits.slice(1)}`;
  }
  // 7XXXXXXXX / 1XXXXXXXX (missing leading 0)
  else if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) {
    digits = `254${digits}`;
  }

  // Final shape check
  if (!/^254(7|1)\d{8}$/.test(digits)) return null;

  return digits;
}

export function formatKenyanPhoneDisplay(input: string | null | undefined): string {
  const n = normalizeKenyanPhone(input);
  if (!n) return '';
  return `+${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;
}

export function isValidKenyanPhone(input: string | null | undefined): boolean {
  return normalizeKenyanPhone(input) !== null;
}