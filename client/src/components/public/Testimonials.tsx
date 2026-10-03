import { Avatar } from '@/components/ui/Avatar';

interface Quote {
  name: string;
  role: string;
  quote: string;
}

const QUOTES: Quote[] = [
  { name: 'Amina K.', role: 'Owner, Kilimani Pharmacy', quote: 'We went from tracking expiry in a notebook to getting alerts a month early. Stock losses dropped by half.' },
  { name: 'Joseph M.', role: 'Manager, Ngong Road Chemist', quote: 'The POS is fast. Two cashiers on one branch and no confusion — everyone sees the same stock.' },
  { name: 'Dr. Faith W.', role: 'Owner, Westlands Family Pharmacy', quote: 'Prescriptions and patient history in one screen. The AI summary on Sunday night is surprisingly useful.' },
];

export function Testimonials() {
  return (
    <section className="border-b border-border bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-text sm:text-3xl">
            Trusted by pharmacies across Kenya
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {QUOTES.map((q) => (
            <figure key={q.name} className="rounded-xl border border-border bg-bg p-6">
              <blockquote className="text-sm text-text">"{q.quote}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <Avatar name={q.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-text">{q.name}</p>
                  <p className="text-xs text-text-muted">{q.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}