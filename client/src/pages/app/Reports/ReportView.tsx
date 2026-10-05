import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { useAuth } from '@/context/AuthProvider';
import { useSite } from '@/context/SiteProvider';
import { useBranch } from '@/context/BranchProvider';
import { useToast } from '@/hooks/useToast';
import { printReport } from '@/utils/reportHtml';
import { REPORTS, type ReportFilters } from './_reportDefs';

const DAY_OPTIONS = [7, 14, 30, 60, 90, 180, 365];

export default function ReportView() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const toast = useToast();
  const { tenant } = useAuth();
  const { brand } = useSite();
  const { branches, currentBranch } = useBranch();

  const key = `${category}/${slug}`;
  const def = REPORTS[key];

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const [filters, setFilters] = useState<ReportFilters>({
    date: today,
    from: monthAgo,
    to: today,
    days: 30,
    limit: 100,
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showSpinner = true) {
    if (!def) return;
    if (showSpinner) setLoading(true);
    try {
      const result = await def.fetcher(filters);
      setData(result);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load report');
      setData(null);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, filters.date, filters.from, filters.to, filters.days]);

  async function refresh() {
    setRefreshing(true);
    try {
      await load(false);
      toast.success('Report refreshed');
    } finally {
      setRefreshing(false);
    }
  }

  function handlePrint() {
    if (!def || !data) return;
    const kpis = def.buildKpis?.(data, filters) || [];
    const columns = def.buildColumns(data);
    const rows = def.buildRows(data);
    const totals = def.buildTotals?.(data);

    printReport({
      title: def.title,
      subtitle: def.description,
      businessName: tenant?.name || 'Pharmacy',
      branchName: branches.length > 1 ? currentBranch?.name : null,
      logoUrl: brand?.logoUrl,
      kpis,
      columns,
      rows,
      totals,
      orientation: def.orientation ?? 'landscape',
      filtersSummary: def.filtersSummary?.(filters),
      footer: `${tenant?.name || 'Pharmacy'} — ${def.title}`,
    });
  }

  if (!def) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Report not found"
          breadcrumb={
            <Link to="/app/reports" className="inline-flex items-center gap-1">
              <ArrowLeft size={12} /> Reports
            </Link>
          }
        />
        <Alert variant="danger">
          No report matches <code>{key}</code>.
        </Alert>
      </div>
    );
  }

  const kpis = data ? def.buildKpis?.(data, filters) || [] : [];
  const columns = data ? def.buildColumns(data) : [];
  const rows = data ? def.buildRows(data) : [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={def.title}
        subtitle={def.description}
        breadcrumb={
          <Link to="/app/reports" className="inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Reports
          </Link>
        }
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
            <Button
              leftIcon={<Printer size={14} />}
              disabled={!data}
              onClick={handlePrint}
            >
              Print
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-4" plain>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {def.filterType === 'date' && (
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">Date</label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
          )}

          {def.filterType === 'date-range' && (
            <>
              <div>
                <label className="mb-1 block text-[11px] text-text-muted">From</label>
                <Input
                  type="date"
                  value={filters.from}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, from: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-text-muted">To</label>
                <Input
                  type="date"
                  value={filters.to}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, to: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          {def.filterType === 'days' && (
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">Window</label>
              <Select
                value={String(filters.days ?? 30)}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, days: Number(e.target.value) }))
                }
                options={DAY_OPTIONS.map((d) => ({
                  value: String(d),
                  label: `Next ${d} days`,
                }))}
              />
            </div>
          )}

          {branches.length > 1 && (
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">Branch</label>
              <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text-muted">
                {currentBranch?.name || 'All branches'}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Preview */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !data ? (
        <Card>
          <EmptyState
            icon={<Printer size={22} />}
            title="No data"
            description="Adjust the filters or try refreshing."
          />
        </Card>
      ) : (
        <>
          {/* KPIs */}
          {kpis.length > 0 && (
            <div
              className={`mb-4 grid gap-3 sm:grid-cols-2 ${
                kpis.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
              }`}
            >
              {kpis.map((k, i) => (
                <Card key={i}>
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">
                    {k.label}
                  </p>
                  <p className="mt-1 text-xl font-bold text-text">{k.value}</p>
                  {k.hint && (
                    <p className="mt-0.5 text-[10px] text-text-subtle">{k.hint}</p>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Table preview */}
          <Card plain className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  {columns.map((c, i) => (
                    <TH
                      key={i}
                      className={
                        c.align === 'right'
                          ? 'text-right'
                          : c.align === 'center'
                            ? 'text-center'
                            : ''
                      }
                    >
                      {c.label}
                    </TH>
                  ))}
                </TR>
              </THead>
              <TBody>
                {rows.length === 0 ? (
                  <TR>
                    <TD>
                      <span className="text-xs text-text-muted">No rows</span>
                    </TD>
                  </TR>
                ) : (
                  rows.slice(0, 100).map((row: any, rIdx: number) => (
                    <TR key={rIdx}>
                      {columns.map((c, cIdx) => {
                        const raw =
                          typeof c.accessor === 'function'
                            ? c.accessor(row, rIdx)
                            : row[c.accessor];
                        const display = c.format
                          ? c.format(raw, row)
                          : String(raw ?? '—');
                        return (
                          <TD
                            key={cIdx}
                            className={
                              c.align === 'right'
                                ? 'text-right'
                                : c.align === 'center'
                                  ? 'text-center'
                                  : ''
                            }
                          >
                            <span className="text-xs text-text-muted">
                              {display}
                            </span>
                          </TD>
                        );
                      })}
                    </TR>
                  ))
                )}
              </TBody>
            </Table>

            {rows.length > 100 && (
              <div className="border-t border-border px-4 py-2 text-xs text-text-muted">
                Showing first 100 rows of {rows.length}. Print includes all rows.
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}