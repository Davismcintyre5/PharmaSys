import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Boxes,
  Clock,
  MoreVertical,
  PackagePlus,
  Pencil,
  Pill,
  Plus,
  Search,
  Trash2,
  UserX,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { StockBadge } from '@/components/app/StockBadge';
import { RestockModal } from '@/components/app/RestockModal';
import { DrugFormModal } from './_DrugFormModal';
import { inventoryApi } from '@/api/inventory';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { hasPermission } from '@/utils/permissions';
import { DRUG_CATEGORIES, DRUG_FORM_LABELS } from '@/utils/constants';
import type { Drug } from '@/types';

const PAGE_SIZE = 25;

type Danger = { drug: Drug; kind: 'deactivate' | 'hard-delete' } | null;

export default function Drugs() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canCreate = hasPermission(user?.role, 'drugs.create');
  const canEdit = hasPermission(user?.role, 'drugs.edit');
  const canReceive = hasPermission(user?.role, 'inventory.receive');
  const isOwner = user?.role === 'owner';

  const [drugs, setDrugs] = useState<Drug[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const [lowCount, setLowCount] = useState<number | null>(null);
  const [expiringCount, setExpiringCount] = useState<number | null>(null);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Drug | null>(null);
  const [restocking, setRestocking] = useState<Drug | null>(null);
  const [danger, setDanger] = useState<Danger>(null);

  /* ─────────── loaders ─────────── */

  async function load() {
    const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
    if (search.trim()) params.search = search.trim();
    if (category) params.category = category;

    const res = await inventoryApi.drugs.list(params).catch(() => null);
    if (res) {
      const items = Array.isArray(res) ? res : ((res as any).items ?? []);
      const count = Array.isArray(res)
        ? items.length
        : ((res as any).meta?.total ?? items.length);
      setDrugs(items);
      setTotal(count);
    } else {
      setDrugs([]);
      setTotal(0);
    }
  }

  async function loadMetrics() {
    const [low, exp] = await Promise.all([
      inventoryApi.drugs.lowStock().catch(() => []),
      inventoryApi.drugs.expiring({ days: 30 }).catch(() => []),
    ]);
    setLowCount(Array.isArray(low) ? low.length : 0);
    setExpiringCount(Array.isArray(exp) ? exp.length : 0);
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, page]);

  useEffect(() => {
    loadMetrics();
  }, []);

  /* ─────────── handlers ─────────── */

  function openCreate() {
    setCreating(true);
  }

  function openEdit(d: Drug) {
    setEditing(d);
  }

  function afterDrugSaved() {
    load();
    loadMetrics();
  }

  async function confirmDanger() {
    if (!danger) return;
    const { drug, kind } = danger;
    try {
      if (kind === 'deactivate') {
        await inventoryApi.drugs.remove(drug._id);
        toast.success('Drug deactivated');
      } else {
        await inventoryApi.drugs.hardRemove(drug._id);
        toast.success('Drug permanently deleted');
      }
      setDanger(null);
      await load();
      await loadMetrics();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  function afterRestock() {
    load();
    loadMetrics();
  }

  /* ─────────── derived ─────────── */

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const outOfStock = lowCount ?? 0;

  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...DRUG_CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Inventory"
        subtitle={`${total} drug${total === 1 ? '' : 's'} in your catalog`}
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        actions={
          canCreate && (
            <Button leftIcon={<Plus size={14} />} onClick={openCreate}>
              New drug
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Boxes size={16} />}
          label="Total drugs"
          value={total.toLocaleString()}
          tint="primary"
        />
        <MetricCard
          icon={<AlertTriangle size={16} />}
          label="Low stock"
          value={lowCount === null ? '—' : lowCount.toLocaleString()}
          tint={lowCount && lowCount > 0 ? 'warning' : 'success'}
          href="/app/inventory/low-stock"
        />
        <MetricCard
          icon={<Pill size={16} />}
          label="Out of stock"
          value={outOfStock.toLocaleString()}
          tint={outOfStock > 0 ? 'danger' : 'success'}
          href="/app/inventory/low-stock"
        />
        <MetricCard
          icon={<Clock size={16} />}
          label="Expiring soon"
          value={expiringCount === null ? '—' : expiringCount.toLocaleString()}
          tint={expiringCount && expiringCount > 0 ? 'danger' : 'success'}
          href="/app/inventory/expiring"
        />
      </div>

      <Card className="mb-4" plain>
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search size={14} />}
            placeholder="Search by name, generic, or barcode…"
          />
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            options={categoryOptions}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !drugs?.length ? (
        <Card>
          <EmptyState
            icon={<Pill size={22} />}
            title={search || category ? 'No matches' : 'No drugs yet'}
            description={
              search || category
                ? 'Try a different search or clear the category filter.'
                : 'Add your first drug to start tracking stock, batches, and sales.'
            }
            action={
              !search &&
              !category &&
              canCreate && (
                <Button leftIcon={<Plus size={14} />} onClick={openCreate}>
                  New drug
                </Button>
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
                  <TH>Name</TH>
                  <TH>Category</TH>
                  <TH>Form</TH>
                  <TH>Stock</TH>
                  <TH>Rx</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {drugs.map((drug) => {
                  const canRestock = canReceive && !drug.controlled;
                  return (
                    <TR
                      key={drug._id}
                      onClick={() => navigate(`/app/inventory/${drug._id}`)}
                      className="cursor-pointer"
                    >
                      <TD>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text">
                            {drug.name}
                            {drug.strength ? <> {drug.strength}</> : null}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {[drug.generic, drug.brand].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                      </TD>

                      <TD>
                        <span className="text-xs text-text-muted">
                          {drug.category || '—'}
                        </span>
                      </TD>

                      <TD>
                        <span className="text-xs text-text-muted">
                          {DRUG_FORM_LABELS[drug.form] || drug.form}
                        </span>
                      </TD>

                      <TD>
                        <StockBadge
                          qty={drug.currentQty ?? 0}
                          reorderLevel={drug.reorderLevel}
                          size="sm"
                        />
                      </TD>

                      <TD>
                        <div className="flex items-center gap-1">
                          {drug.prescriptionRequired && (
                            <Badge variant="warning">Rx</Badge>
                          )}
                          {drug.controlled && (
                            <Badge variant="danger">Controlled</Badge>
                          )}
                          {!drug.prescriptionRequired && !drug.controlled && (
                            <span className="text-xs text-text-subtle">—</span>
                          )}
                        </div>
                      </TD>

                      {/* Stop propagation so buttons don't trigger row navigation */}
                      <TD
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {canRestock && (
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<PackagePlus size={12} />}
                              onClick={() => setRestocking(drug)}
                            >
                              Restock
                            </Button>
                          )}
                          <Dropdown
                            align="right"
                            trigger={
                              <IconButton aria-label="Actions" size="sm">
                                <MoreVertical size={14} />
                              </IconButton>
                            }
                          >
                            <DropdownItem
                              onClick={() =>
                                navigate(`/app/inventory/${drug._id}`)
                              }
                            >
                              View details
                            </DropdownItem>
                            {canEdit && (
                              <DropdownItem onClick={() => openEdit(drug)}>
                                <span className="flex items-center gap-2">
                                  <Pencil size={14} /> Edit drug
                                </span>
                              </DropdownItem>
                            )}
                            {canEdit && (
                              <>
                                <DropdownSeparator />
                                <DropdownItem
                                  danger
                                  onClick={() =>
                                    setDanger({ drug, kind: 'deactivate' })
                                  }
                                >
                                  <span className="flex items-center gap-2">
                                    <UserX size={14} /> Deactivate
                                  </span>
                                </DropdownItem>
                              </>
                            )}
                            {isOwner && (
                              <DropdownItem
                                danger
                                onClick={() =>
                                  setDanger({ drug, kind: 'hard-delete' })
                                }
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
              total={total}
              onChange={setPage}
            />
          )}
        </>
      )}

      <DrugFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSuccess={afterDrugSaved}
      />

      <DrugFormModal
        open={editing !== null}
        drug={editing}
        onClose={() => setEditing(null)}
        onSuccess={afterDrugSaved}
      />

      <RestockModal
        open={restocking !== null}
        drug={restocking}
        currentQty={restocking?.currentQty ?? 0}
        onClose={() => setRestocking(null)}
        onSuccess={afterRestock}
      />

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'hard-delete'
            ? `Permanently delete ${danger.drug.name}?`
            : `Deactivate ${danger?.drug.name}?`
        }
        description={
          danger?.kind === 'hard-delete' ? (
            <>
              This <strong>cannot be undone</strong>. Drugs that have batches or
              stock movements cannot be deleted — deactivate them instead.
            </>
          ) : (
            <>
              The drug won't appear in searches or new sales. Its batch and
              movement history is preserved.
            </>
          )
        }
        confirmLabel={
          danger?.kind === 'hard-delete' ? 'Delete permanently' : 'Deactivate'
        }
        variant="danger"
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tint,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: 'primary' | 'success' | 'warning' | 'danger';
  href?: string;
}) {
  const TINTS: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };

  const inner = (
    <Card className="h-full transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TINTS[tint]}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-muted">{label}</p>
          <p className="mt-0.5 text-xl font-bold text-text">{value}</p>
        </div>
      </div>
    </Card>
  );

  return href ? <Link to={href}>{inner}</Link> : inner;
}