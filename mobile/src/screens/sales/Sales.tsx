import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Input,
  Badge,
  EmptyState,
  Spinner,
} from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { saleApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { formatMoney, formatDateTime } from '@/utils/format';
import { saleStatusLabel } from '@/utils/enums';
import { getCustomerName, getCashierName } from '@/utils/saleHelpers';
import type { Sale, SaleStatus } from '@/types';

interface Props {
  route: { params?: { customerId?: string; patientId?: string } };
}

type TabKey = 'all' | SaleStatus;

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  card: 'Card',
  insurance: 'Insurance',
};

function statusVariant(
  status: SaleStatus
): 'success' | 'warning' | 'info' | 'danger' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'partially_refunded':
      return 'warning';
    case 'refunded':
      return 'info';
    case 'voided':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default function Sales({ route }: Props) {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const toast = useToast();

  const customerId = route.params?.customerId;
  const patientId = route.params?.patientId;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [tab, setTab] = useState<TabKey>('all');

  const salesQuery = useQuery({
    queryKey: queryKeys.sales.list({
      customerId,
      patientId,
    }),
    queryFn: () =>
      saleApi.list({
        ...(customerId ? { customerId } : {}),
        ...(patientId ? { patientId } : {}),
      }),
  });

  const sales: Sale[] = useMemo(
    () => (Array.isArray(salesQuery.data) ? salesQuery.data : []),
    [salesQuery.data]
  );

  const filtered = useMemo(() => {
    let list = sales;
    if (tab !== 'all') list = list.filter((s) => s.status === tab);

    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const inv = s.invoiceNo?.toLowerCase() ?? '';
        const customer = (getCustomerName(s) ?? '').toLowerCase();
        const cashier = (getCashierName(s) ?? '').toLowerCase();
        return inv.includes(q) || customer.includes(q) || cashier.includes(q);
      });
    }
    return list;
  }, [sales, tab, debouncedSearch]);

  const summary = useMemo(() => {
    const total = sales.reduce((s, x) => s + (x.grandTotal || 0), 0);
    return { total, count: sales.length };
  }, [sales]);

  const hasFilters = Boolean(customerId || patientId);

  const tabs: { value: TabKey; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'partially_refunded', label: 'Partial' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'voided', label: 'Voided' },
  ];

  const renderItem = ({ item }: { item: Sale }) => {
    const customerName = getCustomerName(item);
    const variant = statusVariant(item.status);

    return (
      <Pressable
        onPress={() =>
          navigation.navigate('SaleDetail', { saleId: item._id })
        }
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text style={[styles.invoice, { color: theme.colors.primary }]}>
              {item.invoiceNo}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              {formatDateTime(item.createdAt)}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                {customerName ?? 'Walk-in'}
              </Text>
              <Text style={[styles.metaDot, { color: theme.colors.textSubtle }]}>
                {' · '}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                {PAYMENT_LABELS[item.paymentMethod] ?? item.paymentMethod}
              </Text>
            </View>
          </View>

          <View style={styles.cardRight}>
            <Badge variant={variant}>{saleStatusLabel(item.status)}</Badge>
            <Text style={[styles.total, { color: theme.colors.text }]}>
              {formatMoney(item.grandTotal, 'KES')}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Sales
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {summary.count} sale{summary.count === 1 ? '' : 's'} ·{' '}
            {formatMoney(summary.total, 'KES')}
          </Text>
        </View>

        <Button
          title="New sale"
          size="sm"
          onPress={() =>
            navigation.navigate('PosTab')
          }
          leftIcon={
            <Ionicons name="receipt-outline" size={14} color="#ffffff" />
          }
        />
      </View>

      {hasFilters ? (
        <View
          style={[
            styles.filterBanner,
            {
              backgroundColor: theme.colors.primary + '10',
              borderColor: theme.colors.primary + '40',
            },
          ]}
        >
          <Ionicons
            name="funnel-outline"
            size={14}
            color={theme.colors.primary}
          />
          <Text style={[styles.filterText, { color: theme.colors.text }]}>
            Filtered by {customerId ? 'customer' : 'patient'}
          </Text>
          <Pressable
            onPress={() =>
              navigation.setParams({ customerId: undefined, patientId: undefined })
            }
            hitSlop={8}
          >
            <Ionicons
              name="close-circle"
              size={16}
              color={theme.colors.textSubtle}
            />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.tabsWrap}>
        {tabs.map((t) => {
          const active = tab === t.value;
          return (
            <Pressable
              key={t.value}
              onPress={() => setTab(t.value)}
              style={[
                styles.tab,
                {
                  backgroundColor: active
                    ? theme.colors.primary
                    : theme.colors.surface2,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: active ? '#ffffff' : theme.colors.textMuted,
                  },
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search invoice, customer, cashier…"
          leftIcon={
            <Ionicons
              name="search"
              size={14}
              color={theme.colors.textSubtle}
            />
          }
          rightIcon={
            search ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={14}
                  color={theme.colors.textSubtle}
                />
              </Pressable>
            ) : undefined
          }
        />
      </View>

      {salesQuery.isLoading ? (
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      ) : !filtered.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <Ionicons
                name="receipt-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title={
              search || tab !== 'all' || hasFilters
                ? 'No matches'
                : 'No sales yet'
            }
            description={
              search || tab !== 'all' || hasFilters
                ? 'Try a different filter or clear them.'
                : 'Sales from POS will appear here.'
            }
            action={
              !search && tab === 'all' && !hasFilters ? (
                <Button
                  title="Open POS"
                  size="sm"
                  onPress={() => navigation.navigate('PosTab')}
                  leftIcon={
                    <Ionicons
                      name="receipt-outline"
                      size={14}
                      color="#ffffff"
                    />
                  }
                />
              ) : undefined
            }
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.bottomPad} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  filterText: { flex: 1, fontSize: 12 },
  tabsWrap: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabText: { fontSize: 12, fontWeight: '500' },
  searchWrap: { marginBottom: 16 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  list: { gap: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardLeft: { flex: 1, minWidth: 0 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  invoice: { fontSize: 13, fontWeight: '600', fontFamily: 'Courier' },
  meta: { fontSize: 12, marginTop: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  metaDot: { fontSize: 12 },
  total: { fontSize: 14, fontWeight: '700' },
  bottomPad: { height: 24 },
});