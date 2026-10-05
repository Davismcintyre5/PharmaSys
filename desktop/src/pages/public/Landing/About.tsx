import { useSite } from '@/context/SiteProvider';

export default function About() {
  const { brand } = useSite();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-text sm:text-4xl">
          About {brand?.name || 'PharmaSys'}
        </h1>
        <p className="mt-3 text-base text-text-muted">
          Built to give Kenyan pharmacies the tools they deserve.
        </p>
      </header>

      <section className="mt-12 space-y-6 text-base leading-relaxed text-text">
        <p>
          PharmaSys started with a simple observation: most pharmacies still run
          on notebooks, spreadsheets, and a lot of guesswork. Stock expires,
          prescriptions get lost, and owners have no clear picture of how the
          business is doing.
        </p>
        <p>
          We build software that removes that noise. Every feature — from point
          of sale to batch expiry to AI insights — exists to answer one question:
          <em> what does the pharmacy owner need to know right now?</em>
        </p>
        <p>
          The system is multi-tenant by design, so a single pharmacy and a
          national chain run on the same foundation. Branch managers see their
          own shop; owners see everything; staff see only what they need.
        </p>
        <p>
          We are Kenyan, we work in Kenyan Shillings, and we integrate the tools
          pharmacies here actually use — M-Pesa, SMS, and local support.
        </p>
      </section>

      <section className="mt-16 grid gap-8 sm:grid-cols-3">
        <ValueCard
          title="Simple by default"
          body="You don't need a manual to sell a drug. The interface hides complexity until you ask for it."
        />
        <ValueCard
          title="Honest pricing"
          body="Start free. Upgrade when you grow. No hidden charges, no forced contracts."
        />
        <ValueCard
          title="Built to last"
          body="Data is yours. Export any time. Our job is to keep it safe and useful."
        />
      </section>

      <section className="mt-16 rounded-xl border border-border bg-surface p-8 text-center">
        <h2 className="text-xl font-semibold text-text">Talk to us</h2>
        <p className="mt-2 text-sm text-text-muted">
          Questions, feedback, or partnership ideas — we'd love to hear from you.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
          {brand?.supportEmail && (
            <a
              href={`mailto:${brand.supportEmail}`}
              className="text-primary hover:underline"
            >
              {brand.supportEmail}
            </a>
          )}
          {brand?.supportWhatsapp && (
            <a
              href={`https://wa.me/${brand.supportWhatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              WhatsApp
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="mt-2 text-sm text-text-muted">{body}</p>
    </div>
  );
}