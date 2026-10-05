import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { IconButton } from '@/components/ui/IconButton';
import { useAuth } from '@/context/AuthProvider';
import { useSite } from '@/context/SiteProvider';
import { hasPermission } from '@/utils/permissions';
import { cn } from '@/components/ui/_cn';
import { NAV_ITEMS } from './Sidebar';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { user } = useAuth();
  const { brand } = useSite();
  const role = user?.role;

  const visible = NAV_ITEMS.filter((item) => {
    if (item.ownerOnly && role !== 'owner') return false;
    if (item.permission && !hasPermission(role, item.permission)) return false;
    return true;
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col bg-surface shadow-xl animate-slide-up"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Logo size={24} />
            <span className="truncate text-sm font-semibold text-text">
              {brand?.name || 'PharmaSys'}
            </span>
          </div>
          <IconButton aria-label="Close menu" size="sm" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-surface-2 hover:text-text'
                )
              }
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3 text-xs text-text-subtle">
          v1.0.0
        </div>
      </div>
    </div>
  );
}