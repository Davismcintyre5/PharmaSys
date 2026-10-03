export type ColorKey = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface ColorTriple {
  text: string;
  bg: string;
  border: string;
}

const TRIPLES: Record<ColorKey, ColorTriple> = {
  success: { text: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  danger: { text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
  info: { text: 'text-info', bg: 'bg-info/10', border: 'border-info/30' },
  neutral: { text: 'text-text-muted', bg: 'bg-surface-2', border: 'border-border' },
};

export function statusTriple(status: ColorKey | string | null | undefined): ColorTriple {
  const key = (status || 'neutral') as ColorKey;
  return TRIPLES[key] || TRIPLES.neutral;
}

export function userStatusColor(status: string): ColorKey {
  switch (status) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'suspended':
    case 'rejected': return 'danger';
    default: return 'neutral';
  }
}

export function tenantStatusColor(status: string): ColorKey {
  switch (status) {
    case 'active': return 'success';
    case 'pending_user': return 'warning';
    case 'suspended':
    case 'rejected':
    case 'expired': return 'danger';
    default: return 'neutral';
  }
}

export function saleStatusColor(status: string): ColorKey {
  switch (status) {
    case 'completed': return 'success';
    case 'partially_refunded': return 'warning';
    case 'refunded': return 'info';
    case 'voided': return 'danger';
    default: return 'neutral';
  }
}

export function prescriptionStatusColor(status: string): ColorKey {
  switch (status) {
    case 'dispensed': return 'success';
    case 'pending': return 'warning';
    case 'partial': return 'info';
    case 'cancelled': return 'danger';
    default: return 'neutral';
  }
}

export function purchaseOrderStatusColor(status: string): ColorKey {
  switch (status) {
    case 'received': return 'success';
    case 'ordered': return 'info';
    case 'draft': return 'warning';
    case 'cancelled': return 'danger';
    default: return 'neutral';
  }
}

export function invoiceStatusColor(status: string): ColorKey {
  switch (status) {
    case 'paid': return 'success';
    case 'sent': return 'info';
    case 'overdue': return 'danger';
    case 'cancelled': return 'neutral';
    default: return 'neutral';
  }
}

export function subscriptionStatusColor(status: string): ColorKey {
  switch (status) {
    case 'active':
    case 'perpetual': return 'success';
    case 'past_due': return 'warning';
    case 'expired':
    case 'cancelled': return 'danger';
    default: return 'neutral';
  }
}

export function stockLevelColor(qty: number, reorderLevel: number): ColorKey {
  if (qty <= 0) return 'danger';
  if (reorderLevel > 0 && qty <= reorderLevel) return 'warning';
  return 'success';
}

export function expiryColor(daysLeft: number): ColorKey {
  if (daysLeft <= 7) return 'danger';
  if (daysLeft <= 30) return 'warning';
  return 'success';
}

export function roleColor(role: string): ColorKey {
  switch (role) {
    case 'owner': return 'info';
    case 'branch_manager': return 'success';
    case 'cashier': return 'neutral';
    default: return 'neutral';
  }
}

export function daysUntil(dateIso: string | null | undefined): number {
  if (!dateIso) return 0;
  const diff = new Date(dateIso).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}