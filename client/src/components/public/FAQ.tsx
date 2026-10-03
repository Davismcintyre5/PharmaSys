import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/components/ui/_cn';

interface Item {
  q: string;
  a: string;
}

const ITEMS: Item[] = [
  { q: 'Do I need to install anything?', a: 'No. PharmaSys runs in the browser. Just sign in from any computer or tablet. A mobile app is available for download.' },
  { q: 'Which payment methods are supported?', a: 'M-Pesa (STK Push, till, paybill) and card payments via Stripe. You can also record cash and bank transfers.' },
  { q: 'Can I manage multiple branches?', a: 'Yes, on the Pro and Business plans. Owners can switch between branches; managers see only their own.' },
  { q: 'Is my data secure?', a: 'Yes. Data is encrypted in transit and at rest. Access is restricted by role and audit-logged.' },
  { q: 'Can I export my data?', a: 'Yes. Sales, inventory, and reports can be exported any time. You own your data.' },
  { q: 'How do I get support?', a: 'Email, phone, or WhatsApp. Business plan customers get priority support.' },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="border-b border-border bg-bg py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text sm:text-3xl">Frequently asked questions</h2>
        </div>
        <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-surface">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-text">{item.q}</span>
                  <ChevronDown
                    size={16}
                    className={cn('shrink-0 text-text-muted transition-transform', isOpen && 'rotate-180')}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-text-muted">{item.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}