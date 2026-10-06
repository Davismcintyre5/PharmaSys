import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

import {
  Screen,
  Card,
  Button,
  Input,
  Select,
  Alert,
  Spinner,
  EmptyState,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useSite } from '@/context/SiteProvider';
import { useBranch } from '@/context/BranchProvider';
import { useToast } from '@/hooks/useToast';
import { printReport } from '@/utils/reportHtml';
import { REPORTS, type ReportFilters } from './_reportDefs';
import type { ReportColumn } from '@/utils/reportHtml';

const DAY_OPTIONS = [7, 14, 30, 60, 90, 180, 365];

interface Props {
  route: { params: { category: string; slug: string } };
}

export default function ReportView({ route }: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const { tenant } = useAuth();
  const { brand } = useSite();
  const { branches, currentBranch } = useBranch();

  const key = `${route.params.category}/${route.params.slug}`;
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

  async function handlePrint() {
    if (!def || !data) return;
    const kpis = def.buildKpis?.(data, filters) || [];
    const columns = def.buildColumns(data);
    const rows = def.buildRows(data);
    const totals = def.buildTotals?.(data);

    try {
      await printReport({
        title: def.title,
        subtitle: def.description,
        businessName: tenant?.name || brand?.name || 'Pharmacy',
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
    } catch (e: any) {
      toast.error(e?.message || 'Could not generate PDF');
    }
  }

  const kpis = useMemo(
    () => (data ? def?.buildKpis?.(data, filters) || [] : []),
    [data, def, filters]
  );
  const columns: ReportColumn<any>[] = useMemo(
    () => (data ? def?.buildColumns(data) || [] : []),
    [data, def]
  );
  const rows: any[] = useMemo(
    () => (data ? def?.buildRows(data) || [] : []),
    [data, def]
  );

  if (!def) {
    return (
      <Screen>
        <Alert variant="danger">
          Report not found: <Text style={{ fontWeight: '700' }}>{key}</Text>
        </Alert>
      </Screen>
    );
  }

  return (
    <Screen scroll onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {def.title}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {def.description}
        </Text>

        <View style={styles.headerActions}>
          <Button
            title="Refresh"
            size="sm"
            variant="outline"
            onPress={refresh}
            loading={refreshing}
            leftIcon={
              <Ionicons
                name="refresh"
                size={14}
                color={theme.colors.text}
              />
            }
          />
          <Button
            title="Print"
            size="sm"
            onPress={handlePrint}
            disabled={!data}
            leftIcon={
              <Ionicons name="print-outline" size={14} color="#ffffff" />
            }
          />
        </View>
      </View>

      {def.filterType !== 'none' && (
        <Card style={styles.filterCard}>
          <View style={styles.filterRow}>
            {def.filterType === 'date' && (
              <View style={styles.filterField}>
                <Text
                  style={[styles.filterLabel, { color: theme.colors.textMuted }]}
                >
                  Date
                </Text>
                <Input
                  value={filters.date ?? today}
                  onChangeText={(v) =>
                    setFilters((f) => ({ ...f, date: v }))
                  }
                  placeholder="YYYY-MM-DD"
                />
              </View>
            )}

            {def.filterType === 'date-range' && (
              <>
                <View style={styles.filterField}>
                  <Text
                    style={[
                      styles.filterLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    From
                  </Text>
                  <Input
                    value={filters.from ?? monthAgo}
                    onChangeText={(v) =>
                      setFilters((f) => ({ ...f, from: v }))
                    }
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={styles.filterField}>
                  <Text
                    style={[
                      styles.filterLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    To
                  </Text>
                  <Input
                    value={filters.to ?? today}
                    onChangeText={(v) => setFilters((f) => ({ ...f, to: v }))}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </>
            )}

            {def.filterType === 'days' && (
              <View style={styles.filterField}>
                <Text
                  style={[
                    styles.filterLabel,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  Window
                </Text>
                <Select
                  value={String(filters.days ?? 30)}
                  options={DAY_OPTIONS.map((d) => ({
                    value: String(d),
                    label: `Next ${d} days`,
                  }))}
                  onChange={(v) =>
                    setFilters((f) => ({ ...f, days: Number(v) }))
                  }
                />
              </View>
            )}
          </View>
        </Card>
      )}

      {loading ? (
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      ) : !data ? (
        <Card>
          <EmptyState
            icon={
              <Ionicons
                name="document-text-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title="No data"
            description="Adjust the filters or refresh."
          />
        </Card>
      ) : (
        <>
          {kpis.length > 0 && (
            <View style={styles.kpiGrid}>
              {kpis.map((k, i) => (
                <View
                  key={i}
                  style={[
                    styles.kpiCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.kpiLabel, { color: theme.colors.textMuted }]}
                  >
                    {k.label}
                  </Text>
                  <Text
                    style={[styles.kpiValue, { color: theme.colors.text }]}
                  >
                    {k.value}
                  </Text>
                  {k.hint ? (
                    <Text
                      style={[
                        styles.kpiHint,
                        { color: theme.colors.textSubtle },
                      ]}
                    >
                      {k.hint}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          <Card style={styles.tableCard}>
            <View style={styles.tableHead}>
              {columns.map((c, i) => (
                <Text
                  key={i}
                  style={[
                    styles.tableHeadCell,
                    {
                      color: theme.colors.textMuted,
                      textAlign:
                        c.align === 'right'
                          ? 'right'
                          : c.align === 'center'
                          ? 'center'
                          : 'left',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {c.label}
                </Text>
              ))}
            </View>

            {!rows.length ? (
              <View style={styles.emptyRow}>
                <Text
                  style={[styles.emptyText, { color: theme.colors.textMuted }]}
                >
                  No rows
                </Text>
              </View>
            ) : (
              rows.slice(0, 100).map((row: any, rIdx: number) => (
                <View
                  key={rIdx}
                  style={[
                    styles.tableRow,
                    {
                      borderBottomColor: theme.colors.border,
                      backgroundColor:
                        rIdx % 2 === 0
                          ? 'transparent'
                          : theme.colors.surface2 + '40',
                    },
                  ]}
                >
                  {columns.map((c, cIdx) => {
                    const raw =
                      typeof c.accessor === 'function'
                        ? c.accessor(row, rIdx)
                        : row[c.accessor];
                    const display = c.format
                      ? c.format(raw, row, rIdx)
                      : String(raw ?? '—');
                    return (
                      <Text
                        key={cIdx}
                        style={[
                          styles.tableCell,
                          {
                            color: theme.colors.text,
                            textAlign:
                              c.align === 'right'
                                ? 'right'
                                : c.align === 'center'
                                ? 'center'
                                : 'left',
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {display}
                      </Text>
                    );
                  })}
                </View>
              ))
            )}

            {rows.length > 100 ? (
              <View
                style={[
                  styles.moreRow,
                  { borderTopColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[styles.moreText, { color: theme.colors.textMuted }]}
                >
                  Showing first 100 of {rows.length}. Print includes all rows.
                </Text>
              </View>
            ) : null}
          </Card>
        </>
      )}

      <View style={styles.bottomPad} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 48, alignItems: 'center' },
  header: { marginTop: 16, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  filterCard: { marginBottom: 16 },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  filterField: { flex: 1, minWidth: 140 },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: '45%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kpiValue: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  kpiHint: { fontSize: 10, marginTop: 3 },
  tableCard: { marginBottom: 16, padding: 0, overflow: 'hidden' },
  tableHead: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableHeadCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  tableCell: { flex: 1, fontSize: 12 },
  emptyRow: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  moreRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  moreText: { fontSize: 11 },
  bottomPad: { height: 24 },
});