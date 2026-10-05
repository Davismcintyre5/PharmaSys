import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  PackagePlus,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { StockBadge } from '@/components/app/StockBadge';
import { RestockModal } from '@/components/app/RestockModal';
import { inventoryApi } from '@/api/inventory';
import { useAuth } from '@/context/AuthProvider';
import { hasPermission } from '@/utils/permissions';
import { DRUG_FORM_LABELS } from '@/utils/constants';
import type { Drug } from '@/types';

export default function LowStock() {
  const { user } = useAuth();
  const canReceive = hasPermission(user?.role, 'inventory.receive');

  const [drugs, setDrugs] = useState<Drug[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [restocking, setRestocking] = useState<Drug | null>(null);

  async function load() {
    const list = await inventoryApi.drugs.lowStock().catch(() => []);
    setDrugs(Array.isArray(list) ? list : []);
    return list;
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!drugs) return [];
    const q = search.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter((d) => {
      const name = d.name?.toLowerCase() || '';
      const generic = d.generic?.toLowerCase() || '';
      const category = d.category?.toLowerCase() || '';
      return name.includes(q) || generic.includes(q) || category.includes(q);
    });
  }, [drugs, search]);

  const outCount = useMemo(
    () => (drugs || []).filter((d) => ((d as any).currentQty ?? 0) <= 0).length,
    [drugs]
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Low stock"
        subtitle={
          drugs
            ? `${drugs.length} item${drugs.length === 1 ? '' : 's'} need restocking${
                outCount ? ` · ${outCount} out of stock` : ''
              }`
            : 'Loading…'
        }
        breadcrumb={
          <Link to="/app/inventory" className="inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Inventory
          </Link>
        }
      />

      <Card className="mb-4" plain>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={14} />}
          placeholder="Search by name, generic, or category…"
        />
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !filtered.length ? (
        <Card>
          <EmptyState
            icon={<AlertTriangle size={22} />}
            title={search ? 'No matches' : 'All stocked up'}
            description={
              search
                ? 'Try a different name or category.'
                : 'No drugs are below their reorder level. Keep it up.'
            }
          />
        </Card>
      ) : (
        <Card plain className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Drug</TH>
                <TH>Form</TH>
                <TH>Current</TH>
                <TH>Reorder at</TH>
                <TH>Gap</TH>
                {canReceive && <TH className="text-right">Actions</TH>}
              </TR>
            </THead>
            <TBody>
              {filtered.map((d) => {
                const currentQty = (d as any).currentQty ?? 0;
                const gap = Math.max(0, (d.reorderLevel || 0) - currentQty);
                return (
                  <TR key={d._id}>
                    <TD>
                      <div className="min-w-0">
                        <Link
                          to={`/app/inventory/${d._id}`}
                          className="truncate text-sm font-medium text-text hover:text-primary"
                        >
                          {d.name}
                          {d.strength && (
                            <span className="ml-1 font-normal text-text-muted">
                              {d.strength}
                            </span>
                          )}
                        </Link>
                        <p className="truncate text-xs text-text-muted">
                          {[d.generic, d.category].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                    </TD>
                    <TD>
                      <span className="text-xs text-text-muted">
                        {DRUG_FORM_LABELS[d.form] || d.form}
                      </span>
                    </TD>
                    <TD>
                      <StockBadge qty={currentQty} reorderLevel={d.reorderLevel} size="sm" />
                    </TD>
                    <TD>
                      <span className="text-sm text-text-muted">
                        {d.reorderLevel || 0}
                      </span>
                    </TD>
                    <TD>
                      <span
                        className={
                          gap > 0
                            ? 'text-sm font-medium text-danger'
                            : 'text-sm text-text-subtle'
                        }
                      >
                        {gap > 0 ? `+${gap} needed` : '—'}
                      </span>
                    </TD>
                    {canReceive && (
                      <TD className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<PackagePlus size={12} />}
                          onClick={() => setRestocking(d)}
                        >
                          Restock
                        </Button>
                      </TD>
                    )}
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}

      <RestockModal
        open={restocking !== null}
        drug={restocking}
        currentQty={(restocking as any)?.currentQty ?? 0}
        onClose={() => setRestocking(null)}
        onSuccess={() => load()}
      />
    </div>
  );
}