import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Clock,
  Package,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Stethoscope,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { dashboardApi } from '@/api/dashboard';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { hasPermission } from '@/utils/permissions';
import { formatMoney, formatRelativeTime } from '@/utils/format';
import type { DashboardSummary, AiInsight } from '@/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const toast = useToast();
  const { user, tenant, plan } = useAuth();

  const canUseAi = hasPermission(user?.role, 'ai.use');
  const planHasAi = plan?.features?.aiInsights === true;
  const aiEnabled = canUseAi && planHasAi;

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadSummary() {
    const s = await dashboardApi.getSummary().catch(() => null);
    setSummary(s);
    return s;
  }

  async function loadInsights() {
    const ai = await dashboardApi.getInsights().catch(() => null);
    setInsight(ai);
    return ai;
  }

  useEffect(() => {
    const tasks: Promise<unknown>[] = [loadSummary()];
    if (canUseAi) tasks.push(loadInsights());
    Promise.all(tasks).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseAi]);

  async function refresh() {
    setRefreshing(true);
    try {
      const tasks: Promise<unknown>[] = [loadSummary()];
      if (canUseAi) tasks.push(loadInsights());
      await Promise.all(tasks);
      toast.success('Dashboard refreshed');
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const currency = summary?.currency || 'KES';
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const insightText = insight?.payload?.text || null;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle={
          tenant?.name
            ? `Here's what's happening at ${tenant.name} today`
            : "Here's what's happening today"
        }
        actions={
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={14} />}
            loading={refreshing}
            onClick={refresh}
          >
            Refresh
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Receipt size={18} />}
          label="Sales today"
          value={summary ? formatMoney(summary.salesToday, currency) : '—'}
          sub={
            summary
              ? `${summary.salesTodayCount} transaction${
                  summary.salesTodayCount === 1 ? '' : 's'
                }`
              : ''
          }
          tint="primary"
        />
        <KpiCard
          icon={<Package size={18} />}
          label="Low stock"
          value={summary ? String(summary.lowStockCount) : '—'}
          sub={summary?.lowStockCount ? 'Items need restocking' : 'All good'}
          tint={summary?.lowStockCount ? 'warning' : 'success'}
          href="/app/inventory/low-stock"
        />
        <KpiCard
          icon={<Clock size={18} />}
          label="Expiring soon"
          value={summary ? String(summary.expiringSoonCount) : '—'}
          sub="Next 30 days"
          tint={summary?.expiringSoonCount ? 'danger' : 'success'}
          href="/app/inventory/expiring"
        />
        <KpiCard
          icon={<Stethoscope size={18} />}
          label="New patients"
          value={summary ? String(summary.newPatientsToday) : '—'}
          sub="Registered today"
          tint="info"
          href="/app/patients"
        />
      </div>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-text">Quick actions</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            to="/app/pos"
            icon={<ShoppingCart size={16} />}
            label="New sale"
            description="Ring up a customer"
          />
          <QuickAction
            to="/app/inventory"
            icon={<Package size={16} />}
            label="Inventory"
            description="Browse drugs & stock"
          />
          <QuickAction
            to="/app/patients"
            icon={<Users size={16} />}
            label="Patients"
            description="Records & history"
          />
          {aiEnabled && (
            <QuickAction
              to="/app/ai"
              icon={<Bot size={16} />}
              label="AI assistant"
              description="Ask anything"
            />
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Recent sales</h2>
              <Link
                to="/app/sales"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {!summary?.recentSales?.length ? (
              <EmptyState
                icon={<Receipt size={20} />}
                title="No sales yet"
                description="Once you ring up your first sale, it'll show up here."
                action={
                  <Link to="/app/pos">
                    <Button size="sm" leftIcon={<ShoppingCart size={14} />}>
                      Open POS
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {summary.recentSales.map((sale) => (
                  <Link
                    key={sale._id}
                    to={`/app/sales/${sale._id}`}
                    className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-surface-2/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs text-text">
                        {sale.invoiceNo}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-muted">
                        {sale.items?.length || 0} item
                        {sale.items?.length === 1 ? '' : 's'}
                        {' · '}
                        {formatRelativeTime(sale.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant={
                          sale.status === 'completed' ? 'success' : 'warning'
                        }
                      >
                        {sale.status === 'completed' ? 'Paid' : sale.status}
                      </Badge>
                      <span className="text-sm font-semibold text-text">
                        {formatMoney(sale.grandTotal, currency)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot size={16} />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-text">AI insight</h2>
                {insight?.generatedAt && (
                  <p className="text-[10px] text-text-subtle">
                    {formatRelativeTime(insight.generatedAt)}
                  </p>
                )}
              </div>
            </div>

            <AiInsightBody
              canUseAi={canUseAi}
              planHasAi={planHasAi}
              insightText={insightText}
              insight={insight}
            />
          </Card>

          {summary && (summary.lowStockCount > 0 || summary.expiringSoonCount > 0) && (
            <Card className="mt-4">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-warning" />
                <h2 className="text-sm font-semibold text-text">
                  Needs attention
                </h2>
              </div>
              <div className="space-y-2">
                {summary.lowStockCount > 0 && (
                  <Link
                    to="/app/inventory/low-stock"
                    className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs transition-colors hover:bg-warning/10"
                  >
                    <span className="text-text">
                      <strong>{summary.lowStockCount}</strong> item
                      {summary.lowStockCount === 1 ? '' : 's'} low on stock
                    </span>
                    <ArrowRight size={12} className="text-warning" />
                  </Link>
                )}
                {summary.expiringSoonCount > 0 && (
                  <Link
                    to="/app/inventory/expiring"
                    className="flex items-center justify-between rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-xs transition-colors hover:bg-danger/10"
                  >
                    <span className="text-text">
                      <strong>{summary.expiringSoonCount}</strong> batch
                      {summary.expiringSoonCount === 1 ? '' : 'es'} expiring
                    </span>
                    <ArrowRight size={12} className="text-danger" />
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AiInsightBody({
  canUseAi,
  planHasAi,
  insightText,
  insight,
}: {
  canUseAi: boolean;
  planHasAi: boolean;
  insightText: string | null;
  insight: AiInsight | null;
}) {
  if (!canUseAi) {
    return (
      <Alert variant="info">
        <div className="text-xs">
          AI insights are only available to owners and managers. Ask your
          manager or owner to generate them.
        </div>
      </Alert>
    );
  }

  if (!planHasAi) {
    return (
      <Alert variant="info">
        <div className="text-xs">
          AI insights aren't available on your plan.{' '}
          <Link to="/app/billing" className="text-primary underline">
            Upgrade
          </Link>{' '}
          to enable.
        </div>
      </Alert>
    );
  }

  if (!insightText) {
    return (
      <EmptyState
        icon={<Bot size={20} />}
        title="No insights yet"
        description="Generate your first AI insight to see weekly performance."
        action={
          <Link to="/app/ai/insights">
            <Button size="sm" leftIcon={<Bot size={14} />}>
              Generate
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="whitespace-pre-wrap text-xs leading-relaxed text-text-muted">
        {insightText.length > 420
          ? `${insightText.slice(0, 420)}…`
          : insightText}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Link
          to="/app/ai/insights"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Full insights <ArrowRight size={12} />
        </Link>
        {insight?.model && (
          <span className="text-[10px] text-text-subtle">{insight.model}</span>
        )}
      </div>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tint,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tint: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  href?: string;
}) {
  const TINTS: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    info: 'bg-info/10 text-info',
  };

  const inner = (
    <Card className="h-full transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TINTS[tint]}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-muted">{label}</p>
          <p className="mt-0.5 text-xl font-bold text-text">{value}</p>
          {sub && (
            <p className="mt-0.5 truncate text-[11px] text-text-subtle">{sub}</p>
          )}
        </div>
      </div>
    </Card>
  );

  return href ? <Link to={href}>{inner}</Link> : inner;
}

function QuickAction({
  to,
  icon,
  label,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-lg border border-border bg-bg p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-2 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="truncate text-[11px] text-text-muted">{description}</p>
      </div>
    </Link>
  );
}