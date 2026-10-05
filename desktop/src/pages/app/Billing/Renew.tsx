import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, Smartphone, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { billingApi } from '@/api/billing';
import { publicApi } from '@/api/public';
import { useToast } from '@/hooks/useToast';
import { formatMoney, formatDate } from '@/utils/format';
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  formatKenyanPhoneDisplay,
} from '@/utils/phone';
import type { PublicPlan, PublicInvoice } from '@/types';

export default function Renew() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const planCode = params.get('plan') || '';

  const [plan, setPlan] = useState<PublicPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [pollingFast, setPollingFast] = useState(false);

  const fastPollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!planCode) {
      navigate('/app/billing', { replace: true });
      return;
    }
    publicApi.site
      .getPlans()
      .then((list) => {
        const found = list.find((p) => p.code === planCode);
        if (!found) {
          toast.error('Plan not available');
          navigate('/app/billing', { replace: true });
          return;
        }
        setPlan(found);
      })
      .catch(() => toast.error('Could not load plan'))
      .finally(() => setLoading(false));
  }, [planCode, navigate, toast]);

  useEffect(() => {
    return () => stopFastPoll();
  }, []);

  function stopFastPoll() {
    if (fastPollRef.current !== null) {
      window.clearInterval(fastPollRef.current);
      fastPollRef.current = null;
    }
    setPollingFast(false);
  }

  async function loadInvoice() {
    try {
      const fresh = await billingApi.invoice();
      if (fresh) setInvoice(fresh);
      return fresh;
    } catch {
      return null;
    }
  }

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
        setTimeout(() => navigate('/app/billing', { replace: true }), 1200);
        return;
      }
      if (attempts >= 20) {
        stopFastPoll();
        toast('Payment still pending. We will update when confirmed.', { icon: '⏳' });
      }
    }, 3000);
  }

  async function createInvoice() {
    if (!plan) return;
    setSubmitting(true);
    try {
      const res = await billingApi.renew(plan.code);
      // Server may activate free/zero-amount plans immediately
      if ('activated' in res && res.activated) {
        toast.success('Plan activated');
        navigate('/app/billing', { replace: true });
        return;
      }
      // Paid — fetch the freshly-created invoice
      const fresh = await loadInvoice();
      if (!fresh) {
        toast.error('Invoice created but could not be loaded');
        return;
      }
    } catch (e: any) {
      toast.error(e?.message || 'Could not create renewal invoice');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!plan) return null;

  const isPaid = invoice?.status === 'paid';
  const canPay = Boolean(invoice && !isPaid && invoice.amountDue > 0);
  const instructions = invoice?.paymentInstructions || [];
  const phoneValid = isValidKenyanPhone(phone);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Renew ${plan.name}`}
        subtitle="Complete payment to extend your subscription"
        breadcrumb={
          <Link to="/app/billing" className="inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Billing
          </Link>
        }
      />

      {/* Plan summary */}
      <Card className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">Plan</p>
            <p className="mt-1 text-lg font-semibold text-text">{plan.name}</p>
            <p className="mt-1 text-sm text-text-muted">{plan.description}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-text-muted">Amount</p>
            <p className="mt-1 text-lg font-semibold text-text">
              {formatMoney(plan.price.amount, plan.price.currency)}
            </p>
            <p className="text-xs text-text-muted">per {plan.price.interval}</p>
          </div>
        </div>
      </Card>

      {/* Step 1 — create invoice */}
      {!invoice && (
        <Card>
          <p className="text-sm text-text-muted">
            We'll generate a renewal invoice. After that, you can pay via M-Pesa or any other
            configured method.
          </p>
          <div className="mt-4">
            <Button onClick={createInvoice} loading={submitting} size="lg">
              Generate renewal invoice
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2 — show invoice + pay */}
      {invoice && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted">Invoice</p>
                <p className="mt-1 font-mono text-sm text-text">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-text-muted">Amount due</p>
                <p className="mt-1 text-lg font-semibold text-text">
                  {formatMoney(invoice.amountDue, invoice.currency)}
                </p>
              </div>
            </div>

            {invoice.dueDate && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
                <Clock size={12} />
                Pay before {formatDate(invoice.dueDate)}
              </div>
            )}
          </Card>

          {isPaid ? (
            <Alert variant="success" title="Payment received">
              Your subscription has been renewed. Redirecting...
            </Alert>
          ) : canPay ? (
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
                          {pollingFast ? 'Waiting for confirmation…' : inst.action?.label || 'Send STK push'}
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

              <Link to={`/invoice/${invoice.invoiceNumber}`} className="block">
                <Button fullWidth variant="outline">
                  View full invoice
                </Button>
              </Link>
            </div>
          ) : (
            <Alert variant="info">
              Nothing left to pay on this invoice. It will be applied shortly.
            </Alert>
          )}

          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              leftIcon={<RefreshCw size={14} />}
              onClick={async () => {
                await loadInvoice();
                toast.info('Status refreshed');
              }}
            >
              Check status
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}