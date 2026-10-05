import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useSite } from '@/context/SiteProvider';

interface AuthShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function AuthShell({ children, title, subtitle, maxWidth = 'md' }: AuthShellProps) {
  const { brand } = useSite();
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Link to="/" className="mb-6 flex items-center gap-2.5">
        <Logo size={40} />
        <span className="text-lg font-semibold text-text">{brand?.name || 'PharmaSys'}</span>
      </Link>

      <div className={`w-full ${WIDTHS[maxWidth]} rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8`}>
        {title && (
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-text">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>

      <p className="mt-6 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} {brand?.name || 'PharmaSys'}
      </p>
    </div>
  );
}