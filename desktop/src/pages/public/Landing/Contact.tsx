import { Mail, MessageCircle, Phone } from 'lucide-react';
import { ContactForm } from '@/components/public/ContactForm';
import { useSite } from '@/context/SiteProvider';

export default function Contact() {
  const { brand } = useSite();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-text sm:text-4xl">Contact us</h1>
        <p className="mt-3 text-base text-text-muted">
          We usually respond within a few hours during business days.
        </p>
      </header>

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-text">Send a message</h2>
          <p className="mt-1 text-sm text-text-muted">
            Tell us what you need and we'll get back to you.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text">Other ways to reach us</h2>
          <div className="mt-6 space-y-4">
            {brand?.supportEmail && (
              <a
                href={`mailto:${brand.supportEmail}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 hover:border-primary/40"
              >
                <Mail size={18} className="mt-0.5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-text">Email</p>
                  <p className="text-xs text-text-muted">{brand.supportEmail}</p>
                </div>
              </a>
            )}
            {brand?.supportPhone && (
              <a
                href={`tel:${brand.supportPhone.replace(/\s+/g, '')}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 hover:border-primary/40"
              >
                <Phone size={18} className="mt-0.5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-text">Phone</p>
                  <p className="text-xs text-text-muted">{brand.supportPhone}</p>
                </div>
              </a>
            )}
            {brand?.supportWhatsapp && (
              <a
                href={`https://wa.me/${brand.supportWhatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 hover:border-primary/40"
              >
                <MessageCircle size={18} className="mt-0.5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-text">WhatsApp</p>
                  <p className="text-xs text-text-muted">{brand.supportWhatsapp}</p>
                </div>
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}