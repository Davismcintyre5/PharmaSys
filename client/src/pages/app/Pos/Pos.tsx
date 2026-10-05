import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthProvider';
import { useBranch } from '@/context/BranchProvider';
import { saleApi } from '@/api/sale';
import { useToast } from '@/hooks/useToast';
import { DrugGrid } from './_DrugGrid';
import { CartPanel } from './_CartPanel';
import { PaymentSuccess } from './_PaymentSuccess';
import type {
  Drug,
  Patient,
  Customer,
  Prescription,
  Sale,
  SalePaymentMethod,
} from '@/types';

export interface CartLine {
  drug: Drug;
  qty: number;
  unitPrice: number;
}

export interface CartTotals {
  subtotal: number;
  tax: number;
  discountAmount: number;
  grandTotal: number;
  itemCount: number;
}

export default function Pos() {
  const toast = useToast();
  const { user, tenant } = useAuth();
  const { branches, currentBranch } = useBranch();

  const [lines, setLines] = useState<CartLine[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('cash');
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const totals: CartTotals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const tax = lines.reduce(
      (s, l) => s + (l.unitPrice * l.qty * (l.drug.taxRate || 0)) / 100,
      0
    );
    const discountAmount = Math.max(0, Math.min(discount, subtotal + tax));
    const grandTotal = subtotal + tax - discountAmount;
    const itemCount = lines.reduce((s, l) => s + l.qty, 0);
    return { subtotal, tax, discountAmount, grandTotal, itemCount };
  }, [lines, discount]);

  function addDrug(drug: Drug) {
    if ((drug.currentQty ?? 0) <= 0) {
      toast.error(`${drug.name} is out of stock`);
      return;
    }
    if (drug.controlled) {
      toast.error('Controlled substances cannot be sold from POS');
      return;
    }

    setLines((prev) => {
      const idx = prev.findIndex((l) => l.drug._id === drug._id);
      if (idx === -1) {
        const price = drug.lastSellingPrice ?? 0;
        return [...prev, { drug, qty: 1, unitPrice: price }];
      }
      const next = [...prev];
      const newQty = next[idx].qty + 1;
      if (newQty > (drug.currentQty ?? 0)) {
        toast.error(`Only ${drug.currentQty} in stock`);
        return prev;
      }
      next[idx] = { ...next[idx], qty: newQty };
      return next;
    });
  }

  function updateQty(drugId: string, qty: number) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.drug._id !== drugId) return l;
        const capped = Math.max(1, Math.min(qty, l.drug.currentQty ?? 999));
        return { ...l, qty: capped };
      })
    );
  }

  function updatePrice(drugId: string, price: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.drug._id === drugId ? { ...l, unitPrice: Math.max(0, price) } : l
      )
    );
  }

  function removeLine(drugId: string) {
    setLines((prev) => prev.filter((l) => l.drug._id !== drugId));
  }

  function clearCart() {
    setLines([]);
    setPatient(null);
    setCustomer(null);
    setPrescription(null);
    setDiscount(0);
    setPaymentMethod('cash');
    setNote('');
  }

  async function submit() {
    if (!lines.length) {
      toast.error('Cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      const sale = await saleApi.create({
        items: lines.map((l) => ({
          drugId: l.drug._id,
          qty: l.qty,
          unitPrice: l.unitPrice,
        })),
        customerId: customer?._id,
        patientId: patient?._id,
        prescriptionId: prescription?._id,
        paymentMethod,
        discount: totals.discountAmount,
        note: note.trim() || undefined,
      });

      setCompletedSale(sale);
    } catch (e: any) {
      toast.error(e?.message || 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  }

  const receiptBranch = branches.length > 1 ? currentBranch : null;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-text sm:text-xl">
            Point of sale
          </h1>
          <p className="truncate text-xs text-text-muted">
            {tenant?.name || 'Pharmacy'}
            {receiptBranch ? ` · ${receiptBranch.name}` : ''}
          </p>
        </div>
        <Link to="/app/sales">
          <Button variant="outline" size="sm" leftIcon={<Receipt size={14} />}>
            All sales
          </Button>
        </Link>
      </div>

      {/*
        Mobile: two stacked panels, each with a bounded height and its own scroll.
        Desktop (lg+): side-by-side, each fills the remaining viewport height.
      */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        <div className="h-[60vh] min-h-0 overflow-hidden lg:h-full">
          <DrugGrid
            onPick={addDrug}
            cartDrugIds={lines.map((l) => l.drug._id)}
          />
        </div>

        <div className="h-[70vh] min-h-0 overflow-hidden lg:h-full">
          <CartPanel
            lines={lines}
            patient={patient}
            customer={customer}
            prescription={prescription}
            discount={discount}
            paymentMethod={paymentMethod}
            note={note}
            totals={totals}
            submitting={submitting}
            onQtyChange={updateQty}
            onPriceChange={updatePrice}
            onRemove={removeLine}
            onDiscountChange={setDiscount}
            onPaymentMethodChange={setPaymentMethod}
            onNoteChange={setNote}
            onClear={clearCart}
            onSetPatient={setPatient}
            onSetCustomer={setCustomer}
            onSetPrescription={setPrescription}
            onSubmit={submit}
          />
        </div>
      </div>

      {completedSale && (
        <PaymentSuccess
          sale={completedSale}
          businessName={tenant?.name || 'Pharmacy'}
          branch={receiptBranch}
          cashierName={user?.fullName}
          customerName={customer?.name ?? patient?.name ?? null}
          onNewSale={() => {
            clearCart();
            setCompletedSale(null);
          }}
          onClose={() => {
            clearCart();
            setCompletedSale(null);
          }}
        />
      )}
    </div>
  );
}