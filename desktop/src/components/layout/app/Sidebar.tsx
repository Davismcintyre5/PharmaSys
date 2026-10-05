import { NavLink } from 'react-router-dom';
import {
  Boxes,
  Bot,
  Building2,
  CircleDollarSign,
  CreditCard,
  FileText,
  LayoutDashboard,
  Pill,
  Receipt,
  Settings,
  ShoppingCart,
  Stethoscope,
  Truck,
  Users,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthProvider';
import { useSite } from '@/context/SiteProvider';
import { useUpdater } from '@/hooks/useUpdater';
import { hasPermission } from '@/utils/permissions';
import { cn } from '@/components/ui/_cn';

export interface Item {
  to: string;
  label: string;
  icon: React.ReactNode;
  permission?: Parameters<typeof hasPermission>[1];
  ownerOnly?: boolean;
}

export const NAV_ITEMS: Item[] = [
  { to: '/app/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/app/pos', label: 'Point of Sale', icon: <ShoppingCart size={16} />, permission: 'sales.create' },
  { to: '/app/sales', label: 'Sales', icon: <Receipt size={16} /> },
  { to: '/app/inventory', label: 'Inventory', icon: <Boxes size={16} /> },
  { to: '/app/prescriptions', label: 'Prescriptions', icon: <Pill size={16} /> },
  { to: '/app/patients', label: 'Patients', icon: <Stethoscope size={16} /> },
  { to: '/app/customers', label: 'Customers', icon: <Users size={16} /> },
  { to: '/app/suppliers', label: 'Suppliers', icon: <Truck size={16} />, permission: 'suppliers.view' },
  { to: '/app/purchase-orders', label: 'Purchase Orders', icon: <FileText size={16} />, permission: 'purchase_orders.view' },
  { to: '/app/reports', label: 'Reports', icon: <CircleDollarSign size={16} />, permission: 'reports.branch' },
  { to: '/app/branches', label: 'Branches', icon: <Building2 size={16} />, ownerOnly: true },
  { to: '/app/users', label: 'Staff', icon: <Users size={16} />, permission: 'users.view' },
  { to: '/app/ai', label: 'AI', icon: <Bot size={16} />, permission: 'ai.use' },
  { to: '/app/billing', label: 'Billing', icon: <CreditCard size={16} />, ownerOnly: true },
  { to: '/app/settings', label: 'Settings', icon: <Settings size={16} /> },
];

export function Sidebar() {
  const { user } = useAuth();
  const { brand } = useSite();
  const { version, state, isElectron } = useUpdater();
  const role = user?.role;

  const visible = NAV_ITEMS.filter((item) => {
    if (item.ownerOnly && role !== 'owner') return false;
    if (item.permission && !hasPermission(role, item.permission)) return false;
    return true;
  });

  const downloading = state.kind === 'downloading';
  const percent = downloading ? state.percent : 0;
  const downloadVersion =
    state.kind === 'downloading' ? state.version : undefined;
  const displayVersion = version || '1.0.0';

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <Logo size={28} />
        <span className="truncate text-sm font-semibold text-text">
          {brand?.name || 'PharmaSys'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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

      {/* Footer — progress + version */}
      <div className="relative border-t border-border px-3 py-2 text-xs text-text-subtle">
        {downloading && isElectron && (
          <>
            {/* Thin progress line pinned to the top edge of the footer */}
            <div
              className="absolute left-0 right-0 top-0 h-0.5 overflow-hidden bg-surface-2"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Downloading update"
            >
              <div
                className="h-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-primary">
              <span className="truncate">
                {downloadVersion
                  ? `Downloading v${downloadVersion}…`
                  : 'Downloading update…'}
              </span>
              <span className="shrink-0 tabular-nums">{percent}%</span>
            </div>
          </>
        )}

        <div className="truncate">v{displayVersion}</div>
      </div>
    </aside>
  );
}