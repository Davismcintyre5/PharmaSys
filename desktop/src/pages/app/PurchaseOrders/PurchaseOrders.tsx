import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  FileText,
  MoreVertical,
  Plus,
  Search,
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
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { purchaseOrderApi } from '@/api/purchaseOrder';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { hasPermission } from '@/utils/permissions';
import { purchaseOrderStatusLabel } from '@/utils/enums';
import { purchaseOrderStatusColor } from '@/utils/colors';
import { formatMoney, formatRelativeTime } from '@/utils/format';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types';

const PAGE_SIZE = 20;

type TabKey = 'all' | PurchaseOrderStatus;

type Danger =
  | { po: PurchaseOrder; kind: 'cancel' }
  | { po: PurchaseOrder; kind: 'hard-delete' }
  | null;

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const key = purchaseOrderStatusColor(status);
  const variant =
    key === 'success'
      ? 'success'
      : key === 'warning'
        ? 'warning'
        : key === 'info'
          ? 'info'
          : key === 'danger'
            ? 'danger'
            : 'neutral';
  return <Badge variant={variant}>{purchaseOrderStatusLabel(status)}</Badge>;
}

export default function PurchaseOrders() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canView = hasPermission(user?.role, 'purchase_orders.view');
  const canCreate = hasPermission(user?.role, 'purchase_orders.create');
  const isOwner = user?.role === 'owner';

  const [items, setItems] = useState<PurchaseOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TabKey>('all');
  const [page, setPage] = useState(1);
  const [danger, setDanger] = useState<Danger>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const params: Record<string, unknown> = {};
    if (status !== 'all') params.status = status;

    const res = await purchaseOrderApi.list(params).catch(() => []);
    const list = Array.isArray(res) ? res : ((res as any).items ?? []);
    setItems(list);
    return list;
  }

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, status]);

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  /* ─── actions ─── */

  async function confirmDanger() {
    if (!danger) return;
    const { po, kind } = danger;
    setBusy(po._id);
    try {
      if (kind === 'cancel') {
        await purchaseOrderApi.cancel(po._id);
        toast.success('Purchase order cancelled');
      } else {
        await purchaseOrderApi.hardRemove(po._id);
        toast.success('Purchase order permanently deleted');
      }
      setDanger(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  }

  /* ─── derived ─── */

  const counts = useMemo(() => {
    const list = items ?? [];
    return {
      all: list.length,
      draft: list.filter((p) => p.status === 'draft').length,
      ordered: list.filter((p) => p.status === 'ordered').length,
      received: list.filter((p) => p.status === 'received').length,
      cancelled: list.filter((p) => p.status === 'cancelled').length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((po) => {
      const supplier = po.supplierId as any;
      const name =
        typeof supplier === 'object' ? supplier?.name?.toLowerCase() || '' : '';
      return po.poNo.toLowerCase().includes(q) || name.includes(q);
    });
  }, [items, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  /* ─── permission lockout ─── */

  if (!canView) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Purchase orders"
          subtitle="Manage supplier orders"
          breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        />
        <Card>
          <EmptyState
            icon={<FileText size={22} />}
            title="No access"
            description="You don't have permission to view purchase orders. Ask your branch manager or owner."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Purchase orders"
        subtitle={`${counts.all} total · ${counts.ordered} awaiting delivery`}
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        actions={
          canCreate && (
            <Link to="/app/purchase-orders/new">
              <Button leftIcon={<Plus size={14} />}>New order</Button>
            </Link>
          )
        }
      />

      <div className="mb-4 overflow-x-auto">
        <Tabs
          items={[
            { value: 'all', label: `All (${counts.all})` },
            { value: 'draft', label: `Draft (${counts.draft})` },
            { value: 'ordered', label: `Sent (${counts.ordered})` },
            { value: 'received', label: `Received (${counts.received})` },
            { value: 'cancelled', label: `Cancelled (${counts.cancelled})` },
          ]}
          value={status}
          onChange={(v) => setStatus(v as TabKey)}
        />
      </div>

      <Card className="mb-4" plain>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={14} />}
          placeholder="Search by PO number or supplier…"
        />
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !filtered.length ? (
        <Card>
          <EmptyState
            icon={<FileText size={22} />}
            title={search || status !== 'all' ? 'No matches' : 'No purchase orders yet'}
            description={
              search || status !== 'all'
                ? 'Try a different filter or search term.'
                : 'Raise a purchase order to restock from a supplier.'
            }
            action={
              !search &&
              status === 'all' &&
              canCreate && (
                <Link to="/app/purchase-orders/new">
                  <Button leftIcon={<Plus size={14} />}>New order</Button>
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <>
          <Card plain className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>PO</TH>
                  <TH>Supplier</TH>
                  <TH>Items</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH className="text-right">Total</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paged.map((po) => {
                  const supplier = po.supplierId as any;
                  const supplierName =
                    typeof supplier === 'object' ? supplier?.name : null;
                  const isBusy = busy === po._id;
                  const canCancel = po.status !== 'received' && po.status !== 'cancelled';

                  return (
                    <TR
                      key={po._id}
                      onClick={() => navigate(`/app/purchase-orders/${po._id}`)}
                      className="cursor-pointer"
                    >
                      <TD>
                        <span className="font-mono text-xs text-primary">
                          {po.poNo}
                        </span>
                      </TD>

                      <TD>
                        <span className="truncate text-sm text-text">
                          {supplierName || '—'}
                        </span>
                      </TD>

                      <TD>
                        <span className="text-xs text-text-muted">
                          {po.items?.length || 0} line
                          {po.items?.length === 1 ? '' : 's'}
                        </span>
                      </TD>

                      <TD>
                        <StatusBadge status={po.status} />
                      </TD>

                      <TD>
                        <span className="text-xs text-text-muted">
                          {formatRelativeTime(po.createdAt)}
                        </span>
                      </TD>

                      <TD className="text-right">
                        <span className="text-sm font-semibold text-text">
                          {formatMoney(po.total, 'KES')}
                        </span>
                      </TD>

                      <TD
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {po.status === 'draft' && (
                            <Link to={`/app/purchase-orders/${po._id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<Send size={12} />}
                              >
                                Review
                              </Button>
                            </Link>
                          )}
                          {po.status === 'ordered' && (
                            <Link to={`/app/purchase-orders/${po._id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<Truck size={12} />}
                              >
                                Receive
                              </Button>
                            </Link>
                          )}
                          <Dropdown
                            align="right"
                            trigger={
                              <IconButton aria-label="Actions" size="sm" disabled={isBusy}>
                                <MoreVertical size={14} />
                              </IconButton>
                            }
                          >
                            <DropdownItem>
                              <Link
                                to={`/app/purchase-orders/${po._id}`}
                                className="flex items-center gap-2"
                              >
                                <Eye size={14} /> View
                              </Link>
                            </DropdownItem>
                            {canCancel && canCreate && (
                              <>
                                <DropdownSeparator />
                                <DropdownItem
                                  danger
                                  onClick={() => setDanger({ po, kind: 'cancel' })}
                                >
                                  <span className="flex items-center gap-2">
                                    <XCircle size={14} /> Cancel
                                  </span>
                                </DropdownItem>
                              </>
                            )}
                            {isOwner &&
                              (po.status === 'draft' || po.status === 'cancelled') && (
                                <DropdownItem
                                  danger
                                  onClick={() => setDanger({ po, kind: 'hard-delete' })}
                                >
                                  <span className="flex items-center gap-2">
                                    <Trash2 size={14} /> Delete permanently
                                  </span>
                                </DropdownItem>
                              )}
                          </Dropdown>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </Card>

          {pages > 1 && (
            <Pagination
              page={page}
              pages={pages}
              total={filtered.length}
              onChange={setPage}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'hard-delete'
            ? `Permanently delete ${danger.po.poNo}?`
            : `Cancel ${danger?.po.poNo}?`
        }
        description={
          danger?.kind === 'hard-delete' ? (
            <>
              This <strong>cannot be undone</strong>. Only draft or cancelled
              POs can be deleted.
            </>
          ) : (
            <>
              The purchase order is marked <strong>cancelled</strong>. No stock
              is affected. You can raise a fresh PO if needed.
            </>
          )
        }
        confirmLabel={
          danger?.kind === 'hard-delete' ? 'Delete permanently' : 'Cancel PO'
        }
        variant="danger"
      />
    </div>
  );
}