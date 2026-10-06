import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import {
  Screen,
  Input,
  EmptyState,
  Spinner,
} from '@/components/ui';
import { StockBadge } from '@/components/app/StockBadge';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { inventoryApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { hasPermission } from '@/utils/permissions';
import { DRUG_FORM_LABELS } from '@/utils/constants';
import type { Drug } from '@/types';

export default function LowStock() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user } = useAuth();

  const canReceive = hasPermission(user?.role, 'inventory.receive');

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);

  const listQuery = useQuery({
    queryKey: queryKeys.inventory.lowStock,
    queryFn: () => inventoryApi.drugs.lowStock(),
  });

  const drugs: Drug[] = useMemo(
    () => (Array.isArray(listQuery.data) ? listQuery.data : []),
    [listQuery.data]
  );

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter((d) => {
      const name = d.name?.toLowerCase() ?? '';
      const generic = d.generic?.toLowerCase() ?? '';
      const category = d.category?.toLowerCase() ?? '';
      return name.includes(q) || generic.includes(q) || category.includes(q);
    });
  }, [drugs, debounced]);

  const outCount = useMemo(
    () => drugs.filter((d) => ((d as any).currentQty ?? 0) <= 0).length,
    [drugs]
  );

  const renderItem = ({ item }: { item: Drug }) => {
    const currentQty = (item as any).currentQty ?? 0;
    const gap = Math.max(0, (item.reorderLevel || 0) - currentQty);

    return (
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
              {[item.generic, DRUG_FORM_LABELS[item.form]]
                .filter(Boolean)
                .join(' · ') || '—'}
            </Text>

            <View style={styles.statsRow}>
              <Text style={[styles.stat, { color: theme.colors.textMuted }]}>
                Reorder at {item.reorderLevel || 0}
              </Text>
              {gap > 0 ? (
                <Text style={[styles.gap, { color: theme.colors.danger }]}>
                  · +{gap} needed
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.cardRight}>
            <StockBadge
              qty={currentQty}
              reorderLevel={item.reorderLevel}
              size="sm"
            />
            {canReceive ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  navigation.navigate('DrugDetail', { drugId: item._id });
                }}
                style={styles.restockBtn}
              >
                <Text
                  style={[styles.restockText, { color: theme.colors.primary }]}
                >
                  Restock
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Low stock
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {drugs.length} item{drugs.length === 1 ? '' : 's'} need restocking
          {outCount ? ` · ${outCount} out of stock` : ''}
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, generic, or category…"
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
                name="checkmark-circle-outline"
                size={22}
                color={theme.colors.success}
              />
            }
            title={search ? 'No matches' : 'All stocked up'}
            description={
              search
                ? 'Try a different name or category.'
                : 'No drugs are below their reorder level. Keep it up.'
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
  header: { marginTop: 16, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  searchWrap: { marginBottom: 16 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  list: { gap: 10 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardLeft: { flex: 1, minWidth: 0 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  name: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  stat: { fontSize: 11 },
  gap: { fontSize: 11, fontWeight: '600' },
  restockBtn: { paddingVertical: 4 },
  restockText: { fontSize: 12, fontWeight: '600' },
  bottomPad: { height: 24 },
});