import { useEffect, useMemo, useState } from 'react';
import { PackagePlus, Pill } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Switch } from '@/components/ui/Switch';
import { Alert } from '@/components/ui/Alert';
import { inventoryApi } from '@/api/inventory';
import { supplierApi } from '@/api/supplier';
import { useToast } from '@/hooks/useToast';
import { DRUG_CATEGORIES, DRUG_FORMS } from '@/utils/constants';
import { formatDate } from '@/utils/format';
import type {
  Drug,
  DrugForm,
  DrugPayload,
  Batch,
  Supplier,
} from '@/types';

interface DrugFormModalProps {
  open: boolean;
  drug?: Drug | null;
  onClose: () => void;
  onSuccess?: (drug: Drug, isNew: boolean, batch?: Batch) => void;
  batches?: Batch[];
}

interface FormState {
  name: string;
  generic: string;
  brand: string;
  barcode: string;
  category: string;
  form: DrugForm;
  strength: string;
  unit: string;
  taxRate: string;
  reorderLevel: string;
  prescriptionRequired: boolean;
  controlled: boolean;

  initQty: string;
  initExpiryDate: string;
  initCostPrice: string;
  initSellingPrice: string;
  initLotNo: string;
  initSupplierId: string;
}

const EMPTY: FormState = {
  name: '',
  generic: '',
  brand: '',
  barcode: '',
  category: '',
  form: 'tablet',
  strength: '',
  unit: 'pcs',
  taxRate: '0',
  reorderLevel: '10',
  prescriptionRequired: false,
  controlled: false,

  initQty: '',
  initExpiryDate: '',
  initCostPrice: '',
  initSellingPrice: '',
  initLotNo: '',
  initSupplierId: '',
};

function fromDrug(d: Drug): FormState {
  return {
    ...EMPTY,
    name: d.name || '',
    generic: d.generic || '',
    brand: d.brand || '',
    barcode: d.barcode || '',
    category: d.category || '',
    form: (d.form as DrugForm) || 'tablet',
    strength: d.strength || '',
    unit: d.unit || 'pcs',
    taxRate: String(d.taxRate ?? 0),
    reorderLevel: String(d.reorderLevel ?? 10),
    prescriptionRequired: !!d.prescriptionRequired,
    controlled: !!d.controlled,
  };
}

