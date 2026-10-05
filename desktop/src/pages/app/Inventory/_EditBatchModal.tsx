import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { inventoryApi } from '@/api/inventory';
import { supplierApi } from '@/api/supplier';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/format';
import type { Batch, Supplier } from '@/types';

interface EditBatchModalProps {
  open: boolean;
  batch: Batch | null;
  onClose: () => void;
  onSuccess?: (batch: Batch) => void;
}

interface FormState {
  costPrice: string;
  sellingPrice: string;
  expiryDate: string;
  lotNo: string;
  supplierId: string;
}

const EMPTY: FormState = {
  costPrice: '',
  sellingPrice: '',
  expiryDate: '',
  lotNo: '',
  supplierId: '',
};

export function EditBatchModal({
  open,
  batch,
  onClose,
  onSuccess,
}: EditBatchModalProps) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (!open || !batch) return;
    setForm({
      costPrice: String(batch.costPrice ?? ''),
      sellingPrice: String(batch.sellingPrice ?? ''),
      expiryDate: batch.expiryDate
        ? new Date(batch.expiryDate).toISOString().slice(0, 10)
        : '',
      lotNo: batch.lotNo || '',
      supplierId:
        typeof batch.supplierId === 'string' ? batch.supplierId : '',
    });
  }, [open, batch?._id]);

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
    if (form.costPrice && Number(form.costPrice) < 0)
      list.push('Cost price cannot be negative');
    if (form.sellingPrice && Number(form.sellingPrice) < 0)
      list.push('Selling price cannot be negative');
    if (form.expiryDate && new Date(form.expiryDate) <= new Date())
      list.push('Expiry date must be in the future');
    return list;
  }, [form]);

  const valid = errors.length === 0;

  async function submit() {
    if (saving) return;
    if (!batch) return;
    if (!valid) {
      toast.error(errors[0]);
      return;
    }
    setSaving(true);
    try {
      const updated = await inventoryApi.batches.update(batch._id, {
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        sellingPrice: form.sellingPrice
          ? Number(form.sellingPrice)
          : undefined,
        expiryDate: form.expiryDate || undefined,
        lotNo: form.lotNo.trim() || undefined,
        supplierId: form.supplierId || undefined,
      } as any);
      toast.success('Batch updated');
      onSuccess?.(updated);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!batch) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit batch${batch.lotNo ? ` · ${batch.lotNo}` : ''}`}
      size="md"
      onSubmit={submit}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            leftIcon={<Save size={14} />}
            onClick={submit}
            loading={saving}
            disabled={!valid}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span className="text-text-muted">
              Quantity:{' '}
              <strong className="text-text">{batch.qty}</strong>{' '}
              <span className="text-text-subtle">(read-only)</span>
            </span>
            <span className="text-text-muted">
              Received: <strong className="text-text">{formatDate(batch.receivedAt)}</strong>
            </span>
          </div>
          <p className="mt-2 text-text-subtle">
            To change quantity, use <strong>Adjust stock</strong> on the drug detail
            page. That logs a movement for audit.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Cost price">
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              value={form.costPrice}
              onChange={(e) => patch('costPrice', e.target.value)}
              placeholder="0"
            />
          </FormField>
          <FormField label="Selling price">
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              value={form.sellingPrice}
              onChange={(e) => patch('sellingPrice', e.target.value)}
              placeholder="0"
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Expiry date">
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(e) => patch('expiryDate', e.target.value)}
              min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
            />
          </FormField>
          <FormField label="Lot number">
            <Input
              value={form.lotNo}
              onChange={(e) => patch('lotNo', e.target.value)}
              placeholder="e.g. LOT-2026-A12"
            />
          </FormField>
        </div>

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

        {!valid && errors.length > 0 && (
          <Alert variant="warning">
            <ul className="list-inside list-disc space-y-0.5 text-xs">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </Alert>
        )}
      </div>
    </Modal>
  );
}