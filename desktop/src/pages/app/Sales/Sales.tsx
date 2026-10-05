import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Receipt, RefreshCw, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { saleApi } from '@/api/sale';
import { useToast } from '@/hooks/useToast';
import { useBranch } from '@/context/BranchProvider';
import { formatMoney, formatDateTime } from '@/utils/format';
import { saleStatusLabel } from '@/utils/enums';
import { saleStatusColor } from '@/utils/colors';
import { getCustomerName, getCashierName } from '@/utils/saleHelpers';
import type { Sale, SaleStatus } from '@/types';

const PAGE_SIZE = 20;

type TabKey = 'all' | SaleStatus;

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  card: 'Card',
  insurance: 'Insurance',
};

export default function Sales() {
  const toast = useToast();
  const navigate = useNavigate();
  const { currentBranch } = useBranch();

  const [sales, setSales] = useState<Sale[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('all');
  const [method, setMethod] = useState<string>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);

    const params: Record<string, unknown> = {};
    if (tab !== 'all') params.status = tab;
    if (method) params.method = method;
    if (from) params.from = from;
    if (to) params.to = to;

    const res = await saleApi.list(params).catch(() => null);
    setSales(Array.isArray(res) ? res : ((res as any)?.items ?? []));
    if (showSpinner) setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, method, from, to]);

  useEffect(() => {
    setPage(1);
  }, [tab, method, from, to, search]);

  async function refresh() {
    setRefreshing(true);
    try {
      await load(false);
      toast.success('Sales refreshed');
    } finally {
      setRefreshing(false);
    }
  }

  function clearFilters() {
    setSearch('');
    setTab('all');
    setMethod('');
    setFrom('');
    setTo('');
  }

  const filtered = useMemo(() => {
    if (!sales) return [];
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) => {
      const inv = s.invoiceNo?.toLowerCase() || '';
      const customer = (getCustomerName(s) || '').toLowerCase();
      const cashier = (getCashierName(s) || '').toLowerCase();
      return inv.includes(q) || customer.includes(q) || cashier.includes(q);
    });
  }, [sales, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const summary = useMemo(() => {
    const list = sales ?? [];
    const total = list.reduce((s, x) => s + (x.grandTotal || 0), 0);
    const count = list.length;
    return { total, count };
  }, [sales]);

  const hasFilters = !!(search || tab !== 'all' || method || from || to);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Sales"
        subtitle={
          currentBranch
            ? `${currentBranch.name} · ${summary.count} sale${summary.count === 1 ? '' : 's'} · ${formatMoney(summary.total, 'KES')}`
            : `${summary.count} sale${summary.count === 1 ? '' : 's'} · ${formatMoney(summary.total, 'KES')}`
        }
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<RefreshCw size={14} />}
              loading={refreshing}
              onClick={refresh}
            >
              Refresh
            </Button>
            <Link to="/app/pos">
              <Button leftIcon={<Receipt size={14} />}>New sale</Button>
            </Link>
          </div>
        }
      />

      <div className="mb-4 overflow-x-auto">
        <Tabs
          items={[
            { value: 'all', label: 'All' },
            { value: 'completed', label: 'Completed' },
            { value: 'partially_refunded', label: 'Partial' },
            { value: 'refunded', label: 'Refunded' },
            { value: 'voided', label: 'Voided' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
        />
      </div>

      <Card className="mb-4" plain>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_160px_160px_auto]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={14} />}
            placeholder="Search invoice, customer, cashier…"
          />
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={[
              { value: '', label: 'All methods' },
              { value: 'cash', label: 'Cash' },
              { value: 'mpesa', label: 'M-Pesa' },
              { value: 'card', label: 'Card' },
              { value: 'insurance', label: 'Insurance' },
            ]}
          />
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="From"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To"
          />
          {hasFilters && (
            <Button
              variant="ghost"
              leftIcon={<X size={14} />}
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !filtered.length ? (
        <Card>
          <EmptyState
            icon={<Receipt size={22} />}
            title={hasFilters ? 'No matches' : 'No sales yet'}
            description={
              hasFilters
                ? 'Try a different filter or clear them.'
                : 'Sales from POS will appear here.'
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Link to="/app/pos">
                  <Button leftIcon={<Receipt size={14} />}>Open POS</Button>
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <>
          <Card plain className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>Invoice</TH>
                  <TH>Date</TH>
                  <TH>Customer</TH>
                  <TH>Payment</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Total</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paged.map((sale) => {
                  const statusKey = saleStatusColor(sale.status);
                  const variant =
                    statusKey === 'success'
                      ? 'success'
                      : statusKey === 'warning'
                        ? 'warning'
                        : statusKey === 'info'
                          ? 'info'
                          : statusKey === 'danger'
                            ? 'danger'
                            : 'neutral';
                  const customerName = getCustomerName(sale);

                  return (
                    <TR
                      key={sale._id}
                      onClick={() => navigate(`/app/sales/${sale._id}`)}
                      className="cursor-pointer"
                    >
                      <TD>
                        <span className="font-mono text-xs text-primary">
                          {sale.invoiceNo}
                        </span>
                      </TD>
                      <TD>
                        <span className="text-xs text-text-muted">
                          {formatDateTime(sale.createdAt)}
                        </span>
                      </TD>
                      <TD>
                        <span className="text-xs text-text-muted">
                          {customerName || 'Walk-in'}
                        </span>
                      </TD>
                      <TD>
                        <span className="text-xs text-text-muted">
                          {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                        </span>
                      </TD>
                      <TD>
                        <Badge variant={variant}>
                          {saleStatusLabel(sale.status)}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <span className="text-sm font-semibold text-text">
                          {formatMoney(sale.grandTotal, 'KES')}
                        </span>
                      </TD>
                      <TD
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          to={`/app/sales/${sale._id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Eye size={12} /> View
                        </Link>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
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
    </div>
  );
}