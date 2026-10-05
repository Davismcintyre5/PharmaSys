import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Mail,
  Package,
  Phone,
  Send,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { purchaseOrderApi } from '@/api/purchaseOrder';
import { inventoryApi } from '@/api/inventory';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { hasPermission } from '@/utils/permissions';
import { purchaseOrderStatusLabel } from '@/utils/enums';
import { purchaseOrderStatusColor } from '@/utils/colors';
import { formatMoney, formatDateTime, formatRelativeTime } from '@/utils/format';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Drug,
} from '@/types';

interface ReceiveLine {
  drugId: string;
  drugName: string;
  orderedQty: number;
  qty: string;
  costPrice: string;
  sellingPrice: string;
  lotNo: string;
  expiryDate: string;
}

type Danger =
  | { kind: 'send' }
  | { kind: 'cancel' }
  | { kind: 'hard-delete' }
  | null;

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const canReceive = hasPermission(user?.role, 'purchase_orders.receive');
  const canCreate = hasPermission(user?.role, 'purchase_orders.create');
  const isOwner = user?.role === 'owner';

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [drugs, setDrugs] = useState<Record<string, Drug>>({});
  const [loading, setLoading] = useState(true);
  const [danger, setDanger] = useState<Danger>(null);
  const [busy, setBusy] = useState(false);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveLines, setReceiveLines] = useState<ReceiveLine[]>([]);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  async function load() {
    if (!id) return;
    const data = await purchaseOrderApi.get(id).catch(() => null);
    setPo(data);

    if (data?.items?.length) {
      const ids = data.items.map((i) => i.drugId).filter(Boolean);
      const list = await inventoryApi.drugs
        .list({ limit: 500 })
        .catch(() => []);
      const arr = Array.isArray(list) ? list : ((list as any).items ?? []);
      const map: Record<string, Drug> = {};
      for (const d of arr) {
        if (ids.includes(d._id)) map[d._id] = d;
      }
      setDrugs(map);
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const supplier = po?.supplierId as any;
  const supplierName = typeof supplier === 'object' ? supplier?.name : null;
  const supplierEmail = typeof supplier === 'object' ? supplier?.email : null;
  const supplierPhone = typeof supplier === 'object' ? supplier?.phone : null;
  const supplierContact =
    typeof supplier === 'object' ? supplier?.contactPerson : null;
  const supplierAddress = typeof supplier === 'object' ? supplier?.address : null;

  const totalQty = useMemo(
    () => po?.items?.reduce((s, i) => s + (i.qty || 0), 0) ?? 0,
    [po]
  );

  const statusKey = po ? purchaseOrderStatusColor(po.status) : 'neutral';
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

  function openReceive() {
    if (!po) return;
    const lines: ReceiveLine[] = po.items.map((item) => {
      const drug = drugs[item.drugId];
      return {
        drugId: item.drugId,
        drugName: drug?.name || 'Unknown drug',
        orderedQty: item.qty,
        qty: String(item.qty),
        costPrice: String(item.costPrice || 0),
        sellingPrice: drug?.lastSellingPrice ? String(drug.lastSellingPrice) : '',
        lotNo: '',
        expiryDate: '',
      };
    });
    setReceiveLines(lines);
    setReceiveOpen(true);
  }

  function patchLine<K extends keyof ReceiveLine>(
    idx: number,
    key: K,
    value: ReceiveLine[K]
  ) {
    setReceiveLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l))
    );
  }

  async function submitReceive() {
    if (receiveSubmitting) return;
    if (!po) return;

    const errors: string[] = [];
    for (const line of receiveLines) {
      const q = Number(line.qty);
      if (!Number.isFinite(q) || q <= 0) {
        errors.push(`${line.drugName}: quantity must be > 0`);
      }
      if (!line.expiryDate) {
        errors.push(`${line.drugName}: expiry date is required`);
      } else if (new Date(line.expiryDate) <= new Date()) {
        errors.push(`${line.drugName}: expiry must be in the future`);
      }
      const cost = Number(line.costPrice);
      if (!Number.isFinite(cost) || cost < 0) {
        errors.push(`${line.drugName}: cost price must be ≥ 0`);
      }
    }

    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    setReceiveSubmitting(true);
    try {
      await purchaseOrderApi.receive(po._id, {
        items: receiveLines.map((l) => ({
          drugId: l.drugId,
          qty: Number(l.qty),
          costPrice: Number(l.costPrice) || 0,
          sellingPrice: Number(l.sellingPrice) || 0,
          lotNo: l.lotNo.trim() || undefined,
          expiryDate: l.expiryDate,
        })),
      });
      toast.success('Stock received');
      setReceiveOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Receive failed');
    } finally {
      setReceiveSubmitting(false);
    }
  }

  async function confirmDanger() {
    if (!po || !danger) return;
    setBusy(true);
    try {
      if (danger.kind === 'send') {
        await purchaseOrderApi.send(po._id);
        toast.success('Purchase order sent to supplier');
        await load();
      } else if (danger.kind === 'cancel') {
        await purchaseOrderApi.cancel(po._id);
        toast.success('Purchase order cancelled');
        await load();
      } else {
        await purchaseOrderApi.hardRemove(po._id);
        toast.success('Purchase order permanently deleted');
        navigate('/app/purchase-orders', { replace: true });
      }
      setDanger(null);
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Purchase order"
          breadcrumb={
            <Link
              to="/app/purchase-orders"
              className="inline-flex items-center gap-1"
            >
              <ArrowLeft size={12} /> Purchase orders
            </Link>
          }
        />
        <Alert variant="danger">Purchase order not found.</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={po.poNo}
        subtitle={
          supplierName
            ? `${supplierName} · ${totalQty} unit${totalQty === 1 ? '' : 's'}`
            : `${totalQty} unit${totalQty === 1 ? '' : 's'}`
        }
        breadcrumb={
          <Link
            to="/app/purchase-orders"
            className="inline-flex items-center gap-1"
          >
            <ArrowLeft size={12} /> Purchase orders
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant}>
              {purchaseOrderStatusLabel(po.status)}
            </Badge>

            {po.status === 'draft' && canCreate && (
              <Button
                leftIcon={<Send size={14} />}
                onClick={() => setDanger({ kind: 'send' })}
              >
                Send to supplier
              </Button>
            )}

            {po.status === 'ordered' && canReceive && (
              <Button leftIcon={<Truck size={14} />} onClick={openReceive}>
                Receive stock
              </Button>
            )}

            {po.status !== 'received' && po.status !== 'cancelled' && canCreate && (
              <Button
                variant="outline"
                leftIcon={<XCircle size={14} />}
                onClick={() => setDanger({ kind: 'cancel' })}
              >
                Cancel
              </Button>
            )}

            {isOwner && (po.status === 'draft' || po.status === 'cancelled') && (
              <Button
                variant="danger"
                leftIcon={<Trash2 size={14} />}
                onClick={() => setDanger({ kind: 'hard-delete' })}
              >
                Delete
              </Button>
            )}
          </div>
        }
      />

      {po.status === 'ordered' && (
        <Alert variant="info" className="mb-4">
          <div className="flex items-start gap-2">
            <Send size={16} className="mt-0.5 shrink-0" />
            <div>
              Sent {po.sentAt ? formatRelativeTime(po.sentAt) : ''} to{' '}
              <strong>{supplierName || 'supplier'}</strong>. Awaiting delivery.
            </div>
          </div>
        </Alert>
      )}

      {po.status === 'received' && (
        <Alert variant="success" className="mb-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <div>
              Received {po.receivedAt ? formatRelativeTime(po.receivedAt) : ''} —
              batches were created and stock has been updated.
            </div>
          </div>
        </Alert>
      )}

      {po.status === 'cancelled' && (
        <Alert variant="danger" className="mb-4">
          This purchase order was cancelled. No stock was received.
        </Alert>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">Supplier</h2>
              <p className="text-xs text-text-muted">Who fulfils this order</p>
            </div>
          </div>

          {supplierName ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-text">{supplierName}</p>
              {supplierContact && (
                <p className="text-xs text-text-muted">{supplierContact}</p>
              )}
              {supplierEmail && (
                <p className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Mail size={11} />
                  <span className="truncate">{supplierEmail}</span>
                </p>
              )}
              {supplierPhone && (
                <p className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Phone size={11} />
                  <span className="font-mono">{supplierPhone}</span>
                </p>
              )}
              {supplierAddress && (
                <p className="text-xs text-text-muted">{supplierAddress}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">—</p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 text-info">
              <Calendar size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">Order details</h2>
              <p className="text-xs text-text-muted">Timeline and totals</p>
            </div>
          </div>

          <div className="space-y-1.5 text-sm">
            <Row label="PO number" value={po.poNo} mono />
            <Row label="Created" value={formatDateTime(po.createdAt)} />
            {po.sentAt && (
              <Row label="Sent" value={formatDateTime(po.sentAt)} />
            )}
            {po.receivedAt && (
              <Row label="Received" value={formatDateTime(po.receivedAt)} />
            )}
            <Row label="Lines" value={String(po.items?.length || 0)} />
            <Row label="Total units" value={String(totalQty)} />
            <Row label="Total" value={formatMoney(po.total, 'KES')} bold />
          </div>
        </Card>
      </div>

      {po.notes && (
        <Card className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <FileText size={14} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text">Notes</h2>
          </div>
          <p className="whitespace-pre-wrap text-sm text-text-muted">{po.notes}</p>
        </Card>
      )}

      <Card plain className="overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text">Items</h2>
        </div>

        {!po.items?.length ? (
          <EmptyState
            icon={<Package size={22} />}
            title="No items"
            description="This purchase order has no lines."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Drug</TH>
                <TH className="text-right">Qty ordered</TH>
                <TH className="text-right">Cost</TH>
                <TH className="text-right">Line total</TH>
              </TR>
            </THead>
            <TBody>
              {po.items.map((item: PurchaseOrderItem, i) => {
                const drug = drugs[item.drugId];
                return (
                  <TR key={i}>
                    <TD>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text">
                          {drug?.name || 'Unknown drug'}
                          {drug?.strength ? ` ${drug.strength}` : ''}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {[drug?.generic, drug?.form, drug?.unit]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </p>
                      </div>
                    </TD>
                    <TD className="text-right">
                      <span className="text-sm text-text">{item.qty}</span>
                    </TD>
                    <TD className="text-right">
                      <span className="text-xs text-text-muted">
                        {formatMoney(item.costPrice, 'KES')}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <span className="text-sm font-semibold text-text">
                        {formatMoney(item.total, 'KES')}
                      </span>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}

        {po.items?.length > 0 && (
          <div className="border-t border-border px-4 py-3">
            <div className="ml-auto max-w-xs space-y-1 text-sm">
              <Row label="Subtotal" value={formatMoney(po.subtotal, 'KES')} />
              {po.tax > 0 && (
                <Row label="Tax" value={formatMoney(po.tax, 'KES')} />
              )}
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold text-text">
                <span>Total</span>
                <span>{formatMoney(po.total, 'KES')}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        title="Receive stock"
        size="lg"
        onSubmit={submitReceive}
        busy={receiveSubmitting}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setReceiveOpen(false)}
              disabled={receiveSubmitting}
            >
              Cancel
            </Button>
            <Button
              leftIcon={<CheckCircle2 size={14} />}
              onClick={submitReceive}
              loading={receiveSubmitting}
            >
              Receive {receiveLines.length} line
              {receiveLines.length === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert variant="info">
            <div className="text-xs">
              Receiving creates a stock batch per line and logs a movement.
              Expiry is required for every line.
            </div>
          </Alert>

          {receiveLines.map((line, idx) => (
            <div
              key={line.drugId}
              className="rounded-lg border border-border bg-surface-2 p-3"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">
                    {line.drugName}
                  </p>
                  <p className="text-xs text-text-muted">
                    Ordered: {line.orderedQty}
                  </p>
                </div>
                <Badge variant="neutral">Line {idx + 1}</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <FormField label="Qty received" required>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={line.qty}
                    onChange={(e) => patchLine(idx, 'qty', e.target.value)}
                  />
                </FormField>
                <FormField label="Cost price" required>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    value={line.costPrice}
                    onChange={(e) => patchLine(idx, 'costPrice', e.target.value)}
                  />
                </FormField>
                <FormField label="Selling price">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    value={line.sellingPrice}
                    onChange={(e) => patchLine(idx, 'sellingPrice', e.target.value)}
                    placeholder="Inherit"
                  />
                </FormField>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FormField label="Lot number">
                  <Input
                    value={line.lotNo}
                    onChange={(e) => patchLine(idx, 'lotNo', e.target.value)}
                    placeholder="e.g. LOT-2026-A12"
                  />
                </FormField>
                <FormField label="Expiry date" required>
                  <Input
                    type="date"
                    value={line.expiryDate}
                    onChange={(e) => patchLine(idx, 'expiryDate', e.target.value)}
                    min={new Date(Date.now() + 86_400_000)
                      .toISOString()
                      .slice(0, 10)}
                  />
                </FormField>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'send'
            ? `Send ${po.poNo} to the supplier?`
            : danger?.kind === 'hard-delete'
              ? `Permanently delete ${po.poNo}?`
              : `Cancel ${po.poNo}?`
        }
        description={
          danger?.kind === 'send' ? (
            <>
              This will email <strong>{supplierName || 'the supplier'}</strong>{' '}
              with the order details and move the PO to <strong>Sent</strong>.
              You can still cancel it afterwards.
              {!supplierEmail && (
                <div className="mt-2 text-warning">
                  ⚠ The supplier has no email on file. The PO will be marked as
                  sent but nothing will be delivered.
                </div>
              )}
            </>
          ) : danger?.kind === 'hard-delete' ? (
            <>
              This <strong>cannot be undone</strong>. Only draft or cancelled
              POs can be deleted.
            </>
          ) : (
            <>
              The PO status changes to <strong>cancelled</strong>. No stock is
              affected.
            </>
          )
        }
        confirmLabel={
          danger?.kind === 'send'
            ? 'Send to supplier'
            : danger?.kind === 'hard-delete'
              ? 'Delete permanently'
              : 'Cancel PO'
        }
        variant={danger?.kind === 'send' ? 'primary' : 'danger'}
        loading={busy}
      />
    </div>
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-muted">{label}</span>
      <span
        className={`truncate text-right text-text ${
          mono ? 'font-mono text-xs' : ''
        } ${bold ? 'font-semibold' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}