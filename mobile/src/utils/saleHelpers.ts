import type { Sale } from '@/types';

/**
 * Sale fields can be either raw ObjectIds or populated objects,
 * depending on which endpoint returned them.
 * These helpers safely extract display names.
 */

export function getCustomerName(sale: Sale): string | null {
  const c = sale.customerId;
  if (!c) return null;
  if (typeof c === 'string') return null;
  return c.name || null;
}

export function getCustomerPhone(sale: Sale): string | null {
  const c = sale.customerId;
  if (!c) return null;
  if (typeof c === 'string') return null;
  return c.phone || null;
}

export function getPatientName(sale: Sale): string | null {
  const p = sale.patientId;
  if (!p) return null;
  if (typeof p === 'string') return null;
  return p.name || null;
}

export function getPatientPhone(sale: Sale): string | null {
  const p = sale.patientId;
  if (!p) return null;
  if (typeof p === 'string') return null;
  return p.phone || null;
}

export function getCashierName(sale: Sale): string | null {
  const c = sale.cashierId;
  if (!c) return null;
  if (typeof c === 'string') return null;
  return c.fullName || null;
}

export function getBranchName(sale: Sale): string | null {
  const b = sale.branchId;
  if (!b) return null;
  if (typeof b === 'string') return null;
  return b.name || null;
}

export function getBranchAddress(sale: Sale): string | null {
  const b = sale.branchId;
  if (!b) return null;
  if (typeof b === 'string') return null;
  return b.address || null;
}

export function getBranchPhone(sale: Sale): string | null {
  const b = sale.branchId;
  if (!b) return null;
  if (typeof b === 'string') return null;
  return b.phone || null;
}

/**
 * The name to print on a receipt under "Customer".
 * Prefers the customer, falls back to the patient, then null.
 */
export function getReceiptCustomerName(sale: Sale): string | null {
  return getCustomerName(sale) || getPatientName(sale) || null;
}