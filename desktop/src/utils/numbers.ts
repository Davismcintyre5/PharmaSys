export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function round(n: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Number(n) + Number.EPSILON) * factor) / factor;
}

export function percent(part: number, total: number): number {
  if (!total) return 0;
  return (part / total) * 100;
}

export function percentChange(current: number, previous: number): number {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + (Number(b) || 0), 0);
}

export function average(arr: number[]): number {
  if (!arr.length) return 0;
  return sum(arr) / arr.length;
}

export function formatCompact(n: number): string {
  const v = Number(n || 0);
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

export function toFixedSafe(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '0';
  return Number(n).toFixed(decimals);
}

export function parseIntSafe(value: unknown, fallback = 0): number {
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? fallback : n;
}

export function parseFloatSafe(value: unknown, fallback = 0): number {
  const n = parseFloat(String(value));
  return Number.isNaN(n) ? fallback : n;
}