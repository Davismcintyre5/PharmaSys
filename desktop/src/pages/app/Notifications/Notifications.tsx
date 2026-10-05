import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CircleAlert,
  Info,
  MoreVertical,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { notificationApi } from '@/api/notification';
import { useSocket } from '@/context/SocketProvider';
import { useToast } from '@/hooks/useToast';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/components/ui/_cn';
import type { AppNotification, NotificationType } from '@/types';

const PAGE_SIZE = 25;

type TabKey = 'all' | 'unread' | NotificationType;

const ICONS: Record<string, React.ReactNode> = {
  info: <Info size={16} className="text-info" />,
  success: <Check size={16} className="text-success" />,
  warning: <AlertTriangle size={16} className="text-warning" />,
  error: <CircleAlert size={16} className="text-danger" />,
  sale: <ShoppingBag size={16} className="text-success" />,
  inventory: <AlertTriangle size={16} className="text-warning" />,
  prescription: <Bell size={16} className="text-info" />,
  subscription: <Info size={16} className="text-accent" />,
  system: <Info size={16} className="text-text-muted" />,
};

export default function Notifications() {
  const toast = useToast();
  const { setNotifications: setSocketNotifications, markAllRead: socketMarkAllRead } = useSocket();

  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('all');
  const [page, setPage] = useState(1);
  const [clearing, setClearing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    const params: Record<string, unknown> = {};
    if (tab === 'unread') params.unread = true;
    const list = await notificationApi.list(params).catch(() => []);
    const arr = Array.isArray(list) ? list : ((list as any).items ?? []);
    setItems(arr);
    // Keep the socket provider's cache in sync so the header badge updates
    setSocketNotifications(arr);
    if (showSpinner) setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  /* ─── actions ─── */

  async function markRead(n: AppNotification) {
    if (n.readAt) return;
    setBusyId(n._id);
    try {
      await notificationApi.markRead(n._id);
      setItems((prev) =>
        prev
          ? prev.map((x) =>
              x._id === n._id ? { ...x, readAt: new Date().toISOString() } : x
            )
          : prev
      );
    } catch (e: any) {
      toast.error(e?.message || 'Failed to mark read');
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    try {
      await notificationApi.markAllRead();
      const now = new Date().toISOString();
      setItems((prev) =>
        prev ? prev.map((x) => (x.readAt ? x : { ...x, readAt: now })) : prev
      );
      socketMarkAllRead();
      toast.success('All notifications marked read');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to mark all read');
    }
  }

  async function removeOne(n: AppNotification) {
    setBusyId(n._id);
    try {
      await notificationApi.remove(n._id);
      setItems((prev) => (prev ? prev.filter((x) => x._id !== n._id) : prev));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  }

  async function clearRead() {
    try {
      await notificationApi.clear();
      setItems((prev) => (prev ? prev.filter((x) => !x.readAt) : prev));
      toast.success('Cleared read notifications');
      setClearing(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to clear');
    }
  }

  /* ─── derived ─── */

  const counts = useMemo(() => {
    const list = items ?? [];
    return {
      all: list.length,
      unread: list.filter((n) => !n.readAt).length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (tab === 'all' || tab === 'unread') return items;
    return items.filter((n) => n.type === tab);
  }, [items, tab]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle={`${counts.all} total · ${counts.unread} unread`}
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        actions={
          <div className="flex items-center gap-2">
            {counts.unread > 0 && (
              <Button
                variant="outline"
                leftIcon={<CheckCheck size={14} />}
                onClick={markAllRead}
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              leftIcon={<Trash2 size={14} />}
              onClick={() => setClearing(true)}
              disabled={counts.all === 0}
            >
              Clear read
            </Button>
          </div>
        }
      />

      <div className="mb-4 overflow-x-auto">
        <Tabs
          items={[
            { value: 'all', label: `All (${counts.all})` },
            { value: 'unread', label: `Unread (${counts.unread})` },
            { value: 'sale', label: 'Sales' },
            { value: 'inventory', label: 'Inventory' },
            { value: 'prescription', label: 'Prescriptions' },
            { value: 'subscription', label: 'Subscription' },
            { value: 'system', label: 'System' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !filtered.length ? (
        <Card>
          <EmptyState
            icon={<Bell size={22} />}
            title={
              tab === 'unread'
                ? 'All caught up'
                : tab === 'all'
                  ? 'No notifications yet'
                  : 'Nothing in this category'
            }
            description={
              tab === 'unread'
                ? "You've read everything."
                : 'Notifications from sales, inventory, and your account appear here.'
            }
          />
        </Card>
      ) : (
        <>
          <Card plain className="overflow-hidden">
            <div className="divide-y divide-border">
              {paged.map((n) => {
                const icon = ICONS[n.type] || ICONS.info;
                const unread = !n.readAt;
                const isBusy = busyId === n._id;

                const inner = (
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        unread ? 'bg-primary/10' : 'bg-surface-2'
                      )}
                    >
                      {icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'truncate text-sm',
                            unread
                              ? 'font-semibold text-text'
                              : 'font-medium text-text-muted'
                          )}
                        >
                          {n.title}
                        </p>
                        {unread && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>

                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                          {n.body}
                        </p>
                      )}

                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-[10px] text-text-subtle">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                        <Badge variant="neutral" className="!px-1.5 !py-0 text-[9px]">
                          {n.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );

                return (
                  <div
                    key={n._id}
                    className={cn(
                      'group relative px-4 py-3 transition-colors',
                      unread && 'bg-primary/5',
                      'hover:bg-surface-2/50'
                    )}
                  >
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => markRead(n)}
                        className="block"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markRead(n)}
                        className="block w-full text-left"
                      >
                        {inner}
                      </button>
                    )}

                    {/* Actions — visible on hover */}
                    <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <Dropdown
                        align="right"
                        trigger={
                          <IconButton
                            aria-label="Actions"
                            size="sm"
                            disabled={isBusy}
                          >
                            <MoreVertical size={14} />
                          </IconButton>
                        }
                      >
                        {unread && (
                          <DropdownItem onClick={() => markRead(n)}>
                            <span className="flex items-center gap-2">
                              <Check size={14} /> Mark read
                            </span>
                          </DropdownItem>
                        )}
                        {unread && <DropdownSeparator />}
                        <DropdownItem danger onClick={() => removeOne(n)}>
                          <span className="flex items-center gap-2">
                            <Trash2 size={14} /> Delete
                          </span>
                        </DropdownItem>
                      </Dropdown>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {pages > 1 && (
            <Pagination
              page={page}
              pages={pages}
              total={filtered.length}
              onChange={setPage}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={clearing}
        onClose={() => setClearing(false)}
        onConfirm={clearRead}
        title="Clear read notifications?"
        description={
          <>
            This removes all <strong>read</strong> notifications. Unread
            notifications stay.
          </>
        }
        confirmLabel="Clear read"
        variant="danger"
      />
    </div>
  );
}