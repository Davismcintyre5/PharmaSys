const STATS = [
  { value: '500+', label: 'Pharmacies onboarded' },
  { value: '5M+', label: 'Sales processed' },
  { value: '47', label: 'Counties covered' },
  { value: '99.5%', label: 'Uptime' },
];

const INTEGRATIONS = ['M-Pesa', 'Stripe', 'hdmBridge', 'HDM AI', 'Cloudinary'];

export function StatsBand() {
  return (
    <section className="border-b border-border bg-bg py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-primary sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
          {INTEGRATIONS.map((name) => (
            <span key={name} className="text-sm font-semibold text-text-muted">{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}