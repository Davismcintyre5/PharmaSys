import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Spinner, EmptyState } from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { inventoryApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { formatMoney } from '@/utils/format';
import { DRUG_CATEGORIES } from '@/utils/constants';
import type { Drug } from '@/types';

interface Props {
  onPick: (drug: Drug) => void;
  cartDrugIds: string[];
}

const PAGE_LIMIT = 100;

export function DrugGrid({ onPick, cartDrugIds }: Props) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const searchRef = useRef<TextInput>(null);

  const drugsQuery = useQuery({
    queryKey: queryKeys.inventory.drugs({
      search: debouncedSearch,
      category,
      limit: PAGE_LIMIT,
    }),
    queryFn: () =>
      inventoryApi.drugs.list({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(category ? { category } : {}),
        limit: PAGE_LIMIT,
      }),
  });

  const drugs: Drug[] = useMemo(() => {
    const raw = drugsQuery.data;
    if (Array.isArray(raw)) return raw;
    return (raw as any)?.items ?? [];
  }, [drugsQuery.data]);

  useEffect(() => {
    const timer = setTimeout(() => searchRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const catPills = ['', ...DRUG_CATEGORIES.slice(0, 6)];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.searchRow,
          { borderBottomColor: theme.colors.border },
        ]}
      >
        <Ionicons
          name="search"
          size={16}
          color={theme.colors.textSubtle}
        />
        <TextInput
          ref={searchRef}
          value={search}
          onChangeText={setSearch}
          placeholder="Search or scan barcode"
          placeholderTextColor={theme.colors.textSubtle}
          style={[styles.searchInput, { color: theme.colors.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={() => {
            if (drugs.length && !search) return;
            if (drugs.length) {
              onPick(drugs[0]);
              setSearch('');
            }
          }}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={16}
              color={theme.colors.textSubtle}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.categoriesWrap}>
        {catPills.map((c) => {
          const active = category === c;
          return (
            <Pressable
              key={c || 'all'}
              onPress={() => setCategory(c)}
              style={[
                styles.catPill,
                {
                  backgroundColor: active
                    ? theme.colors.primary
                    : theme.colors.surface2,
                },
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  {
                    color: active ? '#ffffff' : theme.colors.textMuted,
                  },
                ]}
                numberOfLines={1}
              >
                {c || 'All'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {drugsQuery.isLoading ? (
        <View style={styles.center}>
          <Spinner />
        </View>
      ) : !drugs.length ? (
        <View style={styles.center}>
          <EmptyState
            icon={
              <Ionicons
                name="search"
                size={20}
                color={theme.colors.textMuted}
              />
            }
            title={search ? 'No matches' : 'No drugs'}
            description={
              search
                ? 'Try a different name, generic, or barcode.'
                : 'Add drugs to your inventory first.'
            }
          />
        </View>
      ) : (
        <FlatList
          data={drugs}
          keyExtractor={(d) => d._id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DrugCard
              drug={item}
              inCart={cartDrugIds.includes(item._id)}
              onPress={() => onPick(item)}
            />
          )}
        />
      )}
    </View>
  );
}

function DrugCard({
  drug,
  inCart,
  onPress,
}: {
  drug: Drug;
  inCart: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const qty = drug.currentQty ?? 0;
  const out = qty <= 0;
  const low = !out && drug.reorderLevel > 0 && qty <= drug.reorderLevel;
  const disabled = out || drug.controlled;
  const price = drug.lastSellingPrice ?? 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.drugCard,
        {
          backgroundColor: inCart
            ? theme.colors.primary + '10'
            : theme.colors.surface,
          borderColor: inCart
            ? theme.colors.primary
            : theme.colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.drugHeader}>
        <Text
          style={[styles.drugName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {drug.name}
          {drug.strength ? ` ${drug.strength}` : ''}
        </Text>
        {drug.prescriptionRequired ? (
          <View
            style={[
              styles.rxTag,
              { backgroundColor: theme.colors.warning + '20' },
            ]}
          >
            <Text
              style={[styles.rxText, { color: theme.colors.warning }]}
            >
              Rx
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={[styles.drugMeta, { color: theme.colors.textMuted }]}
        numberOfLines={1}
      >
        {drug.generic ?? drug.form}
      </Text>

      <View style={styles.drugFooter}>
        <Text style={[styles.drugPrice, { color: theme.colors.text }]}>
          {price ? formatMoney(price, 'KES') : '—'}
        </Text>
        <Text
          style={[
            styles.drugStock,
            {
              color: out
                ? theme.colors.danger
                : low
                ? theme.colors.warning
                : theme.colors.success,
            },
          ]}
        >
          {out ? 'Out' : `${qty} left`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 4 },
  categoriesWrap: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexWrap: 'wrap',
  },
  catPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  catText: { fontSize: 11, fontWeight: '500' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridContent: { padding: 12, gap: 8 },
  gridRow: { gap: 8 },
  drugCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 90,
  },
  drugHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  drugName: { fontSize: 12, fontWeight: '600', flex: 1 },
  rxTag: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  rxText: { fontSize: 9, fontWeight: '700' },
  drugMeta: { fontSize: 10, marginTop: 4 },
  drugFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  drugPrice: { fontSize: 13, fontWeight: '700' },
  drugStock: { fontSize: 10, fontWeight: '500' },
});