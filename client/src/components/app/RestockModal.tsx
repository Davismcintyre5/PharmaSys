import { useEffect, useMemo, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { inventoryApi } from '@/api/inventory';
import { supplierApi } from '@/api/supplier';
import { useToast } from '@/hooks/useToast';
import type { Batch, Drug, Supplier } from '@/types';

interface RestockModalProps {
  open: boolean;
  onClose: () => void;
  drug: Drug | null;
  onSuccess?: (batch: Batch) => void;
  currentQty?: number;
  defaultSupplierId?: string | null;
}

interface FormState {
  qty: string;
  costPrice: string;
  sellingPrice: string;
  lotNo: string;
  expiryDate: string;
  supplierId: string;
}

const EMPTY: FormState = {
  qty: '',
  costPrice: '',
  sellingPrice: '',
  lotNo: '',
  expiryDate: '',
  supplierId: '',
};

export function RestockModal({
  open,
  onClose,
  drug,
  onSuccess,
  currentQty = 0,
  defaultSupplierId = null,
}: RestockModalProps) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...EMPTY,
      supplierId: defaultSupplierId || '',
    });
    setShowDetails(false);
  }, [open, drug?._id, defaultSupplierId]);

  useEffect(() => {
    if (!open) return;
    if (suppliers.length) return;
    supplierApi
      .list()
      .then(setSuppliers)
      .catch(() => null);
  }, [open, suppliers.length]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const errors = useMemo(() => {
    const list: string[] = [];
    const q = Number(form.qty);
    if (!Number.isFinite(q) || q <= 0) list.push('Quantity must be greater than 0');
    if (!form.expiryDate) list.push('Expiry date is required');
    else if (new Date(form.expiryDate) <= new Date()) {
      list.push('Expiry date must be in the future');
    }
    if (form.costPrice && Number(form.costPrice) < 0) list.push('Cost price cannot be negative');
    if (form.sellingPrice && Number(form.sellingPrice) < 0)
      list.push('Selling price cannot be negative');
    return list;
  }, [form]);

  const valid = errors.length === 0;

  async function submit() {
    if (saving) return;
    if (!drug) return;
    if (!valid) {
      toast.error(errors[0]);
      return;
    }
    setSaving(true);
    try {
      const batch = await inventoryApi.drugs.addBatch(drug._id, {
        qty: Number(form.qty),
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
        expiryDate: form.expiryDate,
        lotNo: form.lotNo.trim() || undefined,
        supplierId: form.supplierId || undefined,
      });
      toast.success(`Added ${form.qty} units to stock`);
      onSuccess?.(batch);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Could not add stock');
    } finally {
      setSaving(false);
    }
  }

  if (!drug) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Restock"
      size="lg"
      onSubmit={submit}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            leftIcon={<PackagePlus size={14} />}
            loading={saving}
            disabled={!valid}
            onClick={submit}
          >
            Add to stock
          </Button>
        </>
      }
    >
      <div className="mb-4 rounded-lg border border-border bg-surface-2 p-3">
        <p className="text-sm font-semibold text-text">
          {drug.name}
          {drug.strength && (
            <span className="ml-1 font-normal text-text-muted">{drug.strength}</span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          {[drug.generic, drug.form, drug.unit].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="text-text-muted">
            Currently in stock: <strong className="text-text">{currentQty}</strong>
          </span>
          {drug.reorderLevel > 0 && (
            <span className="text-text-muted">
              Reorder at: <strong className="text-text">{drug.reorderLevel}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Quantity to add" required>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={form.qty}
              onChange={(e) => patch('qty', e.target.value)}
              placeholder="e.g. 50"
              autoFocus
            />
          </FormField>
          <FormField label="Expiry date" required>
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(e) => patch('expiryDate', e.target.value)}
              min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
            />
          </FormField>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="text-xs text-primary hover:underline"
        >
          {showDetails ? '− Hide details' : '+ Add lot, prices, and supplier'}
        </button>

        {showDetails && (
          <div className="space-y-4 rounded-lg border border-border bg-surface-2/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Cost price" hint="Leave blank to keep the last price">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  value={form.costPrice}
                  onChange={(e) => patch('costPrice', e.target.value)}
                  placeholder="Unchanged"
                />
              </FormField>
              <FormField label="Selling price" hint="Leave blank to keep the last price">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  value={form.sellingPrice}
                  onChange={(e) => patch('sellingPrice', e.target.value)}
                  placeholder="Unchanged"
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Lot number">
                <Input
                  value={form.lotNo}
                  onChange={(e) => patch('lotNo', e.target.value)}
                  placeholder="e.g. LOT-2026-A12"
                />
              </FormField>
              <FormField label="Supplier">
                <Select
                  value={form.supplierId}
                  onChange={(e) => patch('supplierId', e.target.value)}
                  options={[
                    { value: '', label: 'Not specified' },
                    ...suppliers.map((s) => ({ value: s._id, label: s.name })),
                  ]}
                />
              </FormField>
            </div>

            <p className="text-xs text-text-subtle">
              The lot number helps trace this batch if a recall happens. Prices left
              blank are inherited from the previous batch for this drug.
            </p>
          </div>
        )}
      </div>

      {!valid && errors.length > 0 && (
        <Alert variant="warning" className="mt-4">
          <ul className="list-inside list-disc space-y-0.5 text-xs">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}
    </Modal>
  );
}