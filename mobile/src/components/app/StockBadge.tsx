import React from 'react';
import { Badge } from '@/components/ui/Badge';

interface StockBadgeProps {
  qty: number;
  reorderLevel?: number;
  size?: 'sm' | 'md';
}

export function StockBadge({ qty, reorderLevel = 0, size = 'md' }: StockBadgeProps) {
  const out = qty <= 0;
  const low = !out && reorderLevel > 0 && qty <= reorderLevel;

  const variant = out ? 'danger' : low ? 'warning' : 'success';

  const label = out ? 'Out of stock' : `${qty.toLocaleString()} in stock`;

  return (
    <Badge variant={variant} style={size === 'sm' ? { paddingVertical: 1 } : undefined}>
      {label}
    </Badge>
  );
}