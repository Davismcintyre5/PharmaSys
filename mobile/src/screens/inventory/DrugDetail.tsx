import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Badge,
  Alert,
  Spinner,
  EmptyState,
  ConfirmDialog,
} from '@/components/ui';
import { StockBadge } from '@/components/app/StockBadge';
import { ExpiryBadge } from '@/components/app/ExpiryBadge';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { inventoryApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { hasPermission } from '@/utils/permissions';
import {
  DRUG_FORM_LABELS,
  MOVEMENT_TYPE_LABELS,
} from '@/utils/constants';
import {
  formatMoney,
  formatDate,
  formatDateTime,
} from '@/utils/format';
import type { Drug, Batch, StockMovement } from '@/types';

interface Props {
  navigation: any;
  route: { params: { drugId: string } };
}

type TabKey = 'batches' | 'movements';

type Danger =
  | { kind: 'deactivate' }
  | { kind: 'hard-delete' }
  | { kind: 'delete-batch'; batch: Batch }
  | null;

function movementIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'in':
      return 'arrow-down';
    case 'out':
      return 'arrow-up';
    case 'adjust':
      return 'swap-horizontal';
    case 'expired':
      return 'warning';
    case 'returned':
      return 'arrow-undo';
    default:
      return 'ellipse';
  }
}

function movementColor(
  type: string,
  colors: { success: string; info: string; warning: string; danger: string }
): string {
  switch (type) {
    case 'in':
      return colors.success;
    case 'out':
      return colors.info;
    case 'adjust':
      return colors.warning;
    case 'expired':
      return colors.danger;
    case 'returned':
      return colors.success;
    default:
      return colors.info;
  }
}

export default function DrugDetail({ navigation, route }: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const drugId = route.params?.drugId ?? '';
  const canEdit = hasPermission(user?.role, 'drugs.edit');
  const canAdjust = hasPermission(user?.role, 'inventory.adjust');
  const canReceive = hasPermission(user?.role, 'inventory.receive');
  const isOwner = user?.role === 'owner';

  const [tab, setTab] = useState<TabKey>('batches');
  const [danger, setDanger] = useState<Danger>(null);

  const drugQuery = useQuery({
    queryKey: queryKeys.inventory.drug(drugId),
    queryFn: () => inventoryApi.drugs.get(drugId),
    enabled: Boolean(drugId),
  });

  const batchesQuery = useQuery({
    queryKey: queryKeys.inventory.batches(drugId),
    queryFn: () => inventoryApi.batches.list(drugId),
    enabled: Boolean(drugId),
  });

  const movementsQuery = useQuery({
    queryKey: queryKeys.inventory.movements({ drugId }),
    queryFn: () => inventoryApi.movements.list({ drugId, limit: 50 }),
    enabled: Boolean(drugId) && tab === 'movements',
  });

  const rawDrug = drugQuery.data;
  const drug: Drug | null = useMemo(() => {
    if (!rawDrug) return null;
    if (typeof rawDrug === 'object' && 'drug' in rawDrug) {
      return (rawDrug as any).drug as Drug;
    }
    return rawDrug as Drug;
  }, [rawDrug]);

  const batches: Batch[] = useMemo(() => {
    const fromDrug = (rawDrug as any)?.batches;
    if (Array.isArray(fromDrug)) return fromDrug;
    const raw = batchesQuery.data;
    if (Array.isArray(raw)) return raw;
    return (raw as any)?.items ?? [];
  }, [rawDrug, batchesQuery.data]);

  const movements: StockMovement[] = useMemo(() => {
    const raw = movementsQuery.data;
    if (Array.isArray(raw)) return raw;
    return (raw as any)?.items ?? [];
  }, [movementsQuery.data]);

  const currentQty = useMemo(
    () => batches.reduce((s, b) => s + (b.qty || 0), 0),
    [batches]
  );

  const nearestExpiry = useMemo(() => {
    const future = batches
      .filter((b) => b.qty > 0 && new Date(b.expiryDate) > new Date())
      .sort(
        (a, b) =>
          new Date(a.expiryDate).getTime() -
          new Date(b.expiryDate).getTime()
      );
    return future[0]?.expiryDate ?? null;
  }, [batches]);

  const stockValue = useMemo(
    () => batches.reduce((s, b) => s + (b.qty || 0) * (b.costPrice || 0), 0),
    [batches]
  );

  function openRestock() {
    navigation.navigate('DrugForm', {
      drugId: drug?._id,
      mode: 'restock',
    });
  }

  function openEdit() {
    navigation.navigate('DrugForm', {
      drugId: drug?._id,
      mode: 'edit',
    });
  }

  async function confirmDanger() {
    if (!danger || !drug) return;
    try {
      if (danger.kind === 'deactivate') {
        await inventoryApi.drugs.remove(drug._id);
        toast.success('Drug deactivated');
        await queryClient.invalidateQueries({ queryKey: ['inventory'] });
        navigation.goBack();
      } else if (danger.kind === 'hard-delete') {
        await inventoryApi.drugs.hardRemove(drug._id);
        toast.success('Drug permanently deleted');
        await queryClient.invalidateQueries({ queryKey: ['inventory'] });
        navigation.goBack();
      } else if (danger.kind === 'delete-batch') {
        await inventoryApi.batches.remove(danger.batch._id);
        toast.success('Batch deleted');
        setDanger(null);
        await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      }
      setDanger(null);
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
      setDanger(null);
    }
  }

  if (drugQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  if (!drug) {
    return (
      <Screen>
        <Alert variant="danger">Drug not found.</Alert>
      </Screen>
    );
  }

  const tabs: { value: TabKey; label: string; count?: number }[] = [
    { value: 'batches', label: `Batches (${batches.length})` },
    { value: 'movements', label: 'Movements' },
  ];

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {drug.name}
          {drug.strength ? ` ${drug.strength}` : ''}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {[drug.generic, drug.brand, DRUG_FORM_LABELS[drug.form]]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <View style={styles.headerBadges}>
          {drug.prescriptionRequired ? (
            <Badge variant="warning">Prescription required</Badge>
          ) : null}
          {drug.controlled ? (
            <Badge variant="danger">Controlled substance</Badge>
          ) : null}
        </View>

        <View style={styles.headerActions}>
          {canReceive && !drug.controlled ? (
            <Button
              title="Restock"
              size="sm"
              onPress={openRestock}
              leftIcon={
                <Ionicons
                  name="add-circle-outline"
                  size={14}
                  color="#ffffff"
                />
              }
            />
          ) : null}

          {canEdit ? (
            <Button
              title="Edit"
              size="sm"
              variant="outline"
              onPress={openEdit}
              leftIcon={
                <Ionicons
                  name="pencil-outline"
                  size={14}
                  color={theme.colors.text}
                />
              }
            />
          ) : null}
        </View>
      </View>

      <View style={styles.kpiGrid}>
        <KpiCard
          icon="cube-outline"
          label="Total in stock"
          value={String(currentQty)}
          tint="primary"
          extra={
            <StockBadge
              qty={currentQty}
              reorderLevel={drug.reorderLevel}
              size="sm"
            />
          }
        />
        <KpiCard
          icon="calendar-outline"
          label="Nearest expiry"
          value={nearestExpiry ? formatDate(nearestExpiry) : '—'}
          tint="info"
          extra={
            nearestExpiry ? <ExpiryBadge expiryDate={nearestExpiry} /> : null
          }
        />
        <KpiCard
          icon="cash-outline"
          label="Stock value (cost)"
          value={formatMoney(stockValue, 'KES')}
          tint="success"
        />
      </View>

      <Card style={styles.section} header="Drug details">
        <MetaRow label="Category" value={drug.category ?? '—'} />
        <MetaRow label="Unit" value={drug.unit || 'pcs'} />
        <MetaRow label="Reorder level" value={String(drug.reorderLevel ?? 0)} />
        <MetaRow label="Tax rate" value={`${drug.taxRate ?? 0}%`} />
        <MetaRow label="Barcode" value={drug.barcode ?? '—'} />
        <MetaRow
          label="Status"
          value={drug.isActive === false ? 'Inactive' : 'Active'}
        />
      </Card>

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

      {tab === 'batches' ? (
        <Card style={styles.section}>
          {!batches.length ? (
            <EmptyState
              icon={
                <Ionicons
                  name="cube-outline"
                  size={22}
                  color={theme.colors.textMuted}
                />
              }
              title="No batches yet"
              description="Add stock to this drug to start tracking batches by expiry date."
              action={
                canReceive ? (
                  <Button
                    title="Restock"
                    size="sm"
                    onPress={openRestock}
                    leftIcon={
                      <Ionicons
                        name="add-circle-outline"
                        size={14}
                        color="#ffffff"
                      />
                    }
                  />
                ) : undefined
              }
            />
          ) : (
            <View style={styles.batchesList}>
              {batches.map((b, idx) => (
                <View
                  key={b._id}
                  style={[
                    styles.batchRow,
                    idx < batches.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.batchLeft}>
                    <Text
                      style={[styles.batchLot, { color: theme.colors.text }]}
                    >
                      {b.lotNo ?? '—'}
                    </Text>
                    <Text
                      style={[
                        styles.batchMeta,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      {b.qty} units · cost{' '}
                      {formatMoney(b.costPrice || 0, 'KES')} · sell{' '}
                      {formatMoney(b.sellingPrice || 0, 'KES')}
                    </Text>
                    <View style={styles.batchExpiry}>
                      <Text
                        style={[
                          styles.batchMeta,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        Expires {formatDate(b.expiryDate)}
                      </Text>
                      <ExpiryBadge expiryDate={b.expiryDate} />
                    </View>
                  </View>

                  {canAdjust ? (
                    <Pressable
                      onPress={() =>
                        setDanger({ kind: 'delete-batch', batch: b })
                      }
                      hitSlop={8}
                      style={styles.batchDelete}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color={theme.colors.danger}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </Card>
      ) : (
        <Card style={styles.section}>
          {movementsQuery.isLoading ? (
            <View style={styles.loading}>
              <Spinner />
            </View>
          ) : !movements.length ? (
            <EmptyState
              icon={
                <Ionicons
                  name="swap-horizontal-outline"
                  size={22}
                  color={theme.colors.textMuted}
                />
              }
              title="No movements yet"
              description="Stock movements appear here when you restock, adjust, sell, or write off."
            />
          ) : (
            <View style={styles.movementsList}>
              {movements.map((m, idx) => {
                const color = movementColor(m.type, theme.colors);
                return (
                  <View
                    key={m._id}
                    style={[
                      styles.movementRow,
                      idx < movements.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.movementIcon,
                        { backgroundColor: color + '15' },
                      ]}
                    >
                      <Ionicons
                        name={movementIcon(m.type)}
                        size={12}
                        color={color}
                      />
                    </View>

                    <View style={styles.movementBody}>
                      <Text
                        style={[
                          styles.movementType,
                          { color: theme.colors.text },
                        ]}
                      >
                        {MOVEMENT_TYPE_LABELS[m.type] ?? m.type}
                      </Text>
                      <Text
                        style={[
                          styles.movementMeta,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        {m.ref ? `Ref ${m.ref}` : '—'}
                        {m.note ? ` · ${m.note}` : ''}
                      </Text>
                      <Text
                        style={[
                          styles.movementTime,
                          { color: theme.colors.textSubtle },
                        ]}
                      >
                        {formatDateTime(m.createdAt)}
                      </Text>
                    </View>

                    <Text
                      style={[styles.movementQty, { color: theme.colors.text }]}
                    >
                      {m.qty}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      )}

      {(isOwner || canEdit) ? (
        <Card style={styles.section} header="Actions">
          <View style={styles.actionsRow}>
            {canEdit ? (
              <Button
                title="Deactivate"
                variant="outline"
                onPress={() => setDanger({ kind: 'deactivate' })}
                leftIcon={
                  <Ionicons
                    name="close-circle-outline"
                    size={14}
                    color={theme.colors.text}
                  />
                }
              />
            ) : null}

            {isOwner ? (
              <Button
                title="Delete permanently"
                variant="danger"
                onPress={() => setDanger({ kind: 'hard-delete' })}
                leftIcon={
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color="#ffffff"
                  />
                }
              />
            ) : null}
          </View>
        </Card>
      ) : null}

      <View style={styles.bottomPad} />

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'hard-delete'
            ? `Permanently delete ${drug.name}?`
            : danger?.kind === 'delete-batch'
            ? 'Delete this batch?'
            : `Deactivate ${drug.name}?`
        }
        description={
          danger?.kind === 'hard-delete'
            ? 'This cannot be undone. Drugs with batches or movements cannot be deleted — deactivate instead.'
            : danger?.kind === 'delete-batch'
            ? 'This batch will be removed from stock. Only batches with zero remaining stock can be deleted.'
            : "The drug won't appear in searches or new sales. Its history is preserved."
        }
        confirmLabel={
          danger?.kind === 'hard-delete'
            ? 'Delete permanently'
            : danger?.kind === 'delete-batch'
            ? 'Delete batch'
            : 'Deactivate'
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
  extra,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: 'primary' | 'success' | 'info';
  extra?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const color =
    tint === 'primary'
      ? theme.colors.primary
      : tint === 'success'
      ? theme.colors.success
      : theme.colors.info;

  return (
    <View
      style={[
        styles.kpiCard,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
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
      {extra}
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[styles.metaValue, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { paddingVertical: 24, alignItems: 'center' },
  header: { marginTop: 16, marginBottom: 16 },
  name: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  headerBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: '30%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minWidth: 100,
    gap: 6,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiLabel: { fontSize: 11 },
  kpiValue: { fontSize: 15, fontWeight: '700' },
  section: { marginBottom: 16 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  metaLabel: { fontSize: 13 },
  metaValue: { fontSize: 13, fontWeight: '500', flexShrink: 1 },
  tabsWrap: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tabText: { fontSize: 12, fontWeight: '500' },
  batchesList: { gap: 0 },
  batchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  batchLeft: { flex: 1, minWidth: 0 },
  batchLot: { fontSize: 13, fontWeight: '600', fontFamily: 'Courier' },
  batchMeta: { fontSize: 11, marginTop: 4 },
  batchExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  batchDelete: { padding: 6 },
  movementsList: { gap: 0 },
  movementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  movementIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movementBody: { flex: 1, minWidth: 0 },
  movementType: { fontSize: 13, fontWeight: '500' },
  movementMeta: { fontSize: 11, marginTop: 2 },
  movementTime: { fontSize: 10, marginTop: 2 },
  movementQty: { fontSize: 14, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  bottomPad: { height: 24 },
});