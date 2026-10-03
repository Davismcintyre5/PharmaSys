import { Link } from 'react-router-dom';
import { useSite } from '@/context/SiteProvider';

export function Footer() {
  const { brand } = useSite();
  return (
    <footer className="border-t border-border bg-surface px-4 py-3 text-xs text-text-muted">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          © {new Date().getFullYear()} {brand?.name || 'PharmaSys'} · v1.0.0
        </div>
        <div className="flex items-center gap-4">
          {brand?.supportEmail && (
            <a href={`mailto:${brand.supportEmail}`} className="hover:text-text">
              Support
            </a>
          )}
          <Link to="/app/settings" className="hover:text-text">
            Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}