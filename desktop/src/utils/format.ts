import { format as fnsFormat, formatDistanceToNowStrict, parseISO } from 'date-fns';

export function formatMoney(amount: number, currency = 'KES'): string {
  const n = Number(amount || 0);
  return `${currency} ${n.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatMoneyCompact(amount: number, currency = 'KES'): string {
  const n = Number(amount || 0);
  if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${currency} ${(n / 1_000).toFixed(1)}K`;
  return `${currency} ${n.toFixed(0)}`;
}

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? parseISO(input) : input;
  return fnsFormat(d, 'dd MMM yyyy');
}

export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? parseISO(input) : input;
  return fnsFormat(d, 'dd MMM yyyy, HH:mm');
}

export function formatTime(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? parseISO(input) : input;
  return fnsFormat(d, 'HH:mm');
}

export function formatRelativeTime(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? parseISO(input) : input;
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) {
    return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return `+${digits}`;
}

export function formatNameInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?';
}

export function formatTruncate(str: string | null | undefined, max = 40): string {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

export function formatPercentage(n: number, decimals = 1): string {
  return `${Number(n || 0).toFixed(decimals)}%`;
}

export function formatFileSize(bytes: number | null | undefined): string {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}