import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Pill,
  Receipt,
  ShoppingBag,
  User as UserIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { patientApi } from '@/api/patient';
import { formatMoney, formatDate, formatDateTime, formatRelativeTime } from '@/utils/format';
import { prescriptionStatusLabel, genderLabel } from '@/utils/enums';
import { prescriptionStatusColor } from '@/utils/colors';
import type { Patient, Prescription, Sale } from '@/types';

type TabKey = 'overview' | 'prescriptions' | 'purchases';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('overview');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      patientApi.get(id).catch(() => null),
      patientApi.prescriptions(id).catch(() => []),
      patientApi.sales(id).catch(() => []),
    ])
      .then(([p, rx, s]) => {
        setPatient(p);
        setPrescriptions(Array.isArray(rx) ? rx : []);
        setSales(Array.isArray(s) ? s : []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* ─── derived ─── */

  const age = useMemo(() => {
    if (!patient?.dob) return null;
    const diff = Date.now() - new Date(patient.dob).getTime();
    return Math.floor(diff / (365.25 * 86_400_000));
  }, [patient?.dob]);

  const totalSpent = useMemo(
    () => sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0),
    [sales]
  );

  const lastVisit = useMemo(() => {
    if (!sales.length) return null;
    return sales[0].createdAt;
  }, [sales]);

  const pendingRxCount = useMemo(
    () => prescriptions.filter((r) => r.status === 'pending').length,
    [prescriptions]
  );

  /* ─── render ─── */

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Patient"
          breadcrumb={
            <Link to="/app/patients" className="inline-flex items-center gap-1">
              <ArrowLeft size={12} /> Patients
            </Link>
          }
        />
        <Alert variant="danger">Patient not found.</Alert>
      </div>
    );
  }

  const hasAlerts =
    (patient.allergies?.length || 0) > 0 ||
    (patient.chronicConditions?.length || 0) > 0;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={patient.name}
        subtitle={[
          age !== null ? `${age} years` : null,
          patient.gender ? genderLabel(patient.gender) : null,
          patient.phone,
        ]
          .filter(Boolean)
          .join(' · ')}
        breadcrumb={
          <Link to="/app/patients" className="inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Patients
          </Link>
        }
        actions={
          <Button
            variant="outline"
            leftIcon={<Receipt size={14} />}
            onClick={() => navigate('/app/pos')}
          >
            New sale
          </Button>
        }
      />

      {/* Medical alerts */}
      {hasAlerts && (
        <div className="mb-4">
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">Medical alerts</p>
                {patient.allergies?.length > 0 && (
                  <p className="mt-1 text-xs text-text">
                    <span className="font-medium text-danger">Allergies:</span>{' '}
                    {patient.allergies.join(', ')}
                  </p>
                )}
                {patient.chronicConditions?.length > 0 && (
                  <p className="mt-0.5 text-xs text-text">
                    <span className="font-medium text-warning">
                      Chronic conditions:
                    </span>{' '}
                    {patient.chronicConditions.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot KPIs */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pill size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-muted">Prescriptions</p>
              <p className="mt-0.5 text-xl font-bold text-text">
                {prescriptions.length}
              </p>
              {pendingRxCount > 0 && (
                <p className="mt-0.5 text-[10px] text-warning">
                  {pendingRxCount} pending
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <ShoppingBag size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-muted">Total spent</p>
              <p className="mt-0.5 text-xl font-bold text-text">
                {formatMoney(totalSpent, 'KES')}
              </p>
              <p className="mt-0.5 text-[10px] text-text-subtle">
                across {sales.length} sale{sales.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info">
              <Calendar size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-muted">Last visit</p>
              <p className="mt-0.5 text-sm font-semibold text-text">
                {lastVisit ? formatRelativeTime(lastVisit) : 'Never'}
              </p>
              <p className="mt-0.5 text-[10px] text-text-subtle">
                Registered {formatDate(patient.createdAt)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-4 overflow-x-auto">
        <Tabs
          items={[
            { value: 'overview', label: 'Overview' },
            {
              value: 'prescriptions',
              label: `Prescriptions (${prescriptions.length})`,
            },
            { value: 'purchases', label: `Purchases (${sales.length})` },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
        />
      </div>

      {/* ═══════════ OVERVIEW ═══════════ */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 border-b border-border pb-3 text-sm font-semibold text-text">
              Contact
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Meta icon={<UserIcon size={14} />} label="Full name">
                {patient.name}
              </Meta>
              <Meta icon={<Phone size={14} />} label="Phone">
                {patient.phone || '—'}
              </Meta>
              <Meta icon={<Mail size={14} />} label="Email">
                {patient.email || '—'}
              </Meta>
              <Meta icon={<Calendar size={14} />} label="Date of birth">
                {patient.dob ? formatDate(patient.dob) : '—'}
              </Meta>
            </div>
          </Card>

          {patient.notes && (
            <Card>
              <h2 className="mb-3 border-b border-border pb-3 text-sm font-semibold text-text">
                Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm text-text-muted">
                {patient.notes}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════ PRESCRIPTIONS ═══════════ */}
      {tab === 'prescriptions' && (
        <>
          {prescriptions.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Pill size={22} />}
                title="No prescriptions yet"
                description="Prescriptions for this patient will appear here."
              />
            </Card>
          ) : (
            <Card plain className="overflow-hidden">
              <Table>
                <THead>
                  <TR>
                    <TH>Ref</TH>
                    <TH>Items</TH>
                    <TH>Status</TH>
                    <TH>Created</TH>
                    <TH className="text-right">Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {prescriptions.map((rx) => {
                    const key = prescriptionStatusColor(rx.status);
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
                    const ref = rx.refNo || String(rx._id).slice(-6).toUpperCase();
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
                          <span className="text-xs text-text-muted">
                            {rx.items?.length || 0} item
                            {rx.items?.length === 1 ? '' : 's'}
                          </span>
                        </TD>
                        <TD>
                          <Badge variant={variant}>
                            {prescriptionStatusLabel(rx.status)}
                          </Badge>
                        </TD>
                        <TD>
                          <span className="text-xs text-text-muted">
                            {formatRelativeTime(rx.createdAt)}
                          </span>
                        </TD>
                        <TD className="text-right">
                          <Link
                            to={`/app/prescriptions/${rx._id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            View
                          </Link>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </Card>
          )}
        </>
      )}

      {/* ═══════════ PURCHASES ═══════════ */}
      {tab === 'purchases' && (
        <>
          {sales.length === 0 ? (
            <Card>
              <EmptyState
                icon={<ShoppingBag size={22} />}
                title="No purchases yet"
                description="Sales linked to this patient will appear here."
              />
            </Card>
          ) : (
            <Card plain className="overflow-hidden">
              <Table>
                <THead>
                  <TR>
                    <TH>Invoice</TH>
                    <TH>Date</TH>
                    <TH>Items</TH>
                    <TH>Payment</TH>
                    <TH className="text-right">Total</TH>
                  </TR>
                </THead>
                <TBody>
                  {sales.map((s) => (
                    <TR key={s._id}>
                      <TD>
                        <Link
                          to={`/app/sales/${s._id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {s.invoiceNo}
                        </Link>
                      </TD>
                      <TD>
                        <span className="text-xs text-text-muted">
                          {formatDateTime(s.createdAt)}
                        </span>
                      </TD>
                      <TD>
                        <span className="text-xs text-text-muted">
                          {s.items?.reduce((sum, i) => sum + i.qty, 0) || 0}
                        </span>
                      </TD>
                      <TD>
                        <span className="text-xs capitalize text-text-muted">
                          {s.paymentMethod}
                        </span>
                      </TD>
                      <TD className="text-right">
                        <span className="text-sm font-semibold text-text">
                          {formatMoney(s.grandTotal, 'KES')}
                        </span>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}
        </>
      )}
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
        <p className="mt-0.5 text-sm text-text">{children}</p>
      </div>
    </div>
  );
}