export function DrugFormModal({
  open,
  drug,
  onClose,
  onSuccess,
  batches = [],
}: DrugFormModalProps) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showStockSection, setShowStockSection] = useState(true);
  const isEdit = !!drug;

  useEffect(() => {
    if (!open) return;
    setForm(drug ? fromDrug(drug) : EMPTY);
    setAttempted(false);
    setShowStockSection(!drug);
  }, [open, drug]);

  useEffect(() => {
    if (!open || isEdit) return;
    if (suppliers.length) return;
    supplierApi
      .list()
      .then(setSuppliers)
      .catch(() => null);
  }, [open, isEdit, suppliers.length]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!form.name.trim()) list.push('Name is required');
    if (!form.form) list.push('Form is required');

    if (!isEdit && form.initQty.trim()) {
      const q = Number(form.initQty);
      if (!Number.isFinite(q) || q <= 0) {
        list.push('Initial quantity must be greater than 0');
      }
      if (!form.initExpiryDate) {
        list.push('Expiry date is required for initial stock');
      } else if (new Date(form.initExpiryDate) <= new Date()) {
        list.push('Initial stock expiry date must be in the future');
      }
    }

    return list;
  }, [form, isEdit]);

  const valid = errors.length === 0;

  const stockSummary = useMemo(() => {
    if (!isEdit || !batches.length) return null;
    const total = batches.reduce((s, b) => s + (b.qty || 0), 0);
    const future = batches
      .filter((b) => b.qty > 0 && new Date(b.expiryDate) > new Date())
      .sort(
        (a, b) =>
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
    return {
      total,
      batchCount: batches.length,
      nearestExpiry: future[0]?.expiryDate || null,
    };
  }, [isEdit, batches]);

  async function submit() {
    if (saving) return;
    setAttempted(true);
    if (!valid) {
      toast.error(errors[0]);
      return;
    }
    setSaving(true);
    try {
      const payload: DrugPayload = {
        name: form.name.trim(),
        generic: form.generic.trim() || undefined,
        brand: form.brand.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        category: form.category.trim() || undefined,
        form: form.form,
        strength: form.strength.trim() || undefined,
        unit: form.unit.trim() || undefined,
        taxRate: Number(form.taxRate) || 0,
        reorderLevel: Number(form.reorderLevel) || 0,
        prescriptionRequired: form.prescriptionRequired,
        controlled: form.controlled,
      };

      let saved: Drug;
      let batch: Batch | undefined;

      if (isEdit && drug) {
        saved = await inventoryApi.drugs.update(drug._id, payload);
        toast.success('Drug updated');
      } else {
        saved = await inventoryApi.drugs.create(payload);

        if (form.initQty.trim()) {
          try {
            batch = await inventoryApi.drugs.addBatch(saved._id, {
              qty: Number(form.initQty),
              expiryDate: form.initExpiryDate,
              costPrice: form.initCostPrice
                ? Number(form.initCostPrice)
                : undefined,
              sellingPrice: form.initSellingPrice
                ? Number(form.initSellingPrice)
                : undefined,
              lotNo: form.initLotNo.trim() || undefined,
              supplierId: form.initSupplierId || undefined,
            });
            toast.success(
              `${saved.name} added with ${form.initQty} in stock`
            );
          } catch (e: any) {
            toast.error(
              `Drug created, but initial stock failed: ${e?.message || 'unknown error'}`
            );
          }
        } else {
          toast.success('Drug added');
        }
      }

      onSuccess?.(saved, !isEdit, batch);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const categoryOptions = [
    { value: '', label: 'No category' },
    ...DRUG_CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  const supplierOptions = [
    { value: '', label: 'Not specified' },
    ...suppliers.map((s) => ({ value: s._id, label: s.name })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${drug?.name}` : 'New drug'}
      size="lg"
      onSubmit={submit}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            {isEdit ? 'Save changes' : 'Add drug'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Drug details
          </h3>

          <FormField label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => patch('name', e.target.value)}
              placeholder="Paracetamol"
              autoFocus
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Generic name">
              <Input
                value={form.generic}
                onChange={(e) => patch('generic', e.target.value)}
                placeholder="Acetaminophen"
              />
            </FormField>
            <FormField label="Brand">
              <Input
                value={form.brand}
                onChange={(e) => patch('brand', e.target.value)}
                placeholder="Panadol"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Category">
              <Select
                value={form.category}
                onChange={(e) => patch('category', e.target.value)}
                options={categoryOptions}
              />
            </FormField>
            <FormField label="Barcode">
              <Input
                value={form.barcode}
                onChange={(e) => patch('barcode', e.target.value)}
                placeholder="6161100012345"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Form" required>
              <Select
                value={form.form}
                onChange={(e) => patch('form', e.target.value as DrugForm)}
                options={DRUG_FORMS.map((f) => ({
                  value: f,
                  label: f.charAt(0).toUpperCase() + f.slice(1),
                }))}
              />
            </FormField>
            <FormField label="Strength">
              <Input
                value={form.strength}
                onChange={(e) => patch('strength', e.target.value)}
                placeholder="500mg"
              />
            </FormField>
            <FormField label="Unit">
              <Input
                value={form.unit}
                onChange={(e) => patch('unit', e.target.value)}
                placeholder="pcs"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Tax rate (%)" hint="Applied on sales">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                max={100}
                value={form.taxRate}
                onChange={(e) => patch('taxRate', e.target.value)}
              />
            </FormField>
            <FormField
              label="Reorder level"
              hint="Alert when stock drops to this quantity"
            >
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.reorderLevel}
                onChange={(e) => patch('reorderLevel', e.target.value)}
              />
            </FormField>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">
                  Prescription required
                </p>
                <p className="text-xs text-text-muted">
                  Sales of this drug require a prescription
                </p>
              </div>
              <Switch
                checked={form.prescriptionRequired}
                onChange={(v) => patch('prescriptionRequired', v)}
              />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <div>
                <p className="text-sm font-medium text-text">
                  Controlled substance
                </p>
                <p className="text-xs text-text-muted">
                  Extra logging and restricted sales apply
                </p>
              </div>
              <Switch
                checked={form.controlled}
                onChange={(v) => patch('controlled', v)}
              />
            </div>
          </div>
        </section>

        {!isEdit && (
          <section className="border-t border-border pt-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <PackagePlus size={14} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Initial stock
                  </h3>
                  <p className="text-[11px] text-text-subtle">
                    Optional — leave blank to add stock later
                  </p>
                </div>
              </div>
              {showStockSection && form.initQty.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    patch('initQty', '');
                    patch('initExpiryDate', '');
                    patch('initCostPrice', '');
                    patch('initSellingPrice', '');
                    patch('initLotNo', '');
                    patch('initSupplierId', '');
                    setShowStockSection(false);
                  }}
                  className="text-xs text-text-muted hover:text-text"
                >
                  Clear
                </button>
              )}
            </div>

            {showStockSection ? (
              <div className="space-y-4 rounded-lg border border-border bg-surface-2/50 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Quantity">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={form.initQty}
                      onChange={(e) => patch('initQty', e.target.value)}
                      placeholder="e.g. 50"
                    />
                  </FormField>
                  <FormField label="Expiry date">
                    <Input
                      type="date"
                      value={form.initExpiryDate}
                      onChange={(e) => patch('initExpiryDate', e.target.value)}
                      min={new Date(Date.now() + 86_400_000)
                        .toISOString()
                        .slice(0, 10)}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Cost price" hint="Optional">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      value={form.initCostPrice}
                      onChange={(e) => patch('initCostPrice', e.target.value)}
                      placeholder="e.g. 200"
                    />
                  </FormField>
                  <FormField label="Selling price" hint="Optional">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      value={form.initSellingPrice}
                      onChange={(e) =>
                        patch('initSellingPrice', e.target.value)
                      }
                      placeholder="e.g. 300"
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Lot number" hint="Optional">
                    <Input
                      value={form.initLotNo}
                      onChange={(e) => patch('initLotNo', e.target.value)}
                      placeholder="e.g. LOT-2026-A12"
                    />
                  </FormField>
                  <FormField label="Supplier" hint="Optional">
                    <Select
                      value={form.initSupplierId}
                      onChange={(e) =>
                        patch('initSupplierId', e.target.value)
                      }
                      options={supplierOptions}
                    />
                  </FormField>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowStockSection(true)}
                className="w-full rounded-lg border border-dashed border-border bg-surface-2 py-3 text-xs text-text-muted transition-colors hover:border-primary/40 hover:text-primary"
              >
                + Add initial stock
              </button>
            )}
          </section>
        )}

        {isEdit && (
          <section className="border-t border-border pt-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Stock
            </h3>

            {stockSummary && stockSummary.batchCount > 0 ? (
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-text-muted">In stock</p>
                    <p className="mt-0.5 text-lg font-bold text-text">
                      {stockSummary.total}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Batches</p>
                    <p className="mt-0.5 text-lg font-bold text-text">
                      {stockSummary.batchCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Nearest expiry</p>
                    <p className="mt-0.5 text-sm font-semibold text-text">
                      {stockSummary.nearestExpiry
                        ? formatDate(stockSummary.nearestExpiry)
                        : '—'}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-text-subtle">
                  To edit batches, prices, or quantities — use the drug's detail
                  page.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-surface-2 p-4 text-xs text-text-muted">
                <Pill size={12} className="mr-1 inline" />
                No stock yet. Add batches from the drug's detail page.
              </div>
            )}
          </section>
        )}

        {attempted && !valid && (
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