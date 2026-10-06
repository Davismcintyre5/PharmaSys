import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Modal, Input, EmptyState, Spinner } from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { customerApi } from '@/api/axios';
import { formatMoney } from '@/utils/format';
import type { Customer } from '@/types';

interface Props {
  onPick: (c: Customer) => void;
  onClose: () => void;
}

export function CustomerPicker({ onPick, onClose }: Props) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);

  const listQuery = useQuery({
    queryKey: ['customers', 'picker', debounced],
    queryFn: () => customerApi.list(debounced ? { search: debounced } : {}),
  });

  const results: Customer[] = useMemo(() => {
    const raw = listQuery.data;
    const arr = Array.isArray(raw) ? raw : ((raw as any)?.items ?? []);
    return arr.slice(0, 30);
  }, [listQuery.data]);

  return (
    <Modal
      open
      onClose={onClose}
      title="Attach customer"
      size="md"
      footer={null}
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search customers by name or phone…"
        leftIcon={
          <Ionicons
            name="search"
            size={14}
            color={theme.colors.textSubtle}
          />
        }
        autoFocus
      />

      <View style={styles.listWrap}>
        {listQuery.isLoading ? (
          <View style={styles.center}>
            <Spinner />
          </View>
        ) : !results.length ? (
          <EmptyState
            icon={
              <Ionicons
                name="people-outline"
                size={20}
                color={theme.colors.textMuted}
              />
            }
            title={query ? 'No matches' : 'No customers'}
            description={
              query ? 'Try a different search.' : 'Add a customer first.'
            }
          />
        ) : (
          <View>
            {results.map((item) => (
              <Pressable
                key={item._id}
                onPress={() => onPick(item)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed
                      ? theme.colors.surface2
                      : 'transparent',
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.rowLeft}>
                  <Text
                    style={[styles.name, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.meta, { color: theme.colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {item.phone ?? item.email ?? '—'}
                  </Text>
                </View>
                {item.totalSpent > 0 ? (
                  <Text
                    style={[
                      styles.lifetime,
                      { color: theme.colors.textSubtle },
                    ]}
                  >
                    {formatMoney(item.totalSpent, 'KES')}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  listWrap: { marginTop: 12 },
  center: { paddingVertical: 32, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '500' },
  meta: { fontSize: 12, marginTop: 2 },
  lifetime: { fontSize: 11 },
});