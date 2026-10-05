import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthProvider';
import { useSite } from '@/context/SiteProvider';
import { cn } from '@/components/ui/_cn';

export function PublicHeader() {
  const { brand } = useSite();
  const { isAuthenticated, scope } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardHref = scope === 'pending' ? '/pending' : '/app/dashboard';

  const NAV_LINKS = [
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/about', label: 'About' },
    { to: '/downloads', label: 'Downloads' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        {/* Logo + wordmark — visible on all sizes */}
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <Logo size={28} />
          <span className="truncate text-sm font-semibold text-text sm:text-base">
            {brand?.name || 'PharmaSys'}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-text-muted hover:text-text'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />

          {isAuthenticated ? (
            <Link to={dashboardHref} className="hidden sm:inline-flex">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register" className="hidden sm:inline-flex">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}

          <IconButton
            aria-label="Toggle menu"
            size="md"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </IconButton>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-surface md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:bg-surface-2 hover:text-text'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {isAuthenticated ? (
                <Link to={dashboardHref} onClick={() => setMobileOpen(false)}>
                  <Button fullWidth>Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" fullWidth>
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    <Button fullWidth>Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}