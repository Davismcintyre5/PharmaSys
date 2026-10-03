const STEPS = [
  { n: '1', title: 'Sign up', text: 'Create your pharmacy account in under two minutes.' },
  { n: '2', title: 'Add your stock', text: 'Import your drug list or add items as you go.' },
  { n: '3', title: 'Start selling', text: 'Ring up sales, take payment, print receipts.' },
  { n: '4', title: 'Grow', text: 'Add branches, staff, and let AI handle the insight work.' },
];

export function HowItWorks() {
  return (
    <section className="border-b border-border bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-text sm:text-3xl">Up and running in minutes</h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-fg">
                {s.n}
              </div>
              <h3 className="mt-4 text-base font-semibold text-text">{s.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}