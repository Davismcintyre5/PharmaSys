import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Clock, CreditCard, Sparkles, TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { billingApi } from '@/api/billing';
import { publicApi } from '@/api/public';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { formatMoney, formatDate } from '@/utils/format';
import { subscriptionStatusLabel } from '@/utils/enums';
import { subscriptionStatusColor } from '@/utils/colors';
import type { BillingStatus, PublicInvoice, PublicPlan } from '@/types';

export default function Billing() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewingCode, setRenewingCode] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      billingApi.status().catch(() => null),
      publicApi.site.getPlans().catch(() => []),
      billingApi.invoice().catch(() => null),
    ])
      .then(([s, p, inv]) => {
        setStatus(s);
        setPlans(p);
        setInvoice(inv);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentPlan = useMemo(
    () => (plans && status ? plans.find((p) => p.code === status.planCode) ?? null : null),
    [plans, status]
  );

  const canManage = user?.role === 'owner';

  /**
   * An upgrade/renewal is "in process" when there's a live plan-change invoice
   * that hasn't been fully resolved:
   *   - status === 'sent' or 'overdue'  → awaiting payment
   *   - status === 'paid'               → awaiting admin approval
   * Only 'draft' and 'cancelled' are treated as not blocking.
   *
   * Registration invoices never count here — that's onboarding, not plan change.
   */
  const pendingInvoice = useMemo(() => {
    if (!invoice) return null;
    if (invoice.purpose !== 'renewal' && invoice.purpose !== 'upgrade') return null;
    if (invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'paid') {
      return invoice;
    }
    return null;
  }, [invoice]);

  const hasPending = pendingInvoice !== null;

  async function handleUpgradeOrRenew(plan: PublicPlan) {
    if (!canManage) {
      toast.error('Only the owner can change the plan');
      return;
    }
    if (hasPending) {
      toast.error('You already have a pending plan change');
      navigate('/app/billing/pending');
      return;
    }

    const isUpgrade =
      currentPlan &&
      currentPlan.code !== plan.code &&
      plan.price.amount > (currentPlan.price.amount || 0);
    const isRenew = currentPlan?.code === plan.code;

    if (!plan.price.amount) {
      setRenewingCode(plan.code);
      try {
        await billingApi.renew(plan.code);
        toast.success('Plan activated');
        const [fresh, freshInvoice] = await Promise.all([
          billingApi.status(),
          billingApi.invoice().catch(() => null),
        ]);
        setStatus(fresh);
        setInvoice(freshInvoice);
      } catch (e: any) {
        toast.error(e?.message || 'Could not activate plan');
      } finally {
        setRenewingCode(null);
      }
      return;
    }

    if (isUpgrade) navigate(`/app/billing/upgrade?plan=${plan.code}`);
    else if (isRenew) navigate(`/app/billing/renew?plan=${plan.code}`);
    else navigate(`/app/billing/upgrade?plan=${plan.code}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const statusColor = status ? subscriptionStatusColor(status.status) : 'neutral';
  const daysLeft = status?.daysLeft ?? null;

  const pendingKind =
    pendingInvoice?.purpose === 'upgrade'
      ? 'upgrade'
      : pendingInvoice?.purpose === 'renewal'
        ? 'renewal'
        : 'plan change';

  const pendingIsPaid = pendingInvoice?.status === 'paid';

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Billing"
        subtitle="Manage your subscription and plan"
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
      />

      {/* Expiry warning */}
      {status && status.status === 'active' && daysLeft !== null && daysLeft <= 7 && !hasPending && (
        <Alert variant="warning" className="mb-4">
          Your subscription expires in <strong>{daysLeft} day{daysLeft === 1 ? '' : 's'}</strong>. Renew now to avoid interruption.
        </Alert>
      )}

      {status && (status.status === 'expired' || status.status === 'past_due') && !hasPending && (
        <Alert variant="danger" className="mb-4">
          Your subscription is <strong>{subscriptionStatusLabel(status.status).toLowerCase()}</strong>. Renew to restore full access.
        </Alert>
      )}

      {/* ═══ IN-PROCESS BANNER ═══ */}
      {hasPending && pendingInvoice && (
        <div className="mb-4">
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">
                    {pendingKind === 'upgrade' ? 'Upgrade' : pendingKind === 'renewal' ? 'Renewal' : 'Plan change'} in progress
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Invoice <span className="font-mono">{pendingInvoice.invoiceNumber}</span>
                    {pendingIsPaid
                      ? ' · Payment received, waiting for approval'
                      : ` · ${formatMoney(pendingInvoice.amountDue, pendingInvoice.currency)} due`}
                  </p>
                  {pendingInvoice.dueDate && !pendingIsPaid && (
                    <p className="mt-0.5 text-xs text-text-subtle">
                      Pay before {formatDate(pendingInvoice.dueDate)}
                    </p>
                  )}
                </div>
              </div>
              <Link to="/app/billing/pending">
                <Button rightIcon={<ArrowRight size={14} />}>
                  View pending {pendingKind}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Current plan card */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              <h2 className="text-base font-semibold text-text">Current plan</h2>
              {status && (
                <Badge
                  variant={
                    statusColor === 'success'
                      ? 'success'
                      : statusColor === 'warning'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {subscriptionStatusLabel(status.status)}
                </Badge>
              )}
            </div>

            {status ? (
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-lg font-semibold text-text">
                  {status.planName}
                  {status.amountMinor > 0 && (
                    <span className="ml-2 text-sm font-normal text-text-muted">
                      {formatMoney(status.amountMinor / 100, status.currency)}
                      <span className="text-text-subtle">
                        {' '}/ {status.autoRenew ? 'recurring' : 'one-time'}
                      </span>
                    </span>
                  )}
                </p>
                {status.periodEnd && (
                  <p className="text-text-muted">
                    {status.status === 'expired' ? 'Expired' : 'Renews'} on {formatDate(status.periodEnd)}
                    {daysLeft !== null && daysLeft > 0 && (
                      <span className="ml-1 text-text-subtle">
                        ({daysLeft} day{daysLeft === 1 ? '' : 's'} left)
                      </span>
                    )}
                  </p>
                )}
                <p className="text-xs text-text-subtle">
                  Auto-renew: {status.autoRenew ? 'on' : 'off'}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-muted">No active subscription</p>
            )}
          </div>

          {currentPlan && !hasPending && (
            <div className="flex flex-col items-end gap-2">
              <Link to={`/app/billing/renew?plan=${currentPlan.code}`}>
                <Button variant="outline" leftIcon={<Sparkles size={14} />}>
                  Renew {currentPlan.name}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {status?.limits && (
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
            <LimitStat label="Branches" value={status.limits.maxBranches} />
            <LimitStat label="Products" value={status.limits.maxProducts} />
            <LimitStat label="Tx / month" value={status.limits.maxTransactionsPerMonth} />
            <LimitStat label="AI calls / day" value={status.limits.maxAiCallsPerDay} />
          </div>
        )}
      </Card>

      {/* Plans grid */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-text">
          {hasPending ? 'Available plans' : status ? 'Change plan' : 'Choose a plan'}
        </h2>
        {!canManage && <p className="text-xs text-text-muted">Only the owner can change the plan</p>}
        {hasPending && canManage && (
          <p className="text-xs text-text-muted">
            Plan changes are locked while a {pendingKind} is in progress
          </p>
        )}
      </div>

      {!plans || plans.length === 0 ? (
        <Card>
          <p className="text-sm text-text-muted">No plans available.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = status?.planCode === plan.code;
            const isDowngrade =
              currentPlan &&
              plan.price.amount < (currentPlan.price.amount || 0) &&
              plan.code !== currentPlan.code;

            return (
              <div
                key={plan.code}
                className={`relative flex flex-col rounded-xl border bg-surface p-5 ${
                  isCurrent ? 'border-primary shadow-sm' : 'border-border'
                } ${hasPending ? 'opacity-60' : ''}`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-4">
                    <Badge variant="accent">Current</Badge>
                  </div>
                )}

                <h3 className="text-base font-semibold text-text">{plan.name}</h3>
                <p className="mt-1 text-xs text-text-muted">{plan.description}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-text">
                    {plan.price.amount ? formatMoney(plan.price.amount, plan.price.currency) : 'Free'}
                  </span>
                  {plan.price.amount > 0 && (
                    <span className="text-xs text-text-muted">/{plan.price.interval}</span>
                  )}
                </div>

                <ul className="mt-4 flex-1 space-y-1.5 text-xs">
                  <PlanLine>{plan.limits.maxBranches} branch(es)</PlanLine>
                  <PlanLine>{plan.limits.maxProducts.toLocaleString()} products</PlanLine>
                  <PlanLine>{plan.limits.maxTransactionsPerMonth.toLocaleString()} tx / month</PlanLine>
                  {plan.features.aiInsights && <PlanLine>AI insights</PlanLine>}
                  {plan.features.prioritySupport && <PlanLine>Priority support</PlanLine>}
                </ul>

                <div className="mt-4">
                  {hasPending ? (
                    <Button fullWidth variant="outline" disabled>
                      Locked — pending {pendingKind}
                    </Button>
                  ) : isCurrent ? (
                    <Button fullWidth variant="outline" disabled>
                      Current plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button fullWidth variant="ghost" disabled title="Contact support to downgrade">
                      Contact support
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      rightIcon={<ArrowRight size={14} />}
                      loading={renewingCode === plan.code}
                      onClick={() => handleUpgradeOrRenew(plan)}
                    >
                      {currentPlan && plan.price.amount > (currentPlan.price.amount || 0)
                        ? 'Upgrade'
                        : 'Choose plan'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom CTA when pending */}
      {hasPending && (
        <div className="mt-6 flex justify-center">
          <Link to="/app/billing/pending">
            <Button size="lg" rightIcon={<ArrowRight size={16} />}>
              Go to pending {pendingKind}
            </Button>
          </Link>
        </div>
      )}

      {status?.status === 'expired' && !hasPending && (
        <Alert variant="info" className="mt-6">
          <div className="flex items-start gap-2">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            <div>
              Some features are locked while your subscription is expired. Renewing restores
              everything instantly.
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}

function LimitStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-text">{value.toLocaleString()}</p>
    </div>
  );
}

function PlanLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-1.5 text-text-muted">
      <Check size={12} className="mt-0.5 shrink-0 text-success" />
      <span>{children}</span>
    </li>
  );
}