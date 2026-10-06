import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Button,
  Input,
  EmptyState,
  Spinner,
  Badge,
  Alert,
  ConfirmDialog,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { prescriptionApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { hasPermission } from '@/utils/permissions';
import { prescriptionStatusLabel } from '@/utils/enums';
import { formatRelativeTime } from '@/utils/format';
import type { Prescription, PrescriptionStatus } from '@/types';

type TabKey = 'all' | PrescriptionStatus;

type Danger =
  | { prescription: Prescription; kind: 'cancel' }
  | { prescription: Prescription; kind: 'hard-delete' }
  | null;

function statusVariant(
  status: PrescriptionStatus
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

export default function Prescriptions() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canView = hasPermission(user?.role, 'prescriptions.view');
  const canDispense = hasPermission(user?.role, 'prescriptions.dispense');
  const isOwner = user?.role === 'owner';

  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [busy, setBusy] = useState<string | null>(null);
  const [danger, setDanger] = useState<Danger>(null);

  const listQuery = useQuery({
    queryKey: queryKeys.prescriptions.list(),
    queryFn: () => prescriptionApi.list(),
    enabled: canView,
  });

  const items: Prescription[] = useMemo(
    () => (Array.isArray(listQuery.data) ? listQuery.data : []),
    [listQuery.data]
  );

  const counts = useMemo(() => {
    return {
      all: items.length,
      pending: items.filter((r) => r.status === 'pending').length,
      dispensed: items.filter((r) => r.status === 'dispensed').length,
      partial: items.filter((r) => r.status === 'partial').length,
      cancelled: items.filter((r) => r.status === 'cancelled').length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (tab !== 'all') list = list.filter((r) => r.status === tab);

    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const ref = (r.refNo ?? r._id).toLowerCase();
        const patient = r.patientId as any;
        const name =
          (typeof patient === 'object' ? patient?.name : '')?.toLowerCase() ??
          '';
        const phone =
          (typeof patient === 'object' ? patient?.phone : '')?.toLowerCase() ??
          '';
        return ref.includes(q) || name.includes(q) || phone.includes(q);
      });
    }
    return list;
  }, [items, tab, debouncedSearch]);

  async function dispense(rx: Prescription) {
    setBusy(rx._id);
    try {
      await prescriptionApi.dispense(rx._id);
      toast.success('Prescription dispensed');
      await queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    } catch (e: any) {
      toast.error(e?.message || 'Dispense failed');
    } finally {
      setBusy(null);
    }
  }

  async function confirmDanger() {
    if (!danger) return;
    const { prescription, kind } = danger;
    try {
      if (kind === 'cancel') {
        await prescriptionApi.cancel(prescription._id);
        toast.success('Prescription cancelled');
      } else {
        await prescriptionApi.hardRemove(prescription._id);
        toast.success('Prescription permanently deleted');
      }
      setDanger(null);
      await queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
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
            description="You don't have permission to view prescriptions."
          />
        </View>
      </Screen>
    );
  }

  const tabs: { value: TabKey; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'pending', label: 'Pending', count: counts.pending },
    { value: 'dispensed', label: 'Dispensed', count: counts.dispensed },
    { value: 'partial', label: 'Partial', count: counts.partial },
    { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  const renderItem = ({ item }: { item: Prescription }) => {
    const patient = item.patientId as any;
    const patientName =
      typeof patient === 'object' ? patient?.name : null;
    const patientPhone =
      typeof patient === 'object' ? patient?.phone : null;
    const ref = item.refNo ?? String(item._id).slice(-6).toUpperCase();
    const isBusy = busy === item._id;
    const canCancel =
      canDispense &&
      item.status !== 'dispensed' &&
      item.status !== 'cancelled';

    return (
      <Pressable
        onPress={() =>
          navigation.navigate('PrescriptionDetail', {
            prescriptionId: item._id,
          })
        }
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: isBusy ? 0.6 : pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text style={[styles.ref, { color: theme.colors.primary }]}>
              {ref}
            </Text>

            <View style={styles.metaBlock}>
              {patientName ? (
                <View style={styles.metaLine}>
                  <Ionicons
                    name="person-outline"
                    size={11}
                    color={theme.colors.textSubtle}
                  />
                  <Text
                    style={[styles.metaText, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {patientName}
                  </Text>
                </View>
              ) : null}
              {patientPhone ? (
                <View style={styles.metaLine}>
                  <Ionicons
                    name="call-outline"
                    size={11}
                    color={theme.colors.textSubtle}
                  />
                  <Text
                    style={[styles.metaText, { color: theme.colors.textMuted }]}
                  >
                    {patientPhone}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.timestamp, { color: theme.colors.textSubtle }]}>
              {item.items?.length ?? 0} item
              {item.items?.length === 1 ? '' : 's'} ·{' '}
              {formatRelativeTime(item.createdAt)}
            </Text>
          </View>

          <View style={styles.cardRight}>
            <Badge variant={statusVariant(item.status)}>
              {prescriptionStatusLabel(item.status)}
            </Badge>
          </View>
        </View>

        {(item.status === 'pending' && canDispense) || canCancel ? (
          <View style={styles.cardActions}>
            {item.status === 'pending' && canDispense ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  dispense(item);
                }}
                disabled={isBusy}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={12}
                  color={theme.colors.success}
                />
                <Text
                  style={[styles.actionText, { color: theme.colors.success }]}
                >
                  Dispense
                </Text>
              </Pressable>
            ) : null}

            {canCancel ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  setDanger({ prescription: item, kind: 'cancel' });
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

            {isOwner && item.status !== 'dispensed' ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  setDanger({ prescription: item, kind: 'hard-delete' });
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
        ) : null}
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Prescriptions
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {counts.all} total · {counts.pending} pending
          </Text>
        </View>

        {canDispense && (
          <Button
            title="New"
            size="sm"
            onPress={() => navigation.navigate('NewPrescription')}
            leftIcon={<Ionicons name="add" size={16} color="#ffffff" />}
          />
        )}
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
          placeholder="Search by ref, patient name, or phone…"
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
                name="medkit-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title={
              search || tab !== 'all'
                ? 'No matches'
                : 'No prescriptions yet'
            }
            description={
              search || tab !== 'all'
                ? 'Try a different filter or search term.'
                : 'Create a prescription to start tracking dispenses.'
            }
            action={
              !search && tab === 'all' && canDispense ? (
                <Button
                  title="New prescription"
                  size="sm"
                  onPress={() => navigation.navigate('NewPrescription')}
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
            ? 'Permanently delete this prescription?'
            : 'Cancel this prescription?'
        }
        description={
          danger?.kind === 'hard-delete'
            ? 'This cannot be undone. Dispensed prescriptions cannot be deleted.'
            : 'The prescription status changes to cancelled. Stock is untouched.'
        }
        confirmLabel={
          danger?.kind === 'hard-delete'
            ? 'Delete permanently'
            : 'Cancel prescription'
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
  cardRight: { alignItems: 'flex-end' },
  ref: { fontSize: 13, fontWeight: '600', fontFamily: 'Courier' },
  metaBlock: { marginTop: 6, gap: 4 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, flex: 1 },
  timestamp: { fontSize: 11, marginTop: 8 },
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