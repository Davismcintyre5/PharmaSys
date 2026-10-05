import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Pill,
  Stethoscope,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { prescriptionApi } from '@/api/prescription';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { hasPermission } from '@/utils/permissions';
import { prescriptionStatusLabel } from '@/utils/enums';
import { prescriptionStatusColor } from '@/utils/colors';
import { formatDateTime, formatRelativeTime } from '@/utils/format';
import type { Prescription } from '@/types';

type Danger = { kind: 'cancel' } | { kind: 'hard-delete' } | null;

export default function PrescriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const canDispense = hasPermission(user?.role, 'prescriptions.dispense');
  const isOwner = user?.role === 'owner';

  const [rx, setRx] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [danger, setDanger] = useState<Danger>(null);

  async function load() {
    if (!id) return;
    const data = await prescriptionApi.get(id).catch(() => null);
    setRx(data);
    return data;
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function dispense() {
    if (!rx) return;
    setBusy(true);
    try {
      await prescriptionApi.dispense(rx._id);
      toast.success('Prescription dispensed');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Dispense failed');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDanger() {
    if (!rx || !danger) return;
    try {
      if (danger.kind === 'cancel') {
        await prescriptionApi.cancel(rx._id);
        toast.success('Prescription cancelled');
        await load();
      } else {
        await prescriptionApi.hardRemove(rx._id);
        toast.success('Prescription permanently deleted');
        navigate('/app/prescriptions', { replace: true });
      }
      setDanger(null);
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!rx) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Prescription"
          breadcrumb={
            <Link
              to="/app/prescriptions"
              className="inline-flex items-center gap-1"
            >
              <ArrowLeft size={12} /> Prescriptions
            </Link>
          }
        />
        <Alert variant="danger">Prescription not found.</Alert>
      </div>
    );
  }

  const patient = rx.patientId as any;
  const doctor = rx.doctorId as any;
  const patientName = typeof patient === 'object' ? patient?.name : null;
  const patientPhone = typeof patient === 'object' ? patient?.phone : null;
  const doctorName = typeof doctor === 'object' ? doctor?.name : null;
  const ref = rx.refNo || String(rx._id).slice(-6).toUpperCase();
  const statusKey = prescriptionStatusColor(rx.status);
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

  const canCancel =
    canDispense && rx.status !== 'dispensed' && rx.status !== 'cancelled';
  const canHardDelete = isOwner && rx.status !== 'dispensed';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Prescription ${ref}`}
        subtitle={
          typeof patient === 'object'
            ? `For ${patientName || 'patient'}`
            : 'Prescription details'
        }
        breadcrumb={
          <Link to="/app/prescriptions" className="inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Prescriptions
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>
              {prescriptionStatusLabel(rx.status)}
            </Badge>
            {rx.status === 'pending' && canDispense && (
              <Button
                leftIcon={<CheckCircle2 size={14} />}
                loading={busy}
                onClick={dispense}
              >
                Dispense
              </Button>
            )}
          </div>
        }
      />

      {rx.status === 'dispensed' && (
        <Alert variant="success" className="mb-4">
          Dispensed{' '}
          {rx.dispensedAt ? formatRelativeTime(rx.dispensedAt) : ''}
          {rx.dispensedBy ? '' : ''}.
        </Alert>
      )}
      {rx.status === 'cancelled' && (
        <Alert variant="danger" className="mb-4">
          This prescription was cancelled. No stock was deducted.
        </Alert>
      )}

      {/* Patient + meta */}
      <Card className="mb-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserIcon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-text-muted">
                Patient
              </p>
              {typeof patient === 'object' && patient?._id ? (
                <>
                  <Link
                    to={`/app/patients/${patient._id}`}
                    className="mt-0.5 block truncate text-sm font-medium text-text hover:text-primary"
                  >
                    {patientName || 'Unnamed'}
                  </Link>
                  {patientPhone && (
                    <p className="mt-0.5 font-mono text-xs text-text-muted">
                      {patientPhone}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-0.5 text-sm text-text-muted">—</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
              <Stethoscope size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-text-muted">
                Prescriber
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-text">
                {doctorName || '—'}
              </p>
              {typeof doctor === 'object' && doctor?.clinic && (
                <p className="mt-0.5 truncate text-xs text-text-muted">
                  {doctor.clinic}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-xs">
          <span className="flex items-center gap-1.5 text-text-muted">
            <Calendar size={12} />
            Created {formatDateTime(rx.createdAt)}
          </span>
          {rx.dispensedAt && (
            <span className="flex items-center gap-1.5 text-text-muted">
              <CheckCircle2 size={12} />
              Dispensed {formatDateTime(rx.dispensedAt)}
            </span>
          )}
        </div>
      </Card>

      {/* Items */}
      <Card className="mb-4">
        <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Pill size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text">Items</h2>
            <p className="text-xs text-text-muted">
              {rx.items?.length || 0} prescription line
              {rx.items?.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {!rx.items?.length ? (
          <p className="py-4 text-sm text-text-muted">No items.</p>
        ) : (
          <div className="divide-y divide-border">
            {rx.items.map((item, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">
                    {item.dosage ? `Dosage: ${item.dosage}` : `Item ${i + 1}`}
                  </p>
                  {item.duration && (
                    <p className="mt-0.5 text-xs text-text-muted">
                      Duration: {item.duration}
                    </p>
                  )}
                  {item.notes && (
                    <p className="mt-1 text-xs text-text-subtle">{item.notes}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-text">×{item.qty}</p>
                  {item.refills > 0 && (
                    <p className="text-[10px] text-text-subtle">
                      {item.refills} refill{item.refills === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notes */}
      {rx.notes && (
        <Card className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <FileText size={14} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text">Notes</h2>
          </div>
          <p className="whitespace-pre-wrap text-sm text-text-muted">
            {rx.notes}
          </p>
        </Card>
      )}

      {/* Actions */}
      {(canCancel || canHardDelete) && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-text">Actions</h2>
          <div className="flex flex-wrap gap-2">
            {canCancel && (
              <Button
                variant="outline"
                leftIcon={<XCircle size={14} />}
                onClick={() => setDanger({ kind: 'cancel' })}
              >
                Cancel prescription
              </Button>
            )}
            {canHardDelete && (
              <Button
                variant="danger"
                leftIcon={<XCircle size={14} />}
                onClick={() => setDanger({ kind: 'hard-delete' })}
              >
                Delete permanently
              </Button>
            )}
          </div>
          {!canHardDelete && isOwner && rx.status === 'dispensed' && (
            <p className="mt-2 text-xs text-text-subtle">
              Dispensed prescriptions cannot be deleted — they're referenced by sales
              and stock history.
            </p>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'hard-delete'
            ? 'Permanently delete this prescription?'
            : 'Cancel this prescription?'
        }
        description={
          danger?.kind === 'hard-delete' ? (
            <>
              This <strong>cannot be undone</strong>. The record is removed from the
              database.
            </>
          ) : (
            <>
              The prescription is marked <strong>cancelled</strong>. Stock is not
              affected.
            </>
          )
        }
        confirmLabel={
          danger?.kind === 'hard-delete'
            ? 'Delete permanently'
            : 'Cancel prescription'
        }
        variant="danger"
      />
    </div>
  );
}