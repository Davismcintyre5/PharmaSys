import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, User, Building2 } from 'lucide-react';
import { AuthShell } from '@/components/layout/public/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthProvider';
import { useSite } from '@/context/SiteProvider';
import { publicApi } from '@/api/public';
import { isValidEmail, isStrongPassword } from '@/utils/validators';
import { formatMoney } from '@/utils/format';
import type { PublicPlan } from '@/types';

export default function Register() {
  const [params] = useSearchParams();
  const { register } = useAuth();
  const { settings } = useSite();

  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    country: settings?.defaultCountry || 'KE',
    password: '',
    planCode: params.get('plan') || '',
  });

  useEffect(() => {
    publicApi.site
      .getPlans()
      .then((list) => {
        setPlans(list);
        if (!form.planCode && list.length) {
          // default to the second plan if present (usually Starter),
          // else the first plan
          const pick = list[1]?.code || list[0].code;
          setForm((f) => ({ ...f, planCode: f.planCode || pick }));
        }
      })
      .catch(() => setPlans([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.businessName || !form.ownerName || !form.email || !form.password || !form.planCode) {
      setError('Please fill in all required fields');
      return;
    }
    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email');
      return;
    }
    const strength = isStrongPassword(form.password);
    if (!strength.ok) {
      setError(`Password is too weak: ${strength.reasons.join(', ')}`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      // No navigate here — PublicOnlyRoute will route to /pending
      // because the server returns scope: 'pending' for new registrations.
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      setSubmitting(false);
    }
  }

  if (!plans) {
    return (
      <AuthShell maxWidth="lg">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your pharmacy on PharmaSys"
      maxWidth="lg"
    >
      <form onSubmit={submit} className="space-y-5">
        {error && <Alert variant="danger">{error}</Alert>}

        <FormField label="Pharmacy name" required>
          <Input
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            leftIcon={<Building2 size={14} />}
            placeholder="Kilimani Pharmacy"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Owner name" required>
            <Input
              value={form.ownerName}
              onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
              leftIcon={<User size={14} />}
              placeholder="Davis Okoth"
            />
          </FormField>
          <FormField label="Phone">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              leftIcon={<Phone size={14} />}
              placeholder="254712345678"
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email" required>
            <Input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              leftIcon={<Mail size={14} />}
              placeholder="you@example.com"
            />
          </FormField>
          <FormField label="Country">
            <Select
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              options={(settings?.countries || []).map((c) => ({
                value: c.code,
                label: c.name,
              }))}
            />
          </FormField>
        </div>

        <FormField
          label="Password"
          required
          hint="At least 8 characters with letters, numbers, and a symbol"
        >
          <Input
            type={showPass ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            leftIcon={<Lock size={14} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="text-text-subtle hover:text-text"
                aria-label={showPass ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
            placeholder="••••••••"
          />
        </FormField>

        <FormField label="Choose a plan" required>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const active = form.planCode === plan.code;
              const isFree = !plan.price.amount;
              const suffix = plan.price.interval === 'once' ? 'one-time' : `/${plan.price.interval}`;
              return (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, planCode: plan.code }))}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface hover:border-primary/40'
                  }`}
                >
                  <p className="text-sm font-semibold text-text">{plan.name}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {isFree ? 'Free' : `${formatMoney(plan.price.amount, plan.price.currency)} ${suffix}`}
                  </p>
                  {plan.trialDays > 0 && (
                    <p className="mt-1 text-[10px] text-success">{plan.trialDays}-day trial</p>
                  )}
                </button>
              );
            })}
          </div>
        </FormField>

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Create account
        </Button>

        <p className="text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}