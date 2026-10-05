import { Link } from 'react-router-dom';
import {
  Boxes,
  CircleDollarSign,
  FileText,
  Receipt,
  Stethoscope,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

interface ReportLink {
  to: string;
  title: string;
  description: string;
}

interface ReportGroup {
  key: string;
  title: string;
  icon: React.ReactNode;
  accent: string;
  items: ReportLink[];
}

const GROUPS: ReportGroup[] = [
  {
    key: 'inventory',
    title: 'Inventory',
    icon: <Boxes size={18} />,
    accent: 'bg-primary/10 text-primary',
    items: [
      { to: '/app/reports/inventory/stock', title: 'Stock on hand', description: 'Every drug and its current stock' },
      { to: '/app/reports/inventory/valuation', title: 'Stock valuation', description: 'Cost and retail value of current stock' },
      { to: '/app/reports/inventory/low-stock', title: 'Low stock', description: 'Drugs at or below reorder level' },
      { to: '/app/reports/inventory/expiring', title: 'Expiring soon', description: 'Batches approaching expiry' },
    ],
  },
  {
    key: 'sales',
    title: 'Sales',
    icon: <Receipt size={18} />,
    accent: 'bg-success/10 text-success',
    items: [
      { to: '/app/reports/sales/daily', title: 'Daily summary', description: "Today's sales and transactions" },
      { to: '/app/reports/sales/range', title: 'Sales range', description: 'Sales over a chosen date range' },
      { to: '/app/reports/sales/top-drugs', title: 'Top drugs', description: 'Best sellers by units and revenue' },
      { to: '/app/reports/sales/by-method', title: 'Payment methods', description: 'Sales grouped by payment type' },
    ],
  },
  {
    key: 'customers',
    title: 'Customers',
    icon: <Users size={18} />,
    accent: 'bg-info/10 text-info',
    items: [
      { to: '/app/reports/customers/list', title: 'Customer list', description: 'All active customers' },
      { to: '/app/reports/customers/top', title: 'Top spenders', description: 'Customers ranked by lifetime spend' },
      { to: '/app/reports/customers/history', title: 'Purchase history', description: 'Recent purchases per customer' },
    ],
  },
  {
    key: 'patients',
    title: 'Patients',
    icon: <Stethoscope size={18} />,
    accent: 'bg-warning/10 text-warning',
    items: [
      { to: '/app/reports/patients/list', title: 'Patient list', description: 'All active patient records' },
      { to: '/app/reports/patients/demographics', title: 'Demographics', description: 'Age and gender breakdown' },
      { to: '/app/reports/patients/visits', title: 'Visit history', description: 'Most frequent visitors' },
    ],
  },
  {
    key: 'staff',
    title: 'Staff',
    icon: <Users size={18} />,
    accent: 'bg-accent/10 text-accent',
    items: [
      { to: '/app/reports/staff/list', title: 'Staff list', description: 'Every team member and role' },
      { to: '/app/reports/staff/by-role', title: 'By role', description: 'Headcount grouped by role' },
      { to: '/app/reports/staff/activity', title: 'Activity', description: 'Logins and sales per cashier' },
    ],
  },
  {
    key: 'general',
    title: 'General',
    icon: <CircleDollarSign size={18} />,
    accent: 'bg-danger/10 text-danger',
    items: [
      { to: '/app/reports/general/summary', title: 'Business summary', description: 'High-level pharmacy overview' },
      { to: '/app/reports/general/tax', title: 'Tax report', description: 'Tax collected over a period' },
      { to: '/app/reports/general/expiry-loss', title: 'Expiry loss', description: 'Value lost to expiring stock' },
    ],
  },
];

export default function Reports() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Reports"
        subtitle="View, filter, and print any report"
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
      />

      <div className="space-y-6">
        {GROUPS.map((group) => (
          <div key={group.key}>
            <div className="mb-3 flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${group.accent}`}>
                {group.icon}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text">{group.title}</h2>
                <p className="text-xs text-text-muted">
                  {group.items.length} report{group.items.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex flex-col rounded-lg border border-border bg-surface p-4 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <FileText size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}