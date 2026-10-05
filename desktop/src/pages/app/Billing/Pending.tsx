import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  RefreshCw,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { billingApi } from '@/api/billing';
import { useToast } from '@/hooks/useToast';
import { formatMoney, formatDate } from '@/utils/format';
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  formatKenyanPhoneDisplay,
} from '@/utils/phone';
import type { BillingStatus, PublicInvoice } from '@/types';

function kindLabel(purpose?: string) {
  if (purpose === 'upgrade') return 'upgrade';
  if (purpose === 'renewal') return 'renewal';
  if (purpose === 'registration') return 'registration';
  return 'plan change';
}

export default function BillingPending() {
  const navigate = useNavigate();
  const toast = useToast();

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pollingFast, setPollingFast] = useState(false);
  const [phone, setPhone] = useState('');

  const fastPollRef = useRef<number | null>(null);

  /* ─────────── load ─────────── */

  async function loadAll() {
    const [inv, st] = await Promise.all([
      billingApi.invoice().catch(() => null),
      billingApi.status().catch(() => null),
    ]);
    setInvoice(inv);
    setStatus(st);
    return inv;
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
    return () => stopFastPoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─────────── auto-redirect when nothing to show ─────────── */

  useEffect(() => {
    if (loading) return;

    // No live invoice at all → bounce
    if (!invoice) {
      navigate('/app/billing', { replace: true });
      return;
    }

    // Not a plan-change invoice → this page isn't for it
    if (invoice.purpose !== 'renewal' && invoice.purpose !== 'upgrade') {
      navigate('/app/billing', { replace: true });
      return;
    }

    // Resolved states → bounce
    if (invoice.status === 'cancelled' || invoice.status === 'draft') {
      navigate('/app/billing', { replace: true });
    }
  }, [loading, invoice, navigate]);

  /* ─────────── polling ─────────── */

  function stopFastPoll() {
    if (fastPollRef.current !== null) {
      window.clearInterval(fastPollRef.current);
      fastPollRef.current = null;
    }
    setPollingFast(false);
  }

  function startFastPoll() {
    stopFastPoll();
    setPollingFast(true);
    let attempts = 0;

    fastPollRef.current = window.setInterval(async () => {
      attempts++;
      const fresh = await billingApi.invoice().catch(() => null);
      if (fresh) setInvoice(fresh);

      if (fresh?.status === 'paid') {
        stopFastPoll();
        toast.success('Payment received! Waiting for approval.');
        await loadAll();
        return;
      }

      if (attempts >= 20) {
        stopFastPoll();
        toast('Payment still pending. We will update when confirmed.', { icon: '⏳' });
      }
    }, 3000);
  }

  /* ─────────── actions ─────────── */

  async function refresh() {
    setRefreshing(true);
    try {
      await loadAll();
      toast.info('Status refreshed');
    } finally {
      setRefreshing(false);
    }
  }

  async function payWithMpesa() {
    const normalized = normalizeKenyanPhone(phone);
    if (!normalized) {
      toast.error('Enter a valid Kenyan phone number');
      return;
    }
    setPaying(true);
    try {
      await billingApi.stkPush(normalized);
      toast.success(`Payment prompt sent to ${formatKenyanPhoneDisplay(normalized)}.`);
      startFastPoll();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send payment prompt');
    } finally {
      setPaying(false);
    }
  }

  /* ─────────── render ─────────── */

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!invoice) return null;

  const kind = kindLabel(invoice.purpose);
  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';
  const canPay = !isPaid && invoice.amountDue > 0;
  const instructions = invoice.paymentInstructions || [];
  const phoneValid = isValidKenyanPhone(phone);

  const currentPlanName = status?.planName || null;
  const targetPlan = invoice.planCode;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Pending ${kind}`}
        subtitle="Complete payment to continue — this updates automatically."
        breadcrumb={
          <Link to="/app/billing" className="inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Billing
          </Link>
        }
      />

      {/* Status banner */}
      {isPaid ? (
        <div className="mb-4">
          <div className="rounded-xl border border-success/40 bg-success/5 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">
                  Payment received — awaiting approval
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  Our team will approve your {kind} shortly. You'll get an email once it's live.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : isOverdue ? (
        <Alert variant="danger" className="mb-4">
          This invoice is <strong>overdue</strong>. Pay now to avoid cancellation.
        </Alert>
      ) : (
        <Alert variant="info" className="mb-4">
          We've created your {kind} invoice. Pay to move forward.
        </Alert>
      )}

      {/* Invoice summary */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">Invoice</p>
            <p className="mt-1 font-mono text-sm text-text">{invoice.invoiceNumber}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={isPaid ? 'success' : isOverdue ? 'danger' : 'warning'}>
                {invoice.status}
              </Badge>
              <Badge variant="neutral">{kind}</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-text-muted">
              {isPaid ? 'Amount paid' : 'Amount due'}
            </p>
            <p className="mt-1 text-2xl font-bold text-text">
              {formatMoney(isPaid ? invoice.amountPaid : invoice.amountDue, invoice.currency)}
            </p>
            {invoice.dueDate && !isPaid && (
              <p className="mt-1 flex items-center justify-end gap-1 text-xs text-text-muted">
                <Clock size={12} />
                Due {formatDate(invoice.dueDate)}
              </p>
            )}
          </div>
        </div>

        {/* Plan change summary */}
        {invoice.purpose === 'upgrade' && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
              Plan change
            </p>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-text-muted">{currentPlanName || '—'}</span>
              <span className="text-text-subtle">→</span>
              <span className="font-medium text-text">{targetPlan || '—'}</span>
            </div>
          </div>
        )}

        {/* Line items */}
        {invoice.items?.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            {invoice.items.map((it, i) => (
              <div key={i} className="flex items-start justify-between py-1 text-sm">
                <div className="min-w-0 pr-3">
                  <p className="truncate text-text">{it.name}</p>
                  {it.description && (
                    <p className="truncate text-xs text-text-subtle">{it.description}</p>
                  )}
                </div>
                <span className="shrink-0 text-text">
                  {formatMoney(it.subtotal, invoice.currency)}
                </span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-semibold text-text">
              <span>Total</span>
              <span>{formatMoney(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Payment methods — only when unpaid */}
      {canPay && instructions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-text">Payment methods</p>

          {instructions.map((inst) => {
            const isStk = inst.code === 'mpesa_stk';
            const steps = inst.steps ?? [];
            const recipientEntries = inst.recipient
              ? Object.entries(inst.recipient).filter(
                  ([, v]) => v !== null && v !== undefined && v !== ''
                )
              : [];

            return (
              <Card key={inst.code}>
                <p className="text-sm font-medium text-text">{inst.title}</p>
                {inst.description && (
                  <p className="mt-1 text-xs text-text-muted">{inst.description}</p>
                )}

                {isStk && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => {
                        const n = normalizeKenyanPhone(phone);
                        if (n) setPhone(formatKenyanPhoneDisplay(n));
                      }}
                      placeholder="+254 712 345 678"
                      className={`w-full rounded-md border bg-surface-2 px-3 py-2 text-sm ${
                        phone && !phoneValid ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {phone && !phoneValid && (
                      <p className="text-xs text-danger">
                        Enter a valid Kenyan number (07…, 01…, +254…)
                      </p>
                    )}
                    <Button
                      fullWidth
                      leftIcon={<Smartphone size={16} />}
                      loading={paying || pollingFast}
                      onClick={payWithMpesa}
                      disabled={!phoneValid || pollingFast}
                    >
                      {pollingFast
                        ? 'Waiting for confirmation…'
                        : inst.action?.label || 'Send STK push'}
                    </Button>
                    {pollingFast && (
                      <p className="text-center text-xs text-text-muted">
                        Confirm the prompt on your phone. This updates automatically.
                      </p>
                    )}
                  </div>
                )}

                {!isStk && recipientEntries.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {recipientEntries.map(([k, v]) => (
                      <p key={k} className="text-xs text-text">
                        <span className="capitalize text-text-muted">{k}:</span>{' '}
                        <span className="font-mono">{String(v)}</span>
                      </p>
                    ))}
                  </div>
                )}

                {!isStk && steps.length > 0 && (
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-text-muted">
                    {steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Paid state */}
      {isPaid && (
        <Alert variant="success" title="We'll be in touch">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <div>
              Once our team approves, your new plan activates and you'll get an email.
              No action needed from you.
            </div>
          </div>
        </Alert>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <Button
          variant="outline"
          leftIcon={<RefreshCw size={14} />}
          loading={refreshing}
          onClick={refresh}
        >
          Check status
        </Button>

        <Link to={`/invoice/${invoice.invoiceNumber}`} className="block w-full sm:w-auto">
          <Button variant="ghost" fullWidth>
            View full invoice
          </Button>
        </Link>

        <Link to="/app/billing" className="block w-full sm:w-auto">
          <Button variant="ghost" leftIcon={<ArrowLeft size={14} />} fullWidth>
            Back to billing
          </Button>
        </Link>
      </div>

      {!isPaid && status?.status === 'active' && (
        <p className="mt-6 text-center text-xs text-text-subtle">
          <Sparkles size={12} className="mr-1 inline" />
          Your current plan stays active until the {kind} is approved.
        </p>
      )}
    </div>
  );
}