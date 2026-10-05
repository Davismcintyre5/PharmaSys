import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Package,
  Plus,
  Search,
  Send,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { purchaseOrderApi } from '@/api/purchaseOrder';
import { supplierApi } from '@/api/supplier';
import { inventoryApi } from '@/api/inventory';
import { useToast } from '@/hooks/useToast';
import { formatMoney } from '@/utils/format';
import { cn } from '@/components/ui/_cn';
import type { Supplier, Drug } from '@/types';

interface LineDraft {
  id: string;
  drug: Drug | null;
  qty: string;
  costPrice: string;
}

function newLine(): LineDraft {
  return {
    id: Math.random().toString(36).slice(2),
    drug: null,
    qty: '1',
    costPrice: '',
  };
}

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const toast = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([newLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    supplierApi
      .list()
      .then((list) => setSuppliers(Array.isArray(list) ? list : []))
      .catch(() => setSuppliers([]))
      .finally(() => setSuppliersLoading(false));
  }, []);

  function addLine() {
    setLines((prev) => [...prev, newLine()]);
  }

  function removeLine(id: string) {
    setLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)
    );
  }

  function patchLine(id: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!supplierId) list.push('Pick a supplier');

    const validLines = lines.filter((l) => l.drug);
    if (!validLines.length) list.push('Add at least one drug');

    for (const line of validLines) {
      const q = Number(line.qty);
      if (!Number.isFinite(q) || q <= 0) {
        list.push(`${line.drug!.name}: quantity must be greater than 0`);
      }
      const c = Number(line.costPrice);
      if (line.costPrice === '' || !Number.isFinite(c) || c < 0) {
        list.push(`${line.drug!.name}: enter a cost price`);
      }
    }

    return list;
  }, [supplierId, lines]);

  const valid = errors.length === 0;

  const totals = useMemo(() => {
    const items = lines
      .filter((l) => l.drug)
      .map((l) => {
        const q = Number(l.qty) || 0;
        const c = Number(l.costPrice) || 0;
        return { qty: q, cost: c, subtotal: q * c };
      });
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const units = items.reduce((s, i) => s + i.qty, 0);
    return { subtotal, total: subtotal, units, lineCount: items.length };
  }, [lines]);

  async function submit({ sendNow = false }: { sendNow?: boolean } = {}) {
    setAttempted(true);
    if (!valid) {
      toast.error(errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      const po = await purchaseOrderApi.create({
        supplierId,
        items: lines
          .filter((l) => l.drug)
          .map((l) => ({
            drugId: l.drug!._id,
            qty: Number(l.qty),
            costPrice: Number(l.costPrice),
            total: Number(l.qty) * Number(l.costPrice),
          })),
        notes: notes.trim() || undefined,
      });

      if (sendNow) {
        try {
          await purchaseOrderApi.send(po._id);
          toast.success('Purchase order sent to supplier');
        } catch (e: any) {
          toast.error(
            `Draft saved, but sending failed: ${e?.message || 'unknown error'}`
          );
        }
      } else {
        toast.success('Draft saved');
      }

      navigate(`/app/purchase-orders/${po._id}`, { replace: true });
    } catch (e: any) {
      toast.error(e?.message || 'Could not create purchase order');
    } finally {
      setSubmitting(false);
    }
  }

  const supplierOptions = [
    { value: '', label: suppliersLoading ? 'Loading…' : 'Select a supplier…' },
    ...suppliers.map((s) => ({ value: s._id, label: s.name })),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New purchase order"
        subtitle="Raise an order to restock from a supplier"
        breadcrumb={
          <Link
            to="/app/purchase-orders"
            className="inline-flex items-center gap-1"
          >
            <ArrowLeft size={12} /> Purchase orders
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<FileText size={14} />}
              disabled={submitting}
              onClick={() => submit({ sendNow: false })}
            >
              Save as draft
            </Button>
            <Button
              leftIcon={<Send size={14} />}
              loading={submitting}
              disabled={submitting}
              onClick={() => submit({ sendNow: true })}
            >
              Save &amp; send
            </Button>
          </div>
        }
      />

      {attempted && !valid && (
        <Alert variant="warning" className="mb-4">
          <ul className="list-inside list-disc space-y-0.5 text-xs">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Card className="mb-4">
        <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Truck size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text">Supplier</h2>
            <p className="text-xs text-text-muted">
              Who will fulfil this order — required
            </p>
          </div>
        </div>

        {suppliersLoading ? (
          <div className="text-sm text-text-muted">Loading suppliers…</div>
        ) : suppliers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-2 p-4 text-center text-sm text-text-muted">
            No suppliers yet.{' '}
            <Link
              to="/app/suppliers"
              className="text-primary underline-offset-4 hover:underline"
            >
              Add a supplier
            </Link>{' '}
            first.
          </div>
        ) : (
          <FormField label="Supplier" required>
            <Select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              options={supplierOptions}
            />
          </FormField>
        )}
      </Card>

      <Card className="mb-4">
        <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">Items</h2>
              <p className="text-xs text-text-muted">
                {totals.lineCount} line{totals.lineCount === 1 ? '' : 's'} ·{' '}
                {totals.units} unit{totals.units === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus size={12} />}
            onClick={addLine}
          >
            Add line
          </Button>
        </div>

        <div className="space-y-3">
          {lines.map((line, idx) => (
            <LineRow
              key={line.id}
              index={idx}
              line={line}
              canRemove={lines.length > 1}
              onPatch={(p) => patchLine(line.id, p)}
              onRemove={() => removeLine(line.id)}
            />
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <FormField
          label="Notes"
          hint="Optional — delivery instructions, payment terms, etc."
        >
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Deliver to Main Branch by Friday. Invoice on delivery."
          />
        </FormField>
      </Card>

      <Card className="mb-6">
        <div className="ml-auto max-w-sm space-y-1 text-sm">
          <Row label="Lines" value={String(totals.lineCount)} />
          <Row label="Total units" value={String(totals.units)} />
          <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold text-text">
            <span>Total</span>
            <span>{formatMoney(totals.total, 'KES')}</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-col justify-end gap-2 sm:hidden">
        <Button
          variant="outline"
          fullWidth
          leftIcon={<FileText size={14} />}
          disabled={submitting}
          onClick={() => submit({ sendNow: false })}
        >
          Save as draft
        </Button>
        <Button
          fullWidth
          leftIcon={<Send size={14} />}
          loading={submitting}
          disabled={submitting}
          onClick={() => submit({ sendNow: true })}
        >
          Save &amp; send
        </Button>
      </div>
    </div>
  );
}

function LineRow({
  index,
  line,
  canRemove,
  onPatch,
  onRemove,
}: {
  index: number;
  line: LineDraft;
  canRemove: boolean;
  onPatch: (patch: Partial<LineDraft>) => void;
  onRemove: () => void;
}) {
  const [picking, setPicking] = useState(false);

  const lineTotal = useMemo(() => {
    const q = Number(line.qty) || 0;
    const c = Number(line.costPrice) || 0;
    return q * c;
  }, [line.qty, line.costPrice]);

  if (picking) {
    return (
      <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
        <DrugPicker
          onPick={(d) => {
            const prefillCost =
              line.costPrice || (d.lastCostPrice ? String(d.lastCostPrice) : '');
            onPatch({ drug: d, costPrice: prefillCost });
            setPicking(false);
          }}
          onCancel={() => setPicking(false)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-text-subtle">
          Line {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-danger hover:opacity-80"
            aria-label="Remove line"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {line.drug ? (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text">
              {line.drug.name}
              {line.drug.strength ? (
                <span className="ml-1 font-normal text-text-muted">
                  {line.drug.strength}
                </span>
              ) : null}
            </p>
            <p className="truncate text-xs text-text-muted">
              {[line.drug.generic, line.drug.form, line.drug.unit]
                .filter(Boolean)
                .join(' · ') || '—'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPatch({ drug: null })}
          >
            Change
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className={cn(
            'mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface px-3 py-3 text-sm text-text-muted transition-colors',
            'hover:border-primary/40 hover:text-primary'
          )}
        >
          <Plus size={14} />
          Pick a drug
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="Quantity" required>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={line.qty}
            onChange={(e) => onPatch({ qty: e.target.value })}
            placeholder="1"
          />
        </FormField>

        <FormField label="Cost price" required hint="Per unit">
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            value={line.costPrice}
            onChange={(e) => onPatch({ costPrice: e.target.value })}
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Line total">
          <div className="flex h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-text">
            {formatMoney(lineTotal, 'KES')}
          </div>
        </FormField>
      </div>
    </div>
  );
}

function DrugPicker({
  onPick,
  onCancel,
}: {
  onPick: (d: Drug) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Drug[] | null>(null);
  const [loading, setLoading] = useState(false);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const q = query.trim();
    setLoading(true);
    const reqId = ++reqIdRef.current;
    const t = setTimeout(async () => {
      const list = await inventoryApi.drugs
        .list(q ? { search: q } : {})
        .catch(() => []);
      if (reqId === reqIdRef.current) {
        setResults(Array.isArray(list) ? list.slice(0, 25) : []);
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search size={14} />}
          placeholder="Search drugs by name or generic…"
          autoFocus
        />
        <Button variant="ghost" onClick={onCancel} leftIcon={<X size={14} />}>
          Cancel
        </Button>
      </div>

      <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-border bg-surface">
        {loading && !results ? (
          <p className="p-4 text-center text-xs text-text-muted">Loading…</p>
        ) : !results?.length ? (
          <EmptyState
            icon={<Package size={20} />}
            title={query ? 'No matches' : 'No drugs'}
            description={
              query
                ? 'Try a different name.'
                : 'Add drugs from the Inventory page first.'
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {results.map((d) => (
              <li key={d._id}>
                <button
                  type="button"
                  onClick={() => onPick(d)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">
                      {d.name}
                      {d.strength ? (
                        <span className="ml-1 font-normal text-text-muted">
                          {d.strength}
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {[d.generic, d.form, d.unit].filter(Boolean).join(' · ') ||
                        '—'}
                    </p>
                  </div>
                  {d.currentQty !== undefined && (
                    <span className="shrink-0 text-[10px] text-text-subtle">
                      {d.currentQty} in stock
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-text-muted">
      <span>{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}