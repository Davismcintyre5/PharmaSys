import React from 'react';
import { Badge } from '@/components/ui/Badge';

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const VARIANTS: Record<string, Variant> = {
  active: 'success',
  approved: 'success',
  completed: 'success',
  paid: 'success',
  dispensed: 'success',
  received: 'success',
  online: 'success',
  available: 'success',

  pending: 'warning',
  pending_user: 'warning',
  pending_verification: 'warning',
  partially_refunded: 'warning',
  partial: 'warning',
  draft: 'warning',
  overdue: 'warning',
  past_due: 'warning',
  low: 'warning',

  sent: 'info',
  ordered: 'info',
  refunded: 'info',
  in_progress: 'info',

  failed: 'danger',
  rejected: 'danger',
  cancelled: 'danger',
  voided: 'danger',
  suspended: 'danger',
  expired: 'danger',
  offline: 'danger',
  critical: 'danger',
  high: 'danger',
  urgent: 'danger',
  dead: 'danger',
  sold: 'danger',

  inactive: 'neutral',
  inactive_user: 'neutral',
  retired: 'neutral',
  maintenance: 'neutral',
  unavailable: 'neutral',
  medium: 'neutral',
};

const LABELS: Record<string, string> = {
  pending_user: 'Pending',
  partially_refunded: 'Partial refund',
  in_progress: 'In progress',
  pending_verification: 'Verifying',
  past_due: 'Past due',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  style?: any;
}

export function StatusBadge({ status, label, style }: StatusBadgeProps) {
  const variant = VARIANTS[status] ?? 'neutral';
  const text = label ?? LABELS[status] ?? status.replace(/_/g, ' ');
  return (
    <Badge variant={variant} style={style}>
      {text}
    </Badge>
  );
}