import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { ExpiryBadge } from '@/components/app/ExpiryBadge';
import { inventoryApi } from '@/api/inventory';
import { formatDate, formatMoney } from '@/utils/format';
import { EXPIRY_THRESHOLDS } from '@/utils/constants';
import type { Batch } from '@/types';

const WINDOWS = [7, 14, 30, 60, 90] as const;
type WindowKey = (typeof WINDOWS)[number];

export default function Expiring() {
  const [days, setDays] = useState<WindowKey>(30);
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const list = await inventoryApi.drugs
      .expiring({ days })
      .catch(() => []);
    setBatches(Array.isArray(list) ? list : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const { totalValue, criticalCount, warningCount } = useMemo(() => {
    const list = batches || [];
    const now = Date.now();
    let totalValue = 0;
    let criticalCount = 0;
    let warningCount = 0;
    for (const b of list) {
      const qty = b.qty || 0;
      const cost = b.costPrice || 0;
      totalValue += qty * cost;

      const d = new Date(b.expiryDate).getTime();
      const daysLeft = Math.ceil((d - now) / 86_400_000);
      if (daysLeft <= EXPIRY_THRESHOLDS.critical) criticalCount++;
      else if (daysLeft <= EXPIRY_THRESHOLDS.warning) warningCount++;
    }
    return { totalValue, criticalCount, warningCount };
  }, [batches]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Expiring soon"
        subtitle={
          batches
            ? `${batches.length} batch${batches.length === 1 ? '' : 'es'} expiring in ${days} days`
            : 'Loading…'
        }
        breadcrumb={
          <Link to="/app/inventory" className="inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Inventory
          </Link>
        }
      />

      {/* Window selector */}
      <Card className="mb-4" plain>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted">Window:</span>
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                days === w
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text'
              }`}
            >
              {w} days
            </button>
          ))}
        </div>
      </Card>

      {/* Summary */}
      {batches && batches.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Value at risk"
            value={formatMoney(totalValue, 'KES')}
            sub="at cost price"
            tint="warning"
          />
          <SummaryCard
            label={`Critical (≤ ${EXPIRY_THRESHOLDS.critical}d)`}
            value={String(criticalCount)}
            sub="batches expiring very soon"
            tint="danger"
          />
          <SummaryCard
            label={`Warning (≤ ${EXPIRY_THRESHOLDS.warning}d)`}
            value={String(warningCount)}
            sub="batches to plan for"
            tint="warning"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !batches?.length ? (
        <Card>
          <EmptyState
            icon={<CalendarClock size={22} />}
            title="Nothing expiring"
            description={`No batches expire within the next ${days} days. Try a wider window.`}
          />
        </Card>
      ) : (
        <Card plain className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Drug</TH>
                <TH>Lot</TH>
                <TH>Qty</TH>
                <TH>Expiry</TH>
                <TH>Value</TH>
              </TR>
            </THead>
            <TBody>
              {batches.map((b) => {
                const drug = b.drugId as any;
                const drugName = typeof drug === 'object' ? drug?.name : null;
                const drugId = typeof drug === 'object' ? drug?._id : drug;
                const value = (b.qty || 0) * (b.costPrice || 0);

                return (
                  <TR key={b._id}>
                    <TD>
                      {drugId ? (
                        <Link
                          to={`/app/inventory/${drugId}`}
                          className="truncate text-sm font-medium text-text hover:text-primary"
                        >
                          {drugName || 'Unknown drug'}
                        </Link>
                      ) : (
                        <span className="text-sm text-text-muted">—</span>
                      )}
                    </TD>
                    <TD>
                      <span className="font-mono text-xs text-text-muted">
                        {b.lotNo || '—'}
                      </span>
                    </TD>
                    <TD>
                      <span className="text-sm font-medium text-text">{b.qty}</span>
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">
                          {formatDate(b.expiryDate)}
                        </span>
                        <ExpiryBadge expiryDate={b.expiryDate} />
                      </div>
                    </TD>
                    <TD>
                      <span className="text-xs text-text-muted">
                        {formatMoney(value, 'KES')}
                      </span>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}

      {batches && batches.length > 0 && (
        <Card className="mt-4">
          <div className="flex items-start gap-2 text-xs text-text-muted">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-text">What to do</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>Discount near-expiry stock to move it faster</li>
                <li>Transfer to a busier branch if you have multiple locations</li>
                <li>Return to supplier if the batch is unopened and within policy</li>
                <li>Write off expired stock from the drug detail page</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tint,
}: {
  label: string;
  value: string;
  sub: string;
  tint: 'warning' | 'danger';
}) {
  const TINTS: Record<string, string> = {
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TINTS[tint]}`}
        >
          <AlertTriangle size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-muted">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-text">{value}</p>
          <p className="mt-0.5 text-[10px] text-text-subtle">{sub}</p>
        </div>
      </div>
    </Card>
  );
}