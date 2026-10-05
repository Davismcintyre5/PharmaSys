import { useEffect, useState } from 'react';
import { CheckCircle2, Printer, Plus, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatMoney, formatDateTime } from '@/utils/format';
import { printReceipt } from '@/utils/receiptHtml';
import { getReceiptCustomerName } from '@/utils/saleHelpers';
import { useReceiptBrand } from '@/utils/receiptBrand';
import type { Sale, Branch } from '@/types';

interface PaymentSuccessProps {
  sale: Sale;
  businessName: string;
  /** Only passed when the tenant has more than one branch. */
  branch?: Branch | null;
  cashierName?: string | null;
  /** Optional explicit override — otherwise derived from sale.customerId / patientId */
  customerName?: string | null;
  onNewSale: () => void;
  onClose: () => void;
}

const AUTOPRINT_KEY = 'pharmasys_pos_autoprint';

export function PaymentSuccess({
  sale,
  businessName,
  branch = null,
  cashierName,
  customerName: customerNameProp,
  onNewSale,
  onClose,
}: PaymentSuccessProps) {
  const receiptBrand = useReceiptBrand();
  const [autoPrint, setAutoPrint] = useState(false);

  useEffect(() => {
    try {
      setAutoPrint(localStorage.getItem(AUTOPRINT_KEY) === 'true');
    } catch {}
  }, []);

  function persistAutoPrint(v: boolean) {
    setAutoPrint(v);
    try {
      localStorage.setItem(AUTOPRINT_KEY, String(v));
    } catch {}
  }

  /* Prefer the prop from POS state; fall back to what the sale carries */
  const customerName =
    customerNameProp ?? getReceiptCustomerName(sale) ?? null;

  function handlePrint() {
    printReceipt({
      sale,
      businessName: receiptBrand.businessName || businessName,
      logoUrl: receiptBrand.logoUrl,
      storeAddress: receiptBrand.storeAddress,
      headerOverride: receiptBrand.receiptHeader,
      footerOverride: receiptBrand.receiptFooter,
      branchName: branch?.name ?? null,
      branchAddress: branch?.address ?? null,
      branchPhone: branch?.phone ?? null,
      cashierName,
      customerName,
      currency: receiptBrand.currency,
    });
  }

  useEffect(() => {
    if (autoPrint) handlePrint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint]);

  return (
    <Modal
      open
      onClose={onClose}
      title="Sale completed"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => persistAutoPrint(e.target.checked)}
              className="rounded border-border"
            />
            Auto-print next time
          </label>
          <div className="flex gap-2">
            <Button variant="ghost" leftIcon={<X size={14} />} onClick={onClose}>
              Close
            </Button>
            <Button
              leftIcon={<Plus size={14} />}
              onClick={onNewSale}
              variant="primary"
            >
              New sale
            </Button>
          </div>
        </div>
      }
    >
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="mt-3 text-lg font-semibold text-text">
          {formatMoney(sale.grandTotal, receiptBrand.currency)}
        </h3>
        <p className="mt-0.5 text-sm text-text-muted">
          {sale.paymentMethod === 'cash' ? 'Cash' : sale.paymentMethod}
        </p>
      </div>

      <div className="mt-5 space-y-1.5 rounded-lg border border-border bg-surface-2 p-3 text-sm">
        <Row label="Invoice" value={sale.invoiceNo} mono />
        <Row label="Date" value={formatDateTime(sale.createdAt)} />
        {customerName && <Row label="Customer" value={customerName} />}
        <Row
          label="Items"
          value={String(sale.items.reduce((s, i) => s + i.qty, 0))}
        />
        <Row label="Total" value={formatMoney(sale.grandTotal, receiptBrand.currency)} bold />
      </div>

      <div className="mt-5 flex justify-center">
        <Button
          variant="outline"
          leftIcon={<Printer size={14} />}
          onClick={handlePrint}
        >
          Print receipt
        </Button>
      </div>
    </Modal>
  );
}

function Row({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span
        className={`text-text ${mono ? 'font-mono text-xs' : ''} ${
          bold ? 'font-semibold' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}