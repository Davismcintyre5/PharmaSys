import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, LayoutDashboard, ShoppingCart, Boxes, Users, Bot } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { IconButton } from '@/components/ui/IconButton';
import { useAuth } from '@/context/AuthProvider';
import { hasPermission } from '@/utils/permissions';
import { cn } from '@/components/ui/_cn';

const ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/app/pos', label: 'POS', icon: <ShoppingCart size={16} />, permission: 'sales.create' as const },
  { to: '/app/inventory', label: 'Inventory', icon: <Boxes size={16} /> },
  { to: '/app/patients', label: 'Patients', icon: <Users size={16} /> },
  { to: '/app/ai', label: 'AI', icon: <Bot size={16} />, permission: 'ai.use' as const },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const role = user?.role;

  const items = ITEMS.filter((i) => !i.permission || hasPermission(role, i.permission));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-64 bg-surface p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo size={24} />
                <span className="text-sm font-semibold">Menu</span>
              </div>
              <IconButton aria-label="Close" onClick={() => setOpen(false)} size="sm">
                <X size={16} />
              </IconButton>
            </div>
            <nav className="space-y-1">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
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
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}