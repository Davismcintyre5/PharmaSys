import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { LegalModal } from '@/components/public/LegalModal';
import { useSite } from '@/context/SiteProvider';
import type { LegalType } from '@/types/public';

export function PublicFooter() {
  const { brand, settings } = useSite();
  const [legalType, setLegalType] = useState<LegalType | null>(null);

  const year = new Date().getFullYear();

  return (
    <>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo size={28} />
              <span className="text-base font-semibold text-text">
                {brand?.name || 'PharmaSys'}
              </span>
            </div>
            <p className="mt-3 text-sm text-text-muted">
              Modern pharmacy management for Kenya and beyond.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/features" className="text-text hover:text-primary">Features</Link></li>
              <li><Link to="/pricing" className="text-text hover:text-primary">Pricing</Link></li>
              <li><Link to="/downloads" className="text-text hover:text-primary">Downloads</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-text hover:text-primary">About</Link></li>
              <li><Link to="/contact" className="text-text hover:text-primary">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button className="text-text hover:text-primary" onClick={() => setLegalType('terms')}>
                  Terms of Service
                </button>
              </li>
              <li>
                <button className="text-text hover:text-primary" onClick={() => setLegalType('privacy')}>
                  Privacy Policy
                </button>
              </li>
              <li>
                <button className="text-text hover:text-primary" onClick={() => setLegalType('dpa')}>
                  DPA
                </button>
              </li>
              <li>
                <button className="text-text hover:text-primary" onClick={() => setLegalType('aup')}>
                  Acceptable Use
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-text-muted sm:flex-row">
            <div>© {year} {brand?.name || 'PharmaSys'}. All rights reserved.</div>
            <div className="flex items-center gap-4">
              {brand?.supportEmail && (
                <a href={`mailto:${brand.supportEmail}`} className="hover:text-primary">
                  {brand.supportEmail}
                </a>
              )}
              {brand?.supportWhatsapp && (
                <a
                  href={`https://wa.me/${brand.supportWhatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>

      <LegalModal
        open={legalType !== null}
        onClose={() => setLegalType(null)}
        type={legalType}
      />
    </>
  );
}