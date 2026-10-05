import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Calendar,
  MoreVertical,
  Package,
  PackagePlus,
  Pencil,
  RotateCw,
  Trash2,
  UserX,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { StockBadge } from '@/components/app/StockBadge';
import { ExpiryBadge } from '@/components/app/ExpiryBadge';
import { RestockModal } from '@/components/app/RestockModal';
import { DrugFormModal } from './_DrugFormModal';
import { EditBatchModal } from './_EditBatchModal';
import { inventoryApi } from '@/api/inventory';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { hasPermission } from '@/utils/permissions';
import {
  DRUG_FORM_LABELS,
  MOVEMENT_TYPE_LABELS,
} from '@/utils/constants';
import {
  formatMoney,
  formatDateTime,
  formatRelativeTime,
  formatDate,
} from '@/utils/format';
import type { Drug, Batch, StockMovement, MovementType } from '@/types';

const MOVEMENT_ICONS: Record<string, React.ReactNode> = {
  in: <ArrowDown size={12} className="text-success" />,
  out: <ArrowUp size={12} className="text-info" />,
  adjust: <RotateCw size={12} className="text-warning" />,
  expired: <AlertTriangle size={12} className="text-danger" />,
  returned: <ArrowDown size={12} className="text-success" />,
};

type TabKey = 'batches' | 'movements';
type Danger =
  | { kind: 'deactivate' }
  | { kind: 'hard-delete' }
  | { kind: 'delete-batch'; batch: Batch }
  | null;

interface AdjustForm {
  type: MovementType;
  qty: string;
  batchId: string;
  note: string;
}

export default function DrugDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const canEdit = hasPermission(user?.role, 'drugs.edit');
  const canReceive = hasPermission(user?.role, 'inventory.receive');
  const canAdjust = hasPermission(user?.role, 'inventory.adjust');
  const isOwner = user?.role === 'owner';

  const [drug, setDrug] = useState<Drug | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [tab, setTab] = useState<TabKey>('batches');

  const [editing, setEditing] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustForm, setAdjustForm] = useState<AdjustForm>({
    type: 'adjust',
    qty: '',
    batchId: '',
    note: '',
  });
  const [savingAdjust, setSavingAdjust] = useState(false);
  const [danger, setDanger] = useState<Danger>(null);

  async function load() {
    if (!id) return;
    const res = await inventoryApi.drugs.get(id).catch(() => null);
    if (res && typeof res === 'object' && 'drug' in res) {
      setDrug((res as any).drug);
      setBatches((res as any).batches || []);
    } else if (res && '_id' in (res as any)) {
      setDrug(res as any as Drug);
      setBatches([]);
    } else {
      setDrug(null);
      setBatches([]);
    }
  }

  async function loadMovements() {
    if (!id) return;
    setMovementsLoading(true);
    try {
      const res = await inventoryApi.movements.list({ drugId: id, limit: 50 });
      const list = Array.isArray(res) ? res : ((res as any).items ?? []);
      setMovements(list);
    } finally {
      setMovementsLoading(false);
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (tab === 'movements' && movements.length === 0) {
      loadMovements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const currentQty = useMemo(
    () => batches.reduce((s, b) => s + (b.qty || 0), 0),
    [batches]
  );

  const nearestExpiry = useMemo(() => {
    const future = batches
      .filter((b) => b.qty > 0 && new Date(b.expiryDate) > new Date())
      .sort(
        (a, b) =>
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
    return future[0]?.expiryDate || null;
  }, [batches]);

  const stockValue = useMemo(
    () => batches.reduce((s, b) => s + (b.qty || 0) * (b.costPrice || 0), 0),
    [batches]
  );

  async function submitAdjust() {
    if (savingAdjust) return;
    if (!drug) return;
    const qtyNum = Number(adjustForm.qty);
    if (!Number.isFinite(qtyNum) || qtyNum === 0) {
      toast.error('Quantity must be a non-zero number');
      return;
    }

    setSavingAdjust(true);
    try {
      await inventoryApi.adjust({
        drugId: drug._id,
        batchId: adjustForm.batchId || undefined,
        type: adjustForm.type,
        qty: Math.abs(qtyNum),
        note: adjustForm.note.trim() || undefined,
      });
      toast.success('Stock adjusted');
      setAdjusting(false);
      setAdjustForm({ type: 'adjust', qty: '', batchId: '', note: '' });
      await load();
      await loadMovements();
    } catch (e: any) {
      toast.error(e?.message || 'Adjustment failed');
    } finally {
      setSavingAdjust(false);
    }
  }

  async function confirmDanger() {
    if (!danger || !drug) return;
    try {
      if (danger.kind === 'deactivate') {
        await inventoryApi.drugs.remove(drug._id);
        toast.success('Drug deactivated');
        navigate('/app/inventory', { replace: true });
      } else if (danger.kind === 'hard-delete') {
        await inventoryApi.drugs.hardRemove(drug._id);
        toast.success('Drug permanently deleted');
        navigate('/app/inventory', { replace: true });
      } else if (danger.kind === 'delete-batch') {
        await inventoryApi.batches.remove(danger.batch._id);
        toast.success('Batch deleted');
        setDanger(null);
        await load();
        await loadMovements();
        return;
      }
      setDanger(null);
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
      setDanger(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!drug) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Drug"
          breadcrumb={
            <Link to="/app/inventory" className="inline-flex items-center gap-1">
              <ArrowLeft size={12} /> Inventory
            </Link>
          }
        />
        <Alert variant="danger">Drug not found.</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={`${drug.name}${drug.strength ? ` ${drug.strength}` : ''}`}
        subtitle={[drug.generic, drug.brand, DRUG_FORM_LABELS[drug.form]]
          .filter(Boolean)
          .join(' · ')}
        breadcrumb={
          <Link to="/app/inventory" className="inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Inventory
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canReceive && !drug.controlled && (
              <Button
                leftIcon={<PackagePlus size={14} />}
                onClick={() => setRestocking(true)}
              >
                Restock
              </Button>
            )}
            {canAdjust && (
              <Button
                variant="outline"
                leftIcon={<RotateCw size={14} />}
                onClick={() => setAdjusting(true)}
              >
                Adjust stock
              </Button>
            )}
            {canEdit && (
              <Dropdown
                align="right"
                trigger={
                  <IconButton aria-label="More actions" variant="outline">
                    <MoreVertical size={14} />
                  </IconButton>
                }
              >
                <DropdownItem onClick={() => setEditing(true)}>
                  <span className="flex items-center gap-2">
                    <Pencil size={14} /> Edit drug
                  </span>
                </DropdownItem>
                {isOwner && (
                  <>
                    <DropdownSeparator />
                    <DropdownItem
                      danger
                      onClick={() => setDanger({ kind: 'deactivate' })}
                    >
                      <span className="flex items-center gap-2">
                        <UserX size={14} /> Deactivate
                      </span>
                    </DropdownItem>
                    <DropdownItem
                      danger
                      onClick={() => setDanger({ kind: 'hard-delete' })}
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 size={14} /> Delete permanently
                      </span>
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            )}
          </div>
        }
      />

      {(drug.prescriptionRequired || drug.controlled) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {drug.prescriptionRequired && (
            <Badge variant="warning">Prescription required</Badge>
          )}
          {drug.controlled && <Badge variant="danger">Controlled substance</Badge>}
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-muted">Total in stock</p>
              <p className="mt-0.5 text-xl font-bold text-text">{currentQty}</p>
              <div className="mt-1">
                <StockBadge
                  qty={currentQty}
                  reorderLevel={drug.reorderLevel}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info">
              <Calendar size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-muted">Nearest expiry</p>
              <p className="mt-0.5 text-sm font-semibold text-text">
                {nearestExpiry ? formatDate(nearestExpiry) : '—'}
              </p>
              {nearestExpiry && (
                <div className="mt-1">
                  <ExpiryBadge expiryDate={nearestExpiry} />
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <Package size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-muted">Stock value (cost)</p>
              <p className="mt-0.5 text-sm font-semibold text-text">
                {formatMoney(stockValue, 'KES')}
              </p>
              <p className="mt-0.5 text-[10px] text-text-subtle">at cost price</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Meta label="Category" value={drug.category || '—'} />
          <Meta label="Unit" value={drug.unit || 'pcs'} />
          <Meta label="Reorder level" value={String(drug.reorderLevel ?? 0)} />
          <Meta label="Tax rate" value={`${drug.taxRate ?? 0}%`} />
          <Meta label="Barcode" value={drug.barcode || '—'} mono />
          <Meta
            label="Status"
            value={drug.isActive === false ? 'Inactive' : 'Active'}
          />
        </div>
      </Card>

      <div className="mb-4">
        <Tabs
          items={[
            { value: 'batches', label: `Batches (${batches.length})` },
            { value: 'movements', label: 'Movements' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
        />
      </div>

      {tab === 'batches' && (
        <BatchesSection
          batches={batches}
          canAdjust={canAdjust}
          canReceive={canReceive}
          onRestock={() => setRestocking(true)}
          onEditBatch={(b) => setEditingBatch(b)}
          onDeleteBatch={(batch) => setDanger({ kind: 'delete-batch', batch })}
        />
      )}

      {tab === 'movements' && (
        <MovementsSection
          movements={movements}
          loading={movementsLoading}
          onReload={loadMovements}
        />
      )}

      <DrugFormModal
        open={editing}
        drug={drug}
        batches={batches}
        onClose={() => setEditing(false)}
        onSuccess={() => load()}
      />

      <RestockModal
        open={restocking}
        drug={drug}
        currentQty={currentQty}
        onClose={() => setRestocking(false)}
        onSuccess={async () => {
          await load();
          await loadMovements();
        }}
      />

      <EditBatchModal
        open={editingBatch !== null}
        batch={editingBatch}
        onClose={() => setEditingBatch(null)}
        onSuccess={async () => {
          await load();
          await loadMovements();
        }}
      />

      <Modal
        open={adjusting}
        onClose={() => setAdjusting(false)}
        title="Adjust stock"
        onSubmit={submitAdjust}
        busy={savingAdjust}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setAdjusting(false)}
              disabled={savingAdjust}
            >
              Cancel
            </Button>
            <Button onClick={submitAdjust} loading={savingAdjust}>
              Record adjustment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert variant="info">
            <div className="text-xs">
              Adjustments record a stock movement without creating a batch. Use this
              for corrections, expiry write-offs, and returns.
            </div>
          </Alert>

          <FormField label="Type" required>
            <Select
              value={adjustForm.type}
              onChange={(e) =>
                setAdjustForm((f) => ({ ...f, type: e.target.value as MovementType }))
              }
              options={[
                { value: 'in', label: 'Stock in' },
                { value: 'out', label: 'Stock out' },
                { value: 'adjust', label: 'Adjustment' },
                { value: 'expired', label: 'Expired' },
                { value: 'returned', label: 'Returned' },
              ]}
            />
          </FormField>

          <FormField label="Quantity" required hint="Enter a positive number">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={adjustForm.qty}
              onChange={(e) => setAdjustForm((f) => ({ ...f, qty: e.target.value }))}
              placeholder="e.g. 5"
            />
          </FormField>

          <FormField
            label="Batch"
            hint="Optional — link this movement to a specific batch"
          >
            <Select
              value={adjustForm.batchId}
              onChange={(e) =>
                setAdjustForm((f) => ({ ...f, batchId: e.target.value }))
              }
              options={[
                { value: '', label: 'No specific batch' },
                ...batches
                  .filter((b) => b.qty > 0)
                  .map((b) => ({
                    value: b._id,
                    label: `${b.lotNo || 'Unnamed'} · ${b.qty} units · exp ${formatDate(b.expiryDate)}`,
                  })),
              ]}
            />
          </FormField>

          <FormField label="Note">
            <Input
              value={adjustForm.note}
              onChange={(e) =>
                setAdjustForm((f) => ({ ...f, note: e.target.value }))
              }
              placeholder="Reason for adjustment"
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'hard-delete'
            ? `Permanently delete ${drug.name}?`
            : danger?.kind === 'delete-batch'
              ? 'Delete this batch?'
              : `Deactivate ${drug.name}?`
        }
        description={
          danger?.kind === 'hard-delete' ? (
            <>
              This <strong>cannot be undone</strong>. Drugs with batches or movements
              cannot be deleted — deactivate instead.
            </>
          ) : danger?.kind === 'delete-batch' ? (
            <>
              This batch will be removed from stock. Only batches with zero remaining
              stock can be deleted.
            </>
          ) : (
            <>
              The drug won't appear in searches or new sales. Its history is preserved.
            </>
          )
        }
        confirmLabel={
          danger?.kind === 'hard-delete'
            ? 'Delete permanently'
            : danger?.kind === 'delete-batch'
              ? 'Delete batch'
              : 'Deactivate'
        }
        variant="danger"
      />
    </div>
  );
}

function BatchesSection({
  batches,
  canAdjust,
  canReceive,
  onRestock,
  onEditBatch,
  onDeleteBatch,
}: {
  batches: Batch[];
  canAdjust: boolean;
  canReceive: boolean;
  onRestock: () => void;
  onEditBatch: (b: Batch) => void;
  onDeleteBatch: (b: Batch) => void;
}) {
  if (!batches.length) {
    return (
      <Card>
        <EmptyState
          icon={<Package size={22} />}
          title="No batches yet"
          description="Add stock to this drug to start tracking batches by expiry date."
          action={
            canReceive && (
              <Button leftIcon={<PackagePlus size={14} />} onClick={onRestock}>
                Restock
              </Button>
            )
          }
        />
      </Card>
    );
  }

  return (
    <Card plain className="overflow-hidden">
      <Table>
        <THead>
          <TR>
            <TH>Lot</TH>
            <TH>Qty</TH>
            <TH>Cost</TH>
            <TH>Sell</TH>
            <TH>Expiry</TH>
            <TH>Received</TH>
            {canAdjust && <TH className="text-right">Actions</TH>}
          </TR>
        </THead>
        <TBody>
          {batches.map((b) => (
            <TR key={b._id}>
              <TD>
                <span className="font-mono text-xs text-text">
                  {b.lotNo || '—'}
                </span>
              </TD>
              <TD>
                <span className="text-sm font-medium text-text">{b.qty}</span>
              </TD>
              <TD>
                <span className="text-xs text-text-muted">
                  {formatMoney(b.costPrice || 0, 'KES')}
                </span>
              </TD>
              <TD>
                <span className="text-xs text-text-muted">
                  {formatMoney(b.sellingPrice || 0, 'KES')}
                </span>
              </TD>
              <TD>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">
                    {formatDate(b.expiryDate)}
                  </span>
                  <ExpiryBadge expiryDate={b.expiryDate} />
                </div>
              </TD>
              <TD>
                <span className="text-xs text-text-subtle">
                  {b.receivedAt ? formatRelativeTime(b.receivedAt) : '—'}
                </span>
              </TD>
              {canAdjust && (
                <TD className="text-right">
                  <Dropdown
                    align="right"
                    trigger={
                      <IconButton aria-label="Actions" size="sm">
                        <MoreVertical size={14} />
                      </IconButton>
                    }
                  >
                    <DropdownItem onClick={() => onEditBatch(b)}>
                      <span className="flex items-center gap-2">
                        <Pencil size={14} /> Edit batch
                      </span>
                    </DropdownItem>
                    {b.qty === 0 && (
                      <>
                        <DropdownSeparator />
                        <DropdownItem danger onClick={() => onDeleteBatch(b)}>
                          <span className="flex items-center gap-2">
                            <Trash2 size={14} /> Delete batch
                          </span>
                        </DropdownItem>
                      </>
                    )}
                  </Dropdown>
                </TD>
              )}
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

function MovementsSection({
  movements,
  loading,
  onReload,
}: {
  movements: StockMovement[];
  loading: boolean;
  onReload: () => void;
}) {
  if (loading && !movements.length) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!movements.length) {
    return (
      <Card>
        <EmptyState
          icon={<RotateCw size={22} />}
          title="No movements yet"
          description="Stock movements appear here when you restock, adjust, sell, or write off."
        />
      </Card>
    );
  }

  return (
    <Card plain className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs text-text-muted">
          Showing {movements.length} recent movement
          {movements.length === 1 ? '' : 's'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<RotateCw size={12} />}
          onClick={onReload}
        >
          Refresh
        </Button>
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Type</TH>
            <TH>Qty</TH>
            <TH>Ref</TH>
            <TH>Note</TH>
            <TH>When</TH>
          </TR>
        </THead>
        <TBody>
          {movements.map((m) => (
            <TR key={m._id}>
              <TD>
                <span className="flex items-center gap-1.5 text-xs text-text">
                  {MOVEMENT_ICONS[m.type]}
                  {MOVEMENT_TYPE_LABELS[m.type] || m.type}
                </span>
              </TD>
              <TD>
                <span className="text-sm font-medium text-text">{m.qty}</span>
              </TD>
              <TD>
                <span className="font-mono text-xs text-text-muted">
                  {m.ref || '—'}
                </span>
              </TD>
              <TD>
                <span className="text-xs text-text-muted">{m.note || '—'}</span>
              </TD>
              <TD>
                <span className="text-xs text-text-subtle">
                  {formatDateTime(m.createdAt)}
                </span>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-0.5 text-sm text-text ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </p>
    </div>
  );
}