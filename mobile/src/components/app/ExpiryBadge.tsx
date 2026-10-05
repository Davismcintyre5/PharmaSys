import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { EXPIRY_THRESHOLDS } from '@/utils/constants';

interface ExpiryBadgeProps {
  expiryDate: string | Date | null | undefined;
}

function daysUntil(input: string | Date): number {
  const d = typeof input === 'string' ? new Date(input) : input;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export function ExpiryBadge({ expiryDate }: ExpiryBadgeProps) {
  if (!expiryDate) return <Badge variant="neutral">No expiry</Badge>;

  const days = daysUntil(expiryDate);

  if (days < 0) return <Badge variant="neutral">Expired</Badge>;
  if (days === 0) return <Badge variant="danger">Expires today</Badge>;
  if (days <= EXPIRY_THRESHOLDS.critical) return <Badge variant="danger">in {days}d</Badge>;
  if (days <= EXPIRY_THRESHOLDS.warning) return <Badge variant="warning">in {days}d</Badge>;
  return <Badge variant="success">in {days}d</Badge>;
}