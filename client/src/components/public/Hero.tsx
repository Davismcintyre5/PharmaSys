import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSite } from '@/context/SiteProvider';

export function Hero() {
  const { brand } = useSite();

  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 md:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Built for pharmacies in Kenya
          </span>

          <h1 className="mt-5 text-3xl font-bold leading-tight text-text sm:text-5xl">
            Run your pharmacy
            <span className="block text-primary">without the paperwork.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base text-text-muted sm:text-lg">
            {brand?.name || 'PharmaSys'} handles sales, stock, prescriptions, expiries,
            patients, and payments — all in one clean dashboard.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-text">
            {[
              'Point of sale with M-Pesa & card',
              'Batch tracking with expiry alerts',
              'Prescriptions, patients, and refills',
              'AI insights on stock and sales',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/register">
              <Button size="lg" rightIcon={<ArrowRight size={16} />}>
                Start free trial
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg">
                See pricing
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <img
              src="/illustrations/hero.svg"
              alt="PharmaSys dashboard preview"
              className="h-full w-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}