import { Badge } from '@/components/ui/Badge';

interface StockBadgeProps {
  qty: number;
  reorderLevel?: number;
  size?: 'sm' | 'md';
}

/**
 * Colored pill for a stock quantity.
 *   red    → qty === 0       (out of stock)
 *   amber  → qty ≤ reorderLevel
 *   green  → otherwise
 * Shows "Out" when qty is 0, otherwise the number.
 */
export function StockBadge({ qty, reorderLevel = 0, size = 'md' }: StockBadgeProps) {
  const out = qty <= 0;
  const low = !out && reorderLevel > 0 && qty <= reorderLevel;

  const variant = out ? 'danger' : low ? 'warning' : 'success';

  return (
    <Badge variant={variant} className={size === 'sm' ? 'text-[10px]' : undefined}>
      {out ? 'Out of stock' : `${qty.toLocaleString()} in stock`}
    </Badge>
  );
}