import { useRef, useState } from 'react';
import {
  Minus,
  Plus,
  Trash2,
  User as UserIcon,
  Stethoscope,
  X,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/components/ui/_cn';
import { formatMoney } from '@/utils/format';
import { PatientPicker } from './_PatientPicker';
import { CustomerPicker } from './_CustomerPicker';
import type { CartLine, CartTotals } from './Pos';
import type {
  Patient,
  Customer,
  Prescription,
  SalePaymentMethod,
} from '@/types';

interface CartPanelProps {
  lines: CartLine[];
  patient: Patient | null;
  customer: Customer | null;
  prescription: Prescription | null;
  discount: number;
  paymentMethod: SalePaymentMethod;
  note: string;
  totals: CartTotals;
  submitting: boolean;
  onQtyChange: (drugId: string, qty: number) => void;
  onPriceChange: (drugId: string, price: number) => void;
  onRemove: (drugId: string) => void;
  onDiscountChange: (n: number) => void;
  onPaymentMethodChange: (m: SalePaymentMethod) => void;
  onNoteChange: (s: string) => void;
  onClear: () => void;
  onSetPatient: (p: Patient | null) => void;
  onSetCustomer: (c: Customer | null) => void;
  onSetPrescription: (p: Prescription | null) => void;
  onSubmit: () => void;
}

const PAYMENT_METHODS: Array<{ value: SalePaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'card', label: 'Card' },
  { value: 'insurance', label: 'Insurance' },
];

export function CartPanel({
  lines,
  patient,
  customer,
  prescription,
  discount,
  paymentMethod,
  note,
  totals,
  submitting,
  onQtyChange,
  onPriceChange,
  onRemove,
  onDiscountChange,
  onPaymentMethodChange,
  onNoteChange,
  onClear,
  onSetPatient,
  onSetCustomer,
  onSetPrescription,
  onSubmit,
}: CartPanelProps) {
  const [showPatient, setShowPatient] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showNote, setShowNote] = useState(!!note);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
      {/* ─── STATIC: attachments header ─── */}
      <div className="shrink-0 border-b border-border p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {customer ? (
            <AttachChip
              icon={<UserIcon size={11} />}
              label={customer.name}
              onRemove={() => onSetCustomer(null)}
            />
          ) : (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<UserIcon size={12} />}
              onClick={() => setShowCustomer(true)}
            >
              Customer
            </Button>
          )}

          {patient ? (
            <AttachChip
              icon={<Stethoscope size={11} />}
              label={patient.name}
              onRemove={() => onSetPatient(null)}
            />
          ) : (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Stethoscope size={12} />}
              onClick={() => setShowPatient(true)}
            >
              Patient
            </Button>
          )}

          {prescription && (
            <AttachChip
              icon={<Stethoscope size={11} />}
              label={`Rx ${prescription.refNo || String(prescription._id).slice(-6)}`}
              onRemove={() => onSetPrescription(null)}
            />
          )}
        </div>
      </div>

      {/* ─── SCROLLABLE: everything else ─── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Cart lines */}
        <div className="p-3">
          {!lines.length ? (
            <EmptyState
              icon={<ShoppingCart size={22} />}
              title="Cart is empty"
              description="Search or scan a drug to add it to the sale."
            />
          ) : (
            <div className="space-y-2">
              {lines.map((line) => (
                <CartRow
                  key={line.drug._id}
                  line={line}
                  onQtyChange={(q) => onQtyChange(line.drug._id, q)}
                  onPriceChange={(p) => onPriceChange(line.drug._id, p)}
                  onRemove={() => onRemove(line.drug._id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Totals + payment + submit */}
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={() => setShowNote((v) => !v)}
            className="mb-2 text-[11px] text-primary hover:underline"
          >
            {showNote ? '− Hide note' : '+ Add note'}
          </button>

          {showNote && (
            <div className="mb-3">
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Optional note about this sale…"
              />
            </div>
          )}

          <div className="mb-3 flex items-center gap-2">
            <label className="shrink-0 text-xs text-text-muted">Discount</label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              value={discount || ''}
              onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
              placeholder="0"
              className="!py-1.5 text-sm"
            />
          </div>

          <div className="mb-3 space-y-1 text-sm">
            <Row label="Items" value={String(totals.itemCount)} />
            <Row label="Subtotal" value={formatMoney(totals.subtotal, 'KES')} />
            {totals.tax > 0 && (
              <Row label="Tax" value={formatMoney(totals.tax, 'KES')} />
            )}
            {totals.discountAmount > 0 && (
              <Row
                label="Discount"
                value={`-${formatMoney(totals.discountAmount, 'KES')}`}
              />
            )}
            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold text-text">
              <span>Total</span>
              <span>{formatMoney(totals.grandTotal, 'KES')}</span>
            </div>
          </div>

          <div className="mb-3">
            <p className="mb-1.5 text-[11px] text-text-muted">Payment method</p>
            <div className="grid grid-cols-4 gap-1">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => onPaymentMethodChange(m.value)}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                    paymentMethod === m.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClear}
              disabled={!lines.length || submitting}
            >
              Clear
            </Button>
            <Button
              fullWidth
              size="lg"
              loading={submitting}
              disabled={!lines.length}
              onClick={onSubmit}
            >
              Pay {formatMoney(totals.grandTotal, 'KES')}
            </Button>
          </div>
        </div>
      </div>

      {showCustomer && (
        <CustomerPicker
          onClose={() => setShowCustomer(false)}
          onPick={(c) => {
            onSetCustomer(c);
            setShowCustomer(false);
          }}
        />
      )}
      {showPatient && (
        <PatientPicker
          onClose={() => setShowPatient(false)}
          onPick={(p) => {
            onSetPatient(p);
            setShowPatient(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-text-muted">
      <span>{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}

function AttachChip({
  icon,
  label,
  onRemove,
}: {
  icon: React.ReactNode;
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 py-1 pl-2 pr-1 text-xs text-primary">
      {icon}
      <span className="max-w-[10rem] truncate font-medium">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10"
        aria-label="Remove"
      >
        <X size={11} />
      </button>
    </span>
  );
}

function CartRow({
  line,
  onQtyChange,
  onPriceChange,
  onRemove,
}: {
  line: CartLine;
  onQtyChange: (qty: number) => void;
  onPriceChange: (price: number) => void;
  onRemove: () => void;
}) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState(String(line.unitPrice));
  const priceInputRef = useRef<HTMLInputElement>(null);

  const drug = line.drug;
  const lineTotal = line.unitPrice * line.qty;
  const needsRx = drug.prescriptionRequired;

  return (
    <div className="rounded-md border border-border bg-surface-2 p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">
            {drug.name}
            {drug.strength ? ` ${drug.strength}` : ''}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <p className="text-[11px] text-text-muted">{drug.unit || 'pcs'}</p>
            {needsRx && (
              <Badge variant="warning" className="!px-1.5 !py-0 text-[9px]">
                Rx
              </Badge>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 text-danger hover:bg-danger/10"
          aria-label="Remove"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center rounded-md border border-border bg-surface">
          <button
            type="button"
            onClick={() => onQtyChange(Math.max(1, line.qty - 1))}
            disabled={line.qty <= 1}
            className="flex h-7 w-7 items-center justify-center text-text-muted hover:text-text disabled:opacity-40"
            aria-label="Decrease"
          >
            <Minus size={12} />
          </button>
          <input
            type="number"
            min={1}
            value={line.qty}
            onChange={(e) => onQtyChange(Number(e.target.value) || 1)}
            className="w-10 border-none bg-transparent text-center text-sm font-medium text-text outline-none"
          />
          <button
            type="button"
            onClick={() => onQtyChange(line.qty + 1)}
            className="flex h-7 w-7 items-center justify-center text-text-muted hover:text-text"
            aria-label="Increase"
          >
            <Plus size={12} />
          </button>
        </div>

        <div className="flex items-center gap-1 text-xs">
          {editingPrice ? (
            <input
              ref={priceInputRef}
              type="number"
              step="0.01"
              min={0}
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              onBlur={() => {
                const v = Number(priceDraft);
                if (Number.isFinite(v) && v >= 0) onPriceChange(v);
                else setPriceDraft(String(line.unitPrice));
                setEditingPrice(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') priceInputRef.current?.blur();
                if (e.key === 'Escape') {
                  setPriceDraft(String(line.unitPrice));
                  setEditingPrice(false);
                }
              }}
              autoFocus
              className="w-16 rounded border border-border bg-surface px-1 py-0.5 text-right text-xs"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setPriceDraft(String(line.unitPrice));
                setEditingPrice(true);
              }}
              className="rounded px-1 text-text-muted hover:bg-surface hover:text-text"
              title="Click to edit price"
            >
              {formatMoney(line.unitPrice, 'KES')} × {line.qty}
            </button>
          )}
        </div>

        <span className="min-w-[4.5rem] text-right text-sm font-semibold text-text">
          {formatMoney(lineTotal, 'KES')}
        </span>
      </div>
    </div>
  );
}