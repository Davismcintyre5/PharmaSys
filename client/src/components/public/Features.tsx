import {
  Bot, Boxes, CreditCard, FileText, Pill, ShieldCheck, ShoppingCart, Stethoscope, Truck,
} from 'lucide-react';
import { useSite } from '@/context/SiteProvider';

interface Feature {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ALL: Feature[] = [
  { key: 'pos', icon: <ShoppingCart size={20} />, title: 'Point of Sale', description: 'Fast checkout with barcode search, discounts, and multi-method payments.' },
  { key: 'inventory', icon: <Boxes size={20} />, title: 'Inventory & Batches', description: 'Track every lot, cost, expiry, and stock movement across branches.' },
  { key: 'prescriptions', icon: <Pill size={20} />, title: 'Prescriptions', description: 'Record and dispense prescriptions with patient history attached.' },
  { key: 'patient_records', icon: <Stethoscope size={20} />, title: 'Patient Records', description: 'Allergies, chronic conditions, and visits — searchable in seconds.' },
  { key: 'expiry_alerts', icon: <ShieldCheck size={20} />, title: 'Expiry Alerts', description: 'Get warned weeks before stock expires so you can act.' },
  { key: 'purchase_orders', icon: <Truck size={20} />, title: 'Purchase Orders', description: 'Raise POs, receive stock, and keep suppliers in sync.' },
  { key: 'invoices', icon: <FileText size={20} />, title: 'Invoices & Receipts', description: 'Print or email receipts with your logo and tax details.' },
  { key: 'ai_insights', icon: <Bot size={20} />, title: 'AI Insights', description: 'Weekly performance summaries and stock forecasts.' },
  { key: 'payments', icon: <CreditCard size={20} />, title: 'M-Pesa & Card', description: 'Accept mobile money and cards — payments reconcile automatically.' },
];

export function Features({ limit }: { limit?: number }) {
  const { settings } = useSite();
  const featureFlags = (settings as any)?.features || null;

  const visible = ALL.filter((f) => {
    if (!featureFlags) return true;
    const flag = featureFlags[`feature_${f.key}`];
    return flag === undefined ? true : flag === true;
  });

  const shown = limit ? visible.slice(0, limit) : visible;

  return (
    <section className="border-b border-border bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-text sm:text-3xl">
            Everything a modern pharmacy needs
          </h2>
          <p className="mt-3 text-base text-text-muted">
            No more spreadsheets, no more guessing. One system that runs the whole shop.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((f) => (
            <div
              key={f.key}
              className="rounded-xl border border-border bg-bg p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {f.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold text-text">{f.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}