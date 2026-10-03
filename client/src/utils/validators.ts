export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function isValidKenyanPhone(value: string): boolean {
  const digits = String(value || '').replace(/\D/g, '');
  return /^254(7|1)\d{8}$/.test(digits);
}

export function isValidPhone(value: string): boolean {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
}

export function isValidObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(String(value || ''));
}

export function isValidBarcode(value: string): boolean {
  const s = String(value || '').trim();
  return s.length >= 6 && s.length <= 40;
}

export function isValidTaxRate(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

export function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export interface PasswordStrength {
  ok: boolean;
  score: number;
  reasons: string[];
}

export function isStrongPassword(value: string): PasswordStrength {
  const reasons: string[] = [];
  const s = String(value || '');
  let score = 0;

  if (s.length >= 8) score++;
  else reasons.push('At least 8 characters');

  if (/[A-Z]/.test(s)) score++;
  else reasons.push('One uppercase letter');

  if (/[a-z]/.test(s)) score++;
  else reasons.push('One lowercase letter');

  if (/\d/.test(s)) score++;
  else reasons.push('One number');

  if (/[^A-Za-z0-9]/.test(s)) score++;
  else reasons.push('One symbol');

  return { ok: score >= 3 && s.length >= 8, score, reasons };
}