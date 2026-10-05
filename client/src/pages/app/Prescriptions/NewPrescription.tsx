import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Pill,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { prescriptionApi } from '@/api/prescription';
import { patientApi } from '@/api/patient';
import { inventoryApi } from '@/api/inventory';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/components/ui/_cn';
import type { Patient, Drug } from '@/types';

/* ═════════════════════════════════════════════════════════════════
   Types
   ═════════════════════════════════════════════════════════════════ */

interface ItemDraft {
  id: string; // local uid
  drug: Drug | null;
  qty: string;
  dosage: string;
  duration: string;
  refills: string;
  notes: string;
}

function newItem(): ItemDraft {
  return {
    id: Math.random().toString(36).slice(2),
    drug: null,
    qty: '1',
    dosage: '',
    duration: '',
    refills: '0',
    notes: '',
  };
}

/* ═════════════════════════════════════════════════════════════════
   Page
   ═════════════════════════════════════════════════════════════════ */

export default function NewPrescription() {
  const navigate = useNavigate();
  const toast = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<ItemDraft[]>([newItem()]);
  const [doctorName, setDoctorName] = useState('');
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ─────────── add / update / remove items ─────────── */

  function addItem() {
    setItems((prev) => [...prev, newItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.id !== id)));
  }

  function patchItem(id: string, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  /* ─────────── validation ─────────── */

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!patient) list.push('Pick a patient');
    const validItems = items.filter((i) => i.drug);
    if (!validItems.length) list.push('Add at least one drug');
    for (const it of validItems) {
      const q = Number(it.qty);
      if (!Number.isFinite(q) || q <= 0) {
        list.push(`${it.drug!.name}: quantity must be > 0`);
      }
    }
    return list;
  }, [patient, items]);

  const canSubmit = errors.length === 0 && !submitting;

  /* ─────────── submit ─────────── */

  async function submit() {
    if (!patient) return;
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }
    setSubmitting(true);
    try {
      await prescriptionApi.create({
        patientId: patient._id,
        doctorId: undefined,   // free-text name; a Doctor picker would need /app/doctors endpoint
        refNo: refNo.trim() || undefined,
        items: items
          .filter((i) => i.drug)
          .map((i) => ({
            drugId: i.drug!._id,
            qty: Number(i.qty),
            dosage: i.dosage.trim() || null,
            duration: i.duration.trim() || null,
            refills: Number(i.refills) || 0,
            notes: i.notes.trim() || null,
          })),
        notes: notes.trim() || undefined,
      });
      toast.success('Prescription created');
      navigate('/app/prescriptions', { replace: true });
    } catch (e: any) {
      toast.error(e?.message || 'Could not create prescription');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New prescription"
        subtitle="Record a prescription and dispense from stock"
        breadcrumb={
          <Link to="/app/prescriptions" className="inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Prescriptions
          </Link>
        }
        actions={
          <Button
            leftIcon={<Check size={14} />}
            loading={submitting}
            disabled={!canSubmit}
            onClick={submit}
          >
            Create prescription
          </Button>
        }
      />

      {/* Errors summary */}
      {errors.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <ul className="list-inside list-disc space-y-0.5 text-xs">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* ─── Patient ─── */}
      <Card className="mb-4">
        <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserIcon size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text">Patient</h2>
            <p className="text-xs text-text-muted">Required</p>
          </div>
        </div>

        {patient ? (
          <div className="flex items-center justify-between rounded-md border border-border bg-surface-2 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text">{patient.name}</p>
              {patient.phone && (
                <p className="truncate font-mono text-xs text-text-muted">
                  {patient.phone}
                </p>
              )}
              {patient.allergies?.length ? (
                <p className="mt-1 text-xs text-danger">
                  Allergies: {patient.allergies.join(', ')}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<X size={12} />}
              onClick={() => setPatient(null)}
            >
              Change
            </Button>
          </div>
        ) : (
          <PatientPicker onPick={setPatient} />
        )}
      </Card>

      {/* ─── Prescriber (optional) ─── */}
      <Card className="mb-4">
        <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 text-info">
            <Stethoscope size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text">Prescriber</h2>
            <p className="text-xs text-text-muted">Optional</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Doctor name">
            <Input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Dr. Faith Wanjiru"
            />
          </FormField>
          <FormField label="Ref / prescription number" hint="From the paper slip">
            <Input
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              placeholder="RX-2026-001"
            />
          </FormField>
        </div>
      </Card>

      {/* ─── Items ─── */}
      <Card className="mb-4">
        <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pill size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">Medications</h2>
              <p className="text-xs text-text-muted">
                {items.filter((i) => i.drug).length} selected
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus size={12} />}
            onClick={addItem}
          >
            Add item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <ItemRow
              key={item.id}
              index={idx}
              item={item}
              canRemove={items.length > 1}
              onPatch={(p) => patchItem(item.id, p)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
      </Card>

      {/* ─── Notes ─── */}
      <Card className="mb-4">
        <FormField label="Notes" hint="Any additional instructions for the patient or staff">
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Take with food. Avoid alcohol while on this medication."
          />
        </FormField>
      </Card>

      {/* Mobile submit */}
      <div className="flex justify-end sm:hidden">
        <Button
          fullWidth
          leftIcon={<Check size={14} />}
          loading={submitting}
          disabled={!canSubmit}
          onClick={submit}
        >
          Create prescription
        </Button>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Patient picker
   ═════════════════════════════════════════════════════════════════ */

function PatientPicker({ onPick }: { onPick: (p: Patient) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[] | null>(null);
  const [loading, setLoading] = useState(false);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const q = query.trim();
    setLoading(true);
    const reqId = ++reqIdRef.current;
    const t = setTimeout(async () => {
      const list = await patientApi
        .list(q ? { search: q } : {})
        .catch(() => []);
      if (reqId === reqIdRef.current) {
        setResults(list.slice(0, 20));
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search size={14} />}
        placeholder="Search by name or phone…"
        autoFocus
      />

      <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-border bg-surface">
        {loading && !results ? (
          <p className="p-4 text-center text-xs text-text-muted">Loading…</p>
        ) : !results?.length ? (
          <EmptyState
            icon={<UserIcon size={20} />}
            title={query ? 'No matches' : 'No patients'}
            description={
              query
                ? 'Try a different name or phone.'
                : 'Add a patient first from the Patients page.'
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {results.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => onPick(p)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{p.name}</p>
                    <p className="truncate text-xs text-text-muted">
                      {p.phone || p.email || '—'}
                    </p>
                  </div>
                  {p.allergies?.length ? (
                    <span className="shrink-0 text-[10px] text-danger">
                      {p.allergies.length} allergy
                      {p.allergies.length === 1 ? '' : 'ies'}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Drug picker
   ═════════════════════════════════════════════════════════════════ */

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
        setResults(list.slice(0, 25));
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
            icon={<Pill size={20} />}
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
                      {[d.generic, d.form, d.unit].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  {d.prescriptionRequired && (
                    <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                      Rx
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

/* ═════════════════════════════════════════════════════════════════
   Item row
   ═════════════════════════════════════════════════════════════════ */

function ItemRow({
  index,
  item,
  canRemove,
  onPatch,
  onRemove,
}: {
  index: number;
  item: ItemDraft;
  canRemove: boolean;
  onPatch: (patch: Partial<ItemDraft>) => void;
  onRemove: () => void;
}) {
  const [picking, setPicking] = useState(false);

  if (picking) {
    return (
      <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
        <DrugPicker
          onPick={(d) => {
            onPatch({ drug: d });
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
        <span className="text-xs font-medium text-text-subtle">Item {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-danger hover:opacity-80"
            aria-label="Remove item"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Drug selector */}
      {item.drug ? (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text">
              {item.drug.name}
              {item.drug.strength && (
                <span className="ml-1 font-normal text-text-muted">
                  {item.drug.strength}
                </span>
              )}
            </p>
            <p className="truncate text-xs text-text-muted">
              {[item.drug.generic, item.drug.form, item.drug.unit].filter(Boolean).join(' · ')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onPatch({ drug: null })}>
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

      {/* Fields */}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Quantity" required>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={item.qty}
            onChange={(e) => onPatch({ qty: e.target.value })}
            placeholder="1"
          />
        </FormField>

        <FormField label="Refills">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={item.refills}
            onChange={(e) => onPatch({ refills: e.target.value })}
            placeholder="0"
          />
        </FormField>

        <FormField label="Dosage" hint="e.g. 1 tablet twice daily">
          <Input
            value={item.dosage}
            onChange={(e) => onPatch({ dosage: e.target.value })}
            placeholder="1 tab twice daily"
          />
        </FormField>

        <FormField label="Duration" hint="e.g. 5 days">
          <Input
            value={item.duration}
            onChange={(e) => onPatch({ duration: e.target.value })}
            placeholder="5 days"
          />
        </FormField>
      </div>

      <FormField label="Item notes" className="mt-3">
        <Input
          value={item.notes}
          onChange={(e) => onPatch({ notes: e.target.value })}
          placeholder="Take after meals"
        />
      </FormField>
    </div>
  );
}