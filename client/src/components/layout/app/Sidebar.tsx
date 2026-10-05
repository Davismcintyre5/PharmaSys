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
  // ↓ Settings visible to everyone — the page decides what tabs to show
  { to: '/app/settings', label: 'Settings', icon: <Settings size={16} /> },
];

export function Sidebar() {
  const { user } = useAuth();
  const { brand } = useSite();
  const role = user?.role;

  const visible = NAV_ITEMS.filter((item) => {
    if (item.ownerOnly && role !== 'owner') return false;
    if (item.permission && !hasPermission(role, item.permission)) return false;
    return true;
  });

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <Logo size={28} />
        <span className="truncate text-sm font-semibold text-text">
          {brand?.name || 'PharmaSys'}
        </span>
      </div>

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

      <div className="border-t border-border p-3 text-xs text-text-subtle">
        v1.0.0
      </div>
    </aside>
  );
}