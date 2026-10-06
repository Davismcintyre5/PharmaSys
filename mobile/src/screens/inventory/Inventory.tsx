import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import {
  Screen,
  Button,
  Input,
  Select,
  Badge,
  EmptyState,
  Spinner,
  ConfirmDialog,
} from '@/components/ui';
import { StockBadge } from '@/components/app/StockBadge';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { inventoryApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { hasPermission } from '@/utils/permissions';
import { DRUG_CATEGORIES, DRUG_FORM_LABELS } from '@/utils/constants';
import type { Drug } from '@/types';

type Danger =
  | { drug: Drug; kind: 'deactivate' }
  | { drug: Drug; kind: 'hard-delete' }
  | null;

export default function Inventory() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const toast = useToast();
  const { user } = useAuth();

  const canCreate = hasPermission(user?.role, 'drugs.create');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [danger, setDanger] = useState<Danger>(null);

  const debouncedSearch = useDebounce(search, 300);

  const drugsQuery = useQuery({
    queryKey: queryKeys.inventory.drugs({
      search: debouncedSearch,
      category,
    }),
    queryFn: () =>
      inventoryApi.drugs.list({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(category ? { category } : {}),
      }),
  });

  const lowStockQuery = useQuery({
    queryKey: queryKeys.inventory.lowStock,
    queryFn: () => inventoryApi.drugs.lowStock(),
  });

  const expiringQuery = useQuery({
    queryKey: queryKeys.inventory.expiring(30),
    queryFn: () => inventoryApi.drugs.expiring({ days: 30 }),
  });

  const drugs: Drug[] = useMemo(() => {
    const raw = drugsQuery.data;
    if (Array.isArray(raw)) return raw;
    return (raw as any)?.items ?? [];
  }, [drugsQuery.data]);

  const lowCount = Array.isArray(lowStockQuery.data)
    ? lowStockQuery.data.length
    : 0;
  const outCount = Array.isArray(lowStockQuery.data)
    ? lowStockQuery.data.filter((d: any) => (d.currentQty ?? 0) <= 0).length
    : 0;
  const expiringCount = Array.isArray(expiringQuery.data)
    ? expiringQuery.data.length
    : 0;

  async function confirmDanger() {
    if (!danger) return;
    const { drug, kind } = danger;
    try {
      if (kind === 'deactivate') {
        await inventoryApi.drugs.remove(drug._id);
        toast.success('Drug deactivated');
      } else {
        await inventoryApi.drugs.hardRemove(drug._id);
        toast.success('Drug permanently deleted');
      }
      setDanger(null);
      await drugsQuery.refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...DRUG_CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  const renderItem = ({ item }: { item: Drug }) => (
    <Pressable
      onPress={() =>
        navigation.navigate('DrugDetail', { drugId: item._id })
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
          <Text
            style={[styles.name, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.name}
            {item.strength ? ` ${item.strength}` : ''}
          </Text>
          <Text
            style={[styles.meta, { color: theme.colors.textMuted }]}
            numberOfLines={1}
          >
            {[item.generic, item.brand].filter(Boolean).join(' · ') || '—'}
          </Text>
          <View style={styles.tagRow}>
            {item.category ? (
              <Badge variant="neutral">{item.category}</Badge>
            ) : null}
            <Badge variant="neutral">
              {DRUG_FORM_LABELS[item.form] ?? item.form}
            </Badge>
            {item.prescriptionRequired ? (
              <Badge variant="warning">Rx</Badge>
            ) : null}
            {item.controlled ? <Badge variant="danger">Controlled</Badge> : null}
          </View>
        </View>

        <View style={styles.cardRight}>
          <StockBadge
            qty={item.currentQty ?? 0}
            reorderLevel={item.reorderLevel}
            size="sm"
          />
        </View>
      </View>
    </Pressable>
  );

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Inventory
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {drugs.length} drug{drugs.length === 1 ? '' : 's'} in your catalog
          </Text>
        </View>

        {canCreate ? (
          <Button
            title="New"
            size="sm"
            onPress={() => navigation.navigate('DrugForm')}
            leftIcon={<Ionicons name="add" size={16} color="#ffffff" />}
          />
        ) : null}
      </View>

      <View style={styles.kpiGrid}>
        <KpiCard
          icon="cube-outline"
          label="Total drugs"
          value={String(drugs.length)}
          tint="primary"
        />
        <KpiCard
          icon="warning-outline"
          label="Low stock"
          value={String(lowCount)}
          tint={lowCount > 0 ? 'warning' : 'success'}
          onPress={() => navigation.navigate('LowStock')}
        />
        <KpiCard
          icon="close-circle-outline"
          label="Out of stock"
          value={String(outCount)}
          tint={outCount > 0 ? 'danger' : 'success'}
          onPress={() => navigation.navigate('LowStock')}
        />
        <KpiCard
          icon="time-outline"
          label="Expiring soon"
          value={String(expiringCount)}
          tint={expiringCount > 0 ? 'danger' : 'success'}
          onPress={() => navigation.navigate('Expiring')}
        />
      </View>

      <View style={styles.searchWrap}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, generic, or barcode…"
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

      <View style={styles.filterWrap}>
        <Select
          value={category}
          options={categoryOptions}
          onChange={setCategory}
        />
      </View>

      {drugsQuery.isLoading ? (
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      ) : !drugs.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <Ionicons
                name="cube-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title={search || category ? 'No matches' : 'No drugs yet'}
            description={
              search || category
                ? 'Try a different search or clear the category filter.'
                : 'Add your first drug to start tracking stock, batches, and sales.'
            }
            action={
              !search && !category && canCreate ? (
                <Button
                  title="New drug"
                  size="sm"
                  onPress={() => navigation.navigate('DrugForm')}
                  leftIcon={<Ionicons name="add" size={14} color="#ffffff" />}
                />
              ) : undefined
            }
          />
        </View>
      ) : (
        <FlatList
          data={drugs}
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
            ? `Permanently delete ${danger.drug.name}?`
            : `Deactivate ${danger?.drug.name ?? ''}?`
        }
        description={
          danger?.kind === 'hard-delete'
            ? 'This cannot be undone. Drugs with batches or movements cannot be deleted — deactivate instead.'
            : "The drug won't appear in searches or new sales. Its history is preserved."
        }
        confirmLabel={
          danger?.kind === 'hard-delete' ? 'Delete permanently' : 'Deactivate'
        }
        variant="danger"
      />
    </Screen>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: 'primary' | 'success' | 'warning' | 'danger';
  onPress?: () => void;
}) {
  const { theme } = useTheme();

  const color =
    tint === 'primary'
      ? theme.colors.primary
      : tint === 'success'
      ? theme.colors.success
      : tint === 'warning'
      ? theme.colors.warning
      : theme.colors.danger;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.kpiCard,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.kpiIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
        {value}
      </Text>
    </Pressable>
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: '47%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiLabel: { fontSize: 11 },
  kpiValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  searchWrap: { marginBottom: 12 },
  filterWrap: { marginBottom: 16 },
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
    gap: 12,
  },
  cardLeft: { flex: 1, minWidth: 0 },
  cardRight: { alignItems: 'flex-end' },
  name: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 4 },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  bottomPad: { height: 24 },
});