import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Modal, Input, Badge, EmptyState, Spinner } from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { prescriptionApi } from '@/api/axios';
import { prescriptionStatusLabel } from '@/utils/enums';
import { formatRelativeTime } from '@/utils/format';
import type { Prescription } from '@/types';

interface Props {
  onPick: (rx: Prescription) => void;
  onClose: () => void;
}

function statusVariant(
  status: string
): 'success' | 'warning' | 'info' | 'danger' | 'neutral' {
  switch (status) {
    case 'dispensed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'partial':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function PrescriptionPicker({ onPick, onClose }: Props) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);

  const listQuery = useQuery({
    queryKey: ['prescriptions', 'picker'],
    queryFn: () => prescriptionApi.list(),
  });

  const results: Prescription[] = useMemo(() => {
    const raw = listQuery.data;
    const arr = Array.isArray(raw) ? raw : ((raw as any)?.items ?? []);
    const pending = arr.filter((r) => r.status === 'pending');

    const q = debounced.trim().toLowerCase();
    if (!q) return pending.slice(0, 30);

    return pending
      .filter((r) => {
        const ref = (r.refNo ?? r._id).toLowerCase();
        const patient = r.patientId as any;
        const name =
          (typeof patient === 'object' ? patient?.name : '')?.toLowerCase() ??
          '';
        return ref.includes(q) || name.includes(q);
      })
      .slice(0, 30);
  }, [listQuery.data, debounced]);

  return (
    <Modal
      open
      onClose={onClose}
      title="Attach prescription"
      size="md"
      footer={null}
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search by ref or patient name…"
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
                name="document-text-outline"
                size={20}
                color={theme.colors.textMuted}
              />
            }
            title={query ? 'No matches' : 'No pending prescriptions'}
            description={
              query
                ? 'Try a different search.'
                : 'Only pending prescriptions can be attached to a sale.'
            }
          />
        ) : (
          <View>
            {results.map((item) => {
              const patient = item.patientId as any;
              const patientName =
                typeof patient === 'object' ? patient?.name : null;
              const ref =
                item.refNo ?? String(item._id).slice(-6).toUpperCase();
              return (
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
                      style={[styles.ref, { color: theme.colors.primary }]}
                    >
                      {ref}
                    </Text>
                    <Text
                      style={[styles.meta, { color: theme.colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {patientName ?? '—'} ·{' '}
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>
                  <Badge variant={statusVariant(item.status)}>
                    {prescriptionStatusLabel(item.status)}
                  </Badge>
                </Pressable>
              );
            })}
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
  ref: { fontSize: 13, fontWeight: '600', fontFamily: 'Courier' },
  meta: { fontSize: 12, marginTop: 3 },
});