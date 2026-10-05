import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Printer,
  RotateCcw,
  ShoppingBag,
  User as UserIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { saleApi } from '@/api/sale';
import { useAuth } from '@/context/AuthProvider';
import { useBranch } from '@/context/BranchProvider';
import { useToast } from '@/hooks/useToast';
import { hasPermission } from '@/utils/permissions';
import { saleStatusLabel } from '@/utils/enums';
import { saleStatusColor } from '@/utils/colors';
import { formatMoney, formatDateTime, formatRelativeTime } from '@/utils/format';
import { printReceipt } from '@/utils/receiptHtml';
import { useReceiptBrand } from '@/utils/receiptBrand';
import {
  getCustomerName,
  getPatientName,
  getCashierName,
  getBranchName,
  getBranchAddress,
  getBranchPhone,
  getReceiptCustomerName,
} from '@/utils/saleHelpers';
import type { Sale, SaleItem } from '@/types';

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  card: 'Card',
  insurance: 'Insurance',
};

export default function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { user } = useAuth();
  const { branches } = useBranch();
  const receiptBrand = useReceiptBrand();

  const canRefund = hasPermission(user?.role, 'sales.refund');

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundItems, setRefundItems] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!id) return;
    const data = await saleApi.get(id).catch(() => null);
    setSale(data);
    return data;
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function openRefund() {
    if (!sale) return;
    const initial: Record<number, number> = {};
    sale.items.forEach((_, i) => {
      initial[i] = 0;
    });
    setRefundItems(initial);
    setRefundReason('');
    setRefundOpen(true);
  }

  async function submitRefund() {
    if (submitting) return;
    if (!sale) return;
    const items = Object.entries(refundItems)
      .filter(([, qty]) => qty > 0)
      .map(([idx, qty]) => ({ saleItemIndex: Number(idx), qty }));

    if (!items.length) {
      toast.error('Select at least one item to refund');
      return;
    }

    setSubmitting(true);
    try {
      await saleApi.refund(sale._id, {
        items,
        reason: refundReason.trim() || undefined,
      });
      toast.success('Refund processed');
      setRefundOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Refund failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrint() {
    if (!sale) return;

    const saleBranchName = getBranchName(sale);
    const saleBranchAddress = getBranchAddress(sale);
    const saleBranchPhone = getBranchPhone(sale);

    const showBranch = branches.length > 1;

    printReceipt({
      sale,
      businessName: receiptBrand.businessName,
      logoUrl: receiptBrand.logoUrl,
      storeAddress: receiptBrand.storeAddress,
      headerOverride: receiptBrand.receiptHeader,
      footerOverride: receiptBrand.receiptFooter,
      branchName: showBranch ? saleBranchName : null,
      branchAddress: showBranch ? saleBranchAddress : null,
      branchPhone: showBranch ? saleBranchPhone : null,
      cashierName: getCashierName(sale),
      customerName: getReceiptCustomerName(sale),
      currency: receiptBrand.currency,
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Sale"
          breadcrumb={
            <Link to="/app/sales" className="inline-flex items-center gap-1">
              <ArrowLeft size={12} /> Sales
            </Link>
          }
        />
        <Alert variant="danger">Sale not found.</Alert>
      </div>
    );
  }

  const statusKey = saleStatusColor(sale.status);
  const statusVariant =
    statusKey === 'success'
      ? 'success'
      : statusKey === 'warning'
        ? 'warning'
        : statusKey === 'info'
          ? 'info'
          : statusKey === 'danger'
            ? 'danger'
            : 'neutral';

  const totalQty = sale.items.reduce((s, i) => s + i.qty, 0);
  const refundedTotal = (sale.returns || []).reduce(
    (s, r) => s + (r.refundAmount || 0),
    0
  );

  const customerName = getCustomerName(sale);
  const patientName = getPatientName(sale);
  const cashierName = getCashierName(sale);
  const saleBranchName = getBranchName(sale);
  const showBranchMeta = branches.length > 1 && !!saleBranchName;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Sale ${sale.invoiceNo}`}
        subtitle={formatDateTime(sale.createdAt)}
        breadcrumb={
          <Link to="/app/sales" className="inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Sales
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>{saleStatusLabel(sale.status)}</Badge>
            <Button
              variant="outline"
              leftIcon={<Printer size={14} />}
              onClick={handlePrint}
            >
              Print
            </Button>
            {canRefund &&
              sale.status !== 'refunded' &&
              sale.status !== 'voided' && (
                <Button
                  variant="outline"
                  leftIcon={<RotateCcw size={14} />}
                  onClick={openRefund}
                >
                  Refund
                </Button>
              )}
          </div>
        }
      />

      {sale.status === 'refunded' && (
        <Alert variant="info" className="mb-4">
          Fully refunded — {formatMoney(refundedTotal, receiptBrand.currency)}
        </Alert>
      )}
      {sale.status === 'partially_refunded' && (
        <Alert variant="warning" className="mb-4">
          Partially refunded — {formatMoney(refundedTotal, receiptBrand.currency)} returned
        </Alert>
      )}

      <Card className="mb-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Meta icon={<ShoppingBag size={14} />} label="Payment method">
              <span className="text-sm font-medium text-text">
                {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
              </span>
            </Meta>

            <Meta icon={<CheckCircle2 size={14} />} label="Items">
              <span className="text-sm text-text">
                {sale.items.length} line{sale.items.length === 1 ? '' : 's'} ·{' '}
                {totalQty} unit{totalQty === 1 ? '' : 's'}
              </span>
            </Meta>

            <Meta icon={<UserIcon size={14} />} label="Served by">
              <span className="text-sm text-text">{cashierName || '—'}</span>
            </Meta>
          </div>

          <div className="space-y-3">
            <Meta icon={<UserIcon size={14} />} label="Customer">
              <span className="text-sm text-text">
                {customerName || 'Walk-in'}
              </span>
            </Meta>

            {patientName && (
              <Meta icon={<UserIcon size={14} />} label="Patient">
                <span className="text-sm text-text">{patientName}</span>
              </Meta>
            )}

            {showBranchMeta && (
              <Meta icon={<Building2 size={14} />} label="Branch">
                <span className="text-sm text-text">{saleBranchName}</span>
              </Meta>
            )}
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 border-b border-border pb-3 text-sm font-semibold text-text">
          Items
        </h2>
        <Table>
          <THead>
            <TR>
              <TH>Item</TH>
              <TH className="text-right">Qty</TH>
              <TH className="text-right">Unit</TH>
              <TH className="text-right">Total</TH>
            </TR>
          </THead>
          <TBody>
            {sale.items.map((item: SaleItem, i) => (
              <TR key={i}>
                <TD>
                  <p className="text-sm text-text">{item.name || 'Item'}</p>
                </TD>
                <TD className="text-right">
                  <span className="text-sm text-text-muted">{item.qty}</span>
                </TD>
                <TD className="text-right">
                  <span className="text-xs text-text-muted">
                    {formatMoney(item.unitPrice, receiptBrand.currency)}
                  </span>
                </TD>
                <TD className="text-right">
                  <span className="text-sm font-medium text-text">
                    {formatMoney(item.total, receiptBrand.currency)}
                  </span>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>

        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <Row label="Subtotal" value={formatMoney(sale.subtotal, receiptBrand.currency)} />
          {sale.tax > 0 && (
            <Row label="Tax" value={formatMoney(sale.tax, receiptBrand.currency)} />
          )}
          {sale.discount > 0 && (
            <Row
              label="Discount"
              value={`-${formatMoney(sale.discount, receiptBrand.currency)}`}
            />
          )}
          <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold text-text">
            <span>Total</span>
            <span>{formatMoney(sale.grandTotal, receiptBrand.currency)}</span>
          </div>
        </div>
      </Card>

      {sale.returns && sale.returns.length > 0 && (
        <Card className="mb-4">
          <h2 className="mb-3 border-b border-border pb-3 text-sm font-semibold text-text">
            Refund history
          </h2>
          <div className="space-y-3">
            {sale.returns.map((r) => (
              <div
                key={r._id}
                className="rounded-md border border-border bg-surface-2 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-text-muted">
                    {formatRelativeTime(r.processedAt || r.createdAt)}
                  </span>
                  <span className="text-sm font-semibold text-danger">
                    -{formatMoney(r.refundAmount, receiptBrand.currency)}
                  </span>
                </div>
                {r.reason && (
                  <p className="mt-1.5 text-xs text-text-muted">
                    Reason: {r.reason}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-text-subtle">
                  {r.items.length} item{r.items.length === 1 ? '' : 's'} ·{' '}
                  {r.status}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title="Process refund"
        size="md"
        onSubmit={submitRefund}
        busy={submitting}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setRefundOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitRefund}
              loading={submitting}
              variant="danger"
            >
              Refund selected
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert variant="warning">
            <div className="text-xs">
              Refunding returns the item to stock and marks the sale as{' '}
              <strong>partially</strong> or <strong>fully refunded</strong>.
            </div>
          </Alert>

          <div>
            <p className="mb-2 text-xs font-medium text-text">Items to refund</p>
            <div className="space-y-2">
              {sale.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">
                      {item.name || `Item ${i + 1}`}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {formatMoney(item.unitPrice, receiptBrand.currency)} · bought {item.qty}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={item.qty}
                    value={refundItems[i] ?? 0}
                    onChange={(e) => {
                      const v = Math.max(
                        0,
                        Math.min(item.qty, Number(e.target.value) || 0)
                      );
                      setRefundItems((prev) => ({ ...prev, [i]: v }));
                    }}
                    className="!w-20 text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          <FormField label="Reason (optional)">
            <Input
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Customer changed mind"
            />
          </FormField>
        </div>
      </Modal>
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

function Meta({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-text-muted">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-text-muted">
          {label}
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}