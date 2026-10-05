import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Eye,
  MoreVertical,
  Pill,
  Plus,
  Search,
  Trash2,
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
import { prescriptionApi } from '@/api/prescription';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { hasPermission } from '@/utils/permissions';
import { prescriptionStatusLabel } from '@/utils/enums';
import { prescriptionStatusColor } from '@/utils/colors';
import { formatRelativeTime } from '@/utils/format';
import type { Prescription, PrescriptionStatus } from '@/types';

const PAGE_SIZE = 20;

type TabKey = 'all' | PrescriptionStatus;
type Danger =
  | { prescription: Prescription; kind: 'cancel' }
  | { prescription: Prescription; kind: 'hard-delete' }
  | null;

function StatusBadge({ status }: { status: PrescriptionStatus }) {
  const key = prescriptionStatusColor(status);
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
  return <Badge variant={variant}>{prescriptionStatusLabel(status)}</Badge>;
}

export default function Prescriptions() {
  const toast = useToast();
  const { user } = useAuth();
  const canView = hasPermission(user?.role, 'prescriptions.view');
  const canDispense = hasPermission(user?.role, 'prescriptions.dispense');
  const isOwner = user?.role === 'owner';

  const [items, setItems] = useState<Prescription[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('all');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [danger, setDanger] = useState<Danger>(null);

  async function load() {
    const list = await prescriptionApi.list().catch(() => []);
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
  }, [canView]);

  /* ─────────── actions ─────────── */

  async function dispense(rx: Prescription) {
    setBusy(rx._id);
    try {
      await prescriptionApi.dispense(rx._id);
      toast.success('Prescription dispensed');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Dispense failed');
    } finally {
      setBusy(null);
    }
  }

  async function confirmDanger() {
    if (!danger) return;
    const { prescription, kind } = danger;
    try {
      if (kind === 'cancel') {
        await prescriptionApi.cancel(prescription._id);
        toast.success('Prescription cancelled');
      } else {
        await prescriptionApi.hardRemove(prescription._id);
        toast.success('Prescription permanently deleted');
      }
      setDanger(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  /* ─────────── derived ─────────── */

  const counts = useMemo(() => {
    const list = items ?? [];
    return {
      all: list.length,
      pending: list.filter((r) => r.status === 'pending').length,
      dispensed: list.filter((r) => r.status === 'dispensed').length,
      partial: list.filter((r) => r.status === 'partial').length,
      cancelled: list.filter((r) => r.status === 'cancelled').length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    let list = items;
    if (tab !== 'all') list = list.filter((r) => r.status === tab);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const ref = (r.refNo || r._id).toLowerCase();
        const patient = r.patientId as any;
        const name = (typeof patient === 'object' ? patient?.name : '')?.toLowerCase() || '';
        const phone = (typeof patient === 'object' ? patient?.phone : '')?.toLowerCase() || '';
        return ref.includes(q) || name.includes(q) || phone.includes(q);
      });
    }
    return list;
  }, [items, tab, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  /* ─────────── permission lockout ─────────── */

  if (!canView) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Prescriptions"
          subtitle="Manage patient prescriptions"
          breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        />
        <Card>
          <EmptyState
            icon={<Pill size={22} />}
            title="No access"
            description="You don't have permission to view prescriptions. Ask your branch manager or owner."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Prescriptions"
        subtitle={`${counts.all} total · ${counts.pending} pending`}
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        actions={
          canDispense && (
            <Link to="/app/prescriptions/new">
              <Button leftIcon={<Plus size={14} />}>New prescription</Button>
            </Link>
          )
        }
      />

      <div className="mb-4 overflow-x-auto">
        <Tabs
          items={[
            { value: 'all', label: `All (${counts.all})` },
            { value: 'pending', label: `Pending (${counts.pending})` },
            { value: 'dispensed', label: `Dispensed (${counts.dispensed})` },
            { value: 'partial', label: `Partial (${counts.partial})` },
            { value: 'cancelled', label: `Cancelled (${counts.cancelled})` },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
        />
      </div>

      <Card className="mb-4" plain>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={14} />}
          placeholder="Search by ref, patient name, or phone…"
        />
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !filtered.length ? (
        <Card>
          <EmptyState
            icon={<Pill size={22} />}
            title={search || tab !== 'all' ? 'No matches' : 'No prescriptions yet'}
            description={
              search || tab !== 'all'
                ? 'Try a different filter or search term.'
                : 'Create a prescription to start tracking dispenses.'
            }
            action={
              !search &&
              tab === 'all' &&
              canDispense && (
                <Link to="/app/prescriptions/new">
                  <Button leftIcon={<Plus size={14} />}>New prescription</Button>
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
                  <TH>Ref</TH>
                  <TH>Patient</TH>
                  <TH>Items</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paged.map((rx) => {
                  const patient = rx.patientId as any;
                  const patientName = typeof patient === 'object' ? patient?.name : null;
                  const patientPhone = typeof patient === 'object' ? patient?.phone : null;
                  const ref = rx.refNo || String(rx._id).slice(-6).toUpperCase();
                  const isBusy = busy === rx._id;
                  const canCancel =
                    canDispense && rx.status !== 'dispensed' && rx.status !== 'cancelled';

                  return (
                    <TR key={rx._id}>
                      <TD>
                        <Link
                          to={`/app/prescriptions/${rx._id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {ref}
                        </Link>
                      </TD>

                      <TD>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-text">
                            {patientName || '—'}
                          </p>
                          {patientPhone && (
                            <p className="truncate font-mono text-xs text-text-muted">
                              {patientPhone}
                            </p>
                          )}
                        </div>
                      </TD>

                      <TD>
                        <span className="text-xs text-text-muted">
                          {rx.items?.length || 0} item{rx.items?.length === 1 ? '' : 's'}
                        </span>
                      </TD>

                      <TD>
                        <StatusBadge status={rx.status} />
                      </TD>

                      <TD>
                        <span className="text-xs text-text-muted">
                          {formatRelativeTime(rx.createdAt)}
                        </span>
                      </TD>

                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {rx.status === 'pending' && canDispense && (
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<CheckCircle2 size={12} />}
                              loading={isBusy}
                              onClick={() => dispense(rx)}
                            >
                              Dispense
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
                            <DropdownItem>
                              <Link
                                to={`/app/prescriptions/${rx._id}`}
                                className="flex items-center gap-2"
                              >
                                <Eye size={14} /> View
                              </Link>
                            </DropdownItem>
                            {canCancel && (
                              <DropdownItem
                                danger
                                onClick={() =>
                                  setDanger({ prescription: rx, kind: 'cancel' })
                                }
                              >
                                <span className="flex items-center gap-2">
                                  <XCircle size={14} /> Cancel
                                </span>
                              </DropdownItem>
                            )}
                            {isOwner && rx.status !== 'dispensed' && (
                              <>
                                <DropdownSeparator />
                                <DropdownItem
                                  danger
                                  onClick={() =>
                                    setDanger({ prescription: rx, kind: 'hard-delete' })
                                  }
                                >
                                  <span className="flex items-center gap-2">
                                    <Trash2 size={14} /> Delete permanently
                                  </span>
                                </DropdownItem>
                              </>
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
            ? `Permanently delete this prescription?`
            : `Cancel this prescription?`
        }
        description={
          danger?.kind === 'hard-delete' ? (
            <>
              This <strong>cannot be undone</strong>. The prescription record is removed
              from the database. Dispensed prescriptions cannot be deleted.
            </>
          ) : (
            <>
              The prescription status changes to <strong>cancelled</strong>. Stock is
              untouched (nothing was dispensed yet). You can create a fresh prescription
              if needed.
            </>
          )
        }
        confirmLabel={danger?.kind === 'hard-delete' ? 'Delete permanently' : 'Cancel prescription'}
        variant="danger"
      />
    </div>
  );
}