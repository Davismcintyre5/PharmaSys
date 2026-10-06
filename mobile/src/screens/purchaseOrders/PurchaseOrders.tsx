import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Button,
  Input,
  Badge,
  EmptyState,
  Spinner,
  Alert,
  ConfirmDialog,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { purchaseOrderApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { hasPermission } from '@/utils/permissions';
import { purchaseOrderStatusLabel } from '@/utils/enums';
import { formatMoney, formatRelativeTime } from '@/utils/format';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types';

type TabKey = 'all' | PurchaseOrderStatus;

type Danger =
  | { po: PurchaseOrder; kind: 'cancel' }
  | { po: PurchaseOrder; kind: 'hard-delete' }
  | null;

function statusVariant(
  status: PurchaseOrderStatus
): 'success' | 'warning' | 'info' | 'danger' | 'neutral' {
  switch (status) {
    case 'received':
      return 'success';
    case 'ordered':
      return 'info';
    case 'draft':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default function PurchaseOrders() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canView = hasPermission(user?.role, 'purchase_orders.view');
  const canCreate = hasPermission(user?.role, 'purchase_orders.create');
  const isOwner = user?.role === 'owner';

  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const [danger, setDanger] = useState<Danger>(null);

  const listQuery = useQuery({
    queryKey: queryKeys.purchaseOrders.list(),
    queryFn: () => purchaseOrderApi.list(),
    enabled: canView,
  });

  const items: PurchaseOrder[] = useMemo(() => {
    const raw = listQuery.data;
    if (Array.isArray(raw)) return raw;
    return (raw as any)?.items ?? [];
  }, [listQuery.data]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      draft: items.filter((p) => p.status === 'draft').length,
      ordered: items.filter((p) => p.status === 'ordered').length,
      received: items.filter((p) => p.status === 'received').length,
      cancelled: items.filter((p) => p.status === 'cancelled').length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (tab !== 'all') list = list.filter((p) => p.status === tab);

    const q = debounced.trim().toLowerCase();
    if (q) {
      list = list.filter((po) => {
        const supplier = po.supplierId as any;
        const name =
          (typeof supplier === 'object' ? supplier?.name : '')?.toLowerCase() ??
          '';
        return po.poNo.toLowerCase().includes(q) || name.includes(q);
      });
    }
    return list;
  }, [items, tab, debounced]);

  async function confirmDanger() {
    if (!danger) return;
    const { po, kind } = danger;
    try {
      if (kind === 'cancel') {
        await purchaseOrderApi.cancel(po._id);
        toast.success('Purchase order cancelled');
      } else {
        await purchaseOrderApi.hardRemove(po._id);
        toast.success('Purchase order permanently deleted');
      }
      setDanger(null);
      await queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  if (!canView) {
    return (
      <Screen>
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title="No access"
            description="You don't have permission to view purchase orders."
          />
        </View>
      </Screen>
    );
  }

  const tabs: { value: TabKey; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'draft', label: 'Draft', count: counts.draft },
    { value: 'ordered', label: 'Sent', count: counts.ordered },
    { value: 'received', label: 'Received', count: counts.received },
    { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  const renderItem = ({ item }: { item: PurchaseOrder }) => {
    const supplier = item.supplierId as any;
    const supplierName =
      typeof supplier === 'object' ? supplier?.name : null;
    const canCancel =
      item.status !== 'received' && item.status !== 'cancelled';
    const canDelete =
      isOwner && (item.status === 'draft' || item.status === 'cancelled');

    return (
      <Pressable
        onPress={() =>
          navigation.navigate('PurchaseOrderDetail', {
            purchaseOrderId: item._id,
          })
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
            <Text style={[styles.po, { color: theme.colors.primary }]}>
              {item.poNo}
            </Text>
            <Text
              style={[styles.supplier, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {supplierName ?? '—'}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              {item.items?.length ?? 0} line
              {item.items?.length === 1 ? '' : 's'} ·{' '}
              {formatRelativeTime(item.createdAt)}
            </Text>
          </View>

          <View style={styles.cardRight}>
            <Badge variant={statusVariant(item.status)}>
              {purchaseOrderStatusLabel(item.status)}
            </Badge>
            <Text style={[styles.total, { color: theme.colors.text }]}>
              {formatMoney(item.total, 'KES')}
            </Text>
          </View>
        </View>

        {(item.status === 'draft' ||
          item.status === 'ordered' ||
          canCancel ||
          canDelete) && (
          <View style={styles.cardActions}>
            {item.status === 'draft' && canCreate ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  navigation.navigate('PurchaseOrderDetail', {
                    purchaseOrderId: item._id,
                  });
                }}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="send-outline"
                  size={12}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.actionText, { color: theme.colors.primary }]}
                >
                  Review
                </Text>
              </Pressable>
            ) : null}

            {item.status === 'ordered' && canCreate ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  navigation.navigate('PurchaseOrderDetail', {
                    purchaseOrderId: item._id,
                  });
                }}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="download-outline"
                  size={12}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.actionText, { color: theme.colors.primary }]}
                >
                  Receive
                </Text>
              </Pressable>
            ) : null}

            {canCancel && canCreate ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  setDanger({ po: item, kind: 'cancel' });
                }}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={12}
                  color={theme.colors.danger}
                />
                <Text
                  style={[styles.actionText, { color: theme.colors.danger }]}
                >
                  Cancel
                </Text>
              </Pressable>
            ) : null}

            {canDelete ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  setDanger({ po: item, kind: 'hard-delete' });
                }}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={12}
                  color={theme.colors.danger}
                />
                <Text
                  style={[styles.actionText, { color: theme.colors.danger }]}
                >
                  Delete
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Purchase orders
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {counts.all} total · {counts.ordered} awaiting delivery
          </Text>
        </View>

        {canCreate ? (
          <Button
            title="New"
            size="sm"
            onPress={() => navigation.navigate('NewPurchaseOrder')}
            leftIcon={<Ionicons name="add" size={16} color="#ffffff" />}
          />
        ) : null}
      </View>

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
                {typeof t.count === 'number' ? ` (${t.count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search by PO number or supplier…"
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

      {listQuery.isLoading ? (
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      ) : !filtered.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <Ionicons
                name="document-text-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title={
              search || tab !== 'all'
                ? 'No matches'
                : 'No purchase orders yet'
            }
            description={
              search || tab !== 'all'
                ? 'Try a different filter or search term.'
                : 'Raise a purchase order to restock from a supplier.'
            }
            action={
              !search && tab === 'all' && canCreate ? (
                <Button
                  title="New order"
                  size="sm"
                  onPress={() => navigation.navigate('NewPurchaseOrder')}
                  leftIcon={<Ionicons name="add" size={14} color="#ffffff" />}
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

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'hard-delete'
            ? `Permanently delete ${danger.po.poNo}?`
            : `Cancel ${danger?.po.poNo ?? ''}?`
        }
        description={
          danger?.kind === 'hard-delete'
            ? 'This cannot be undone. Only draft or cancelled POs can be deleted.'
            : 'The PO is marked cancelled. No stock is affected.'
        }
        confirmLabel={
          danger?.kind === 'hard-delete' ? 'Delete permanently' : 'Cancel PO'
        }
        variant="danger"
      />
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
  card: { borderWidth: 1, borderRadius: 12, padding: 14 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardLeft: { flex: 1, minWidth: 0 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  po: { fontSize: 13, fontWeight: '600', fontFamily: 'Courier' },
  supplier: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  meta: { fontSize: 11, marginTop: 4 },
  total: { fontSize: 14, fontWeight: '700' },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.3)',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, fontWeight: '500' },
  bottomPad: { height: 24 },
});