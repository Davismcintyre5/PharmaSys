import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, LogOut, RefreshCw, Smartphone } from 'lucide-react';
import { AuthShell } from '@/components/layout/public/AuthShell';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { authApi } from '@/api/auth';
import { billingApi } from '@/api/billing';
import { formatMoney, formatDate } from '@/utils/format';
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  formatKenyanPhoneDisplay,
} from '@/utils/phone';
import type { PublicInvoice } from '@/types';

export default function Pending() {
  const toast = useToast();
  const { user, tenant, isAuthenticated, scope, logout, setInvoice } = useAuth();

  const [invoice, setLocalInvoice] = useState<PublicInvoice | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [pollingFast, setPollingFast] = useState(false);

  const fastPollRef = useRef<number | null>(null);

  /* ─────────────── FETCH INVOICE ─────────────── */

  async function loadInvoice() {
    try {
      const fresh = await billingApi.invoice();
      if (fresh) {
        setLocalInvoice(fresh);
        setInvoice(fresh);
      }
      return fresh;
    } catch {
      return null;
    }
  }

  /* ─────────────── CHECK TENANT STATUS ─────────────── */

  async function checkTenant() {
    try {
      const me = await authApi.me();
      if (me.tenant.status === 'active') {
        window.location.href = '/app/dashboard';
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /* ─────────────── INITIAL LOAD ─────────────── */

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─────────────── SLOW POLL — every 5s ─────────────── */

  useEffect(() => {
    if (!isAuthenticated || scope !== 'pending') return;

    const interval = window.setInterval(async () => {
      const done = await checkTenant();
      if (done) return;
      await loadInvoice();
    }, 5_000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, scope]);

  /* ─────────────── FAST POLL after STK — every 3s, 60s max ─────────────── */

  function startFastPoll() {
    stopFastPoll();
    setPollingFast(true);

    let attempts = 0;
    fastPollRef.current = window.setInterval(async () => {
      attempts++;
      const fresh = await loadInvoice();

      if (fresh?.status === 'paid') {
        stopFastPoll();
        toast.success('Payment received!');
        return;
      }

      if (attempts >= 20) {
        stopFastPoll();
        toast('Payment still pending. We\'ll update when confirmed.', { icon: '⏳' });
      }
    }, 3_000);
  }

  function stopFastPoll() {
    if (fastPollRef.current !== null) {
      window.clearInterval(fastPollRef.current);
      fastPollRef.current = null;
    }
    setPollingFast(false);
  }

  useEffect(() => {
    return () => stopFastPoll();
  }, []);

  /* ─────────────── MANUAL REFRESH ─────────────── */

  async function checkStatus() {
    setRefreshing(true);
    try {
      const done = await checkTenant();
      if (done) return;
      await loadInvoice();
      toast.info('Status refreshed');
    } finally {
      setRefreshing(false);
    }
  }

  /* ─────────────── STK PUSH ─────────────── */

  async function payWithMpesa() {
    const normalized = normalizeKenyanPhone(phone);
    if (!normalized) {
      toast.error('Enter a valid Kenyan phone number');
      return;
    }
    if (!invoice) return;

    setPaying(true);
    try {
      await billingApi.stkPush(normalized);
      toast.success(`Payment prompt sent to ${formatKenyanPhoneDisplay(normalized)}.`);
      startFastPoll();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send payment prompt');
    } finally {
      setPaying(false);
    }
  }

  /* ─────────────── DERIVED ─────────────── */

  const isPaid = invoice?.status === 'paid';
  const canPay = Boolean(invoice && !isPaid && invoice.amountDue > 0);
  const instructions = invoice?.paymentInstructions || [];
  const phoneValid = isValidKenyanPhone(phone);

  /* ─────────────── RENDER ─────────────── */

  return (
    <AuthShell
      title="Waiting for approval"
      subtitle={`Thanks for registering ${tenant?.name || ''}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        <Alert variant="info">
          We've received your registration and our team is reviewing it.
          You'll get an email once your account is live.
        </Alert>

        {/* ── INVOICE SUMMARY ── */}
        {invoice && (
          <div
            className={`rounded-lg border p-4 text-sm ${
              isPaid
                ? 'border-success/30 bg-success/5'
                : 'border-border bg-surface-2'
            }`}
          >
            {isPaid && (
              <div className="mb-2 flex items-center gap-2 text-success">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Payment received</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-text-muted">Invoice</span>
              <span className="font-mono text-xs text-text">{invoice.invoiceNumber}</span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-text-muted">Amount due</span>
              <span className="font-semibold text-text">
                {formatMoney(invoice.amountDue, invoice.currency)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-text-muted">Status</span>
              <span className={isPaid ? 'font-medium text-success' : 'font-medium text-warning'}>
                {isPaid ? 'Paid' : 'Unpaid'}
              </span>
            </div>

            {invoice.dueDate && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-text-muted">Due</span>
                <span className="text-text">{formatDate(invoice.dueDate)}</span>
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENT METHODS — only when unpaid ── */}
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
                <div key={inst.code} className="rounded-lg border border-border bg-surface p-4">
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
                        <p className="text-xs text-text-muted text-center">
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
                </div>
              );
            })}

            {invoice?.invoiceNumber && (
              <Link to={`/invoice/${invoice.invoiceNumber}`} className="block">
                <Button fullWidth variant="outline">
                  View full invoice
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* ── PAID STATE ── */}
        {isPaid && (
          <Alert variant="success" title="Payment received">
            We're processing your account now. You'll be redirected once approved.
          </Alert>
        )}

        {/* ── ACTIONS ── */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            fullWidth
            leftIcon={<RefreshCw size={14} />}
            loading={refreshing}
            onClick={checkStatus}
          >
            Check status
          </Button>
          <Button variant="ghost" fullWidth leftIcon={<LogOut size={14} />} onClick={logout}>
            Sign out
          </Button>
        </div>

        {/* ── FOOTER ── */}
        <div className="border-t border-border pt-4 text-center text-xs text-text-muted">
          <div className="flex items-center justify-center gap-1.5">
            <Clock size={12} />
            Usually takes less than 24 hours
          </div>
        </div>
      </div>
    </AuthShell>
  );
}