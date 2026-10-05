import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuthShell } from '@/components/layout/public/AuthShell';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { publicApi } from '@/api/public';
import { formatMoney, formatDate } from '@/utils/format';
import type { PublicInvoice } from '@/types';

export default function InvoicePage() {
  const { number } = useParams<{ number: string }>();
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!number) return;
    publicApi.invoices
      .getByNumber(number)
      .then(setInvoice)
      .catch((e) => setError(e.message || 'Invoice not found'))
      .finally(() => setLoading(false));
  }, [number]);

  if (loading) {
    return (
      <AuthShell>
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </AuthShell>
    );
  }

  if (error || !invoice) {
    return (
      <AuthShell title="Invoice not found">
        <Alert variant="danger">{error || 'Check the link and try again.'}</Alert>
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-primary hover:underline">
            <ArrowLeft size={12} className="mr-1 inline" /> Back to home
          </Link>
        </div>
      </AuthShell>
    );
  }

  const isPaid = invoice.status === 'paid';
  const instructions = invoice.paymentInstructions || [];

  return (
    <AuthShell
      title={`Invoice ${invoice.invoiceNumber}`}
      subtitle={isPaid ? 'Paid' : 'Awaiting payment'}
      maxWidth="lg"
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-surface-2 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Billed to</span>
            <span className="text-text">{invoice.customerSnapshot.name || '—'}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-text-muted">Issued</span>
            <span className="text-text">{formatDate(invoice.issuedAt)}</span>
          </div>
          {invoice.dueDate && (
            <div className="mt-2 flex justify-between">
              <span className="text-text-muted">Due</span>
              <span className="text-text">{formatDate(invoice.dueDate)}</span>
            </div>
          )}
        </div>

        <table className="w-full text-sm">
          <thead className="text-xs text-text-muted">
            <tr className="border-b border-border">
              <th className="py-2 text-left font-medium">Item</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-2 text-text">
                  {item.name}
                  {item.description && (
                    <span className="block text-xs text-text-subtle">{item.description}</span>
                  )}
                </td>
                <td className="py-2 text-right text-text-muted">{item.qty}</td>
                <td className="py-2 text-right text-text">{formatMoney(item.subtotal, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between text-text-muted">
            <span>Subtotal</span><span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-text-muted">
              <span>Discount</span><span>-{formatMoney(invoice.discount, invoice.currency)}</span>
            </div>
          )}
          {invoice.tax > 0 && (
            <div className="flex justify-between text-text-muted">
              <span>Tax</span><span>{formatMoney(invoice.tax, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-text">
            <span>Total</span><span>{formatMoney(invoice.total, invoice.currency)}</span>
          </div>
          {!isPaid && (
            <div className="flex justify-between text-sm font-medium text-warning">
              <span>Amount due</span><span>{formatMoney(invoice.amountDue, invoice.currency)}</span>
            </div>
          )}
        </div>

        {isPaid && <Alert variant="success">Paid on {formatDate(invoice.issuedAt)}</Alert>}

        {!isPaid && instructions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-text">How to pay</p>
            {instructions.map((inst) => {
              const isStk = inst.code === 'mpesa_stk';
              const steps = inst.steps ?? [];
              const recipientEntries = inst.recipient
                ? Object.entries(inst.recipient).filter(([, v]) => v !== null && v !== undefined && v !== '')
                : [];
              return (
                <div key={inst.code} className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-sm font-medium text-text">{inst.title}</p>
                  {inst.description && (
                    <p className="mt-1 text-xs text-text-muted">{inst.description}</p>
                  )}
                  {isStk && (
                    <p className="mt-2 text-xs text-text-muted">
                      Open the pending page to send the STK push from your phone.
                    </p>
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
                      {steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {invoice.notes && <p className="text-xs text-text-muted">{invoice.notes}</p>}

        <div className="flex justify-center pt-2">
          <Link to="/pending">
            <Button variant="outline" leftIcon={<ArrowLeft size={14} />}>Back to status</Button>
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}