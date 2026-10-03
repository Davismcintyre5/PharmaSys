import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { publicApi } from '@/api/public';
import { formatMoney } from '@/utils/format';
import type { PublicPlan } from '@/types/public';

function PlanCard({ plan, popular }: { plan: PublicPlan; popular?: boolean }) {
  const price = plan.price;
  const isFree = !price.amount;

  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-surface p-6 ${
        popular ? 'border-primary shadow-lg' : 'border-border'
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-6">
          <Badge variant="accent">Most popular</Badge>
        </div>
      )}

      <h3 className="text-lg font-semibold text-text">{plan.name}</h3>
      <p className="mt-1 text-sm text-text-muted">{plan.description}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-text">
          {isFree ? 'Free' : formatMoney(price.amount, price.currency)}
        </span>
        {!isFree && (
          <span className="text-sm text-text-muted">/{price.interval}</span>
        )}
      </div>

      {plan.trialDays > 0 && (
        <p className="mt-1 text-xs text-success">{plan.trialDays}-day free trial</p>
      )}

      <ul className="mt-6 space-y-2 text-sm">
        <li className="flex items-center gap-2 text-text">
          <Check size={14} className="text-success" />
          Up to {plan.limits.maxBranches} branch{plan.limits.maxBranches === 1 ? '' : 'es'}
        </li>
        <li className="flex items-center gap-2 text-text">
          <Check size={14} className="text-success" />
          {plan.limits.maxManagersPerBranch + plan.limits.maxCashiersPerBranch} staff seats
        </li>
        <li className="flex items-center gap-2 text-text">
          <Check size={14} className="text-success" />
          {plan.limits.maxProducts.toLocaleString()} drugs
        </li>
        {plan.features.aiInsights && (
          <li className="flex items-center gap-2 text-text">
            <Check size={14} className="text-success" />
            AI insights
          </li>
        )}
        {plan.features.multiBranch && (
          <li className="flex items-center gap-2 text-text">
            <Check size={14} className="text-success" />
            Multi-branch
          </li>
        )}
        {plan.features.prioritySupport && (
          <li className="flex items-center gap-2 text-text">
            <Check size={14} className="text-success" />
            Priority support
          </li>
        )}
      </ul>

      <div className="mt-auto pt-6">
        <Link to={`/register?plan=${plan.code}`}>
          <Button fullWidth variant={popular ? 'primary' : 'outline'}>
            Get started
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PricingTable({ plans }: { plans: PublicPlan[] }) {
  const rows: Array<{ label: string; get: (p: PublicPlan) => string | boolean }> = [
    { label: 'Branches', get: (p) => String(p.limits.maxBranches) },
    { label: 'Managers / branch', get: (p) => String(p.limits.maxManagersPerBranch) },
    { label: 'Cashiers / branch', get: (p) => String(p.limits.maxCashiersPerBranch) },
    { label: 'Products', get: (p) => p.limits.maxProducts.toLocaleString() },
    { label: 'Transactions / mo', get: (p) => p.limits.maxTransactionsPerMonth.toLocaleString() },
    { label: 'AI calls / day', get: (p) => String(p.limits.maxAiCallsPerDay) },
    { label: 'SMS / mo', get: (p) => String(p.limits.maxSmsPerMonth) },
    { label: 'Prescriptions', get: (p) => p.features.prescriptions },
    { label: 'Multi-branch', get: (p) => p.features.multiBranch },
    { label: 'AI insights', get: (p) => p.features.aiInsights },
    { label: 'API access', get: (p) => p.features.api },
    { label: 'Priority support', get: (p) => p.features.prioritySupport },
    { label: 'Custom domain', get: (p) => p.features.customDomain },
  ];

  return (
    <div className="mt-12 overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-medium text-text-muted">Feature</th>
            {plans.map((p) => (
              <th key={p.code} className="px-4 py-3 text-center font-medium text-text">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="px-4 py-3 text-text-muted">{row.label}</td>
              {plans.map((p) => {
                const v = row.get(p);
                return (
                  <td key={p.code} className="px-4 py-3 text-center text-text">
                    {typeof v === 'boolean' ? (
                      v ? <Check size={14} className="mx-auto text-success" /> : <span className="text-text-subtle">—</span>
                    ) : v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pricing({ showTable = true }: { showTable?: boolean }) {
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);

  useEffect(() => {
    publicApi.site.getPlans().then(setPlans).catch(() => setPlans([]));
  }, []);

  if (!plans) {
    return (
      <section className="border-b border-border bg-bg py-16">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-12">
          <Spinner size="lg" />
        </div>
      </section>
    );
  }

  const popularIndex = plans.length >= 3 ? 1 : -1;

  return (
    <section className="border-b border-border bg-bg py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-text sm:text-3xl">Simple, transparent pricing</h2>
          <p className="mt-3 text-base text-text-muted">
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => (
            <PlanCard key={p.code} plan={p} popular={i === popularIndex} />
          ))}
        </div>

        {showTable && plans.length > 1 && <PricingTable plans={plans} />}
      </div>
    </section>
  );
}