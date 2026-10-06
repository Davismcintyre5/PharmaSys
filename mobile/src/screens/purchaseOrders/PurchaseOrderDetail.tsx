import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Input,
  FormField,
  Badge,
  Alert,
  Spinner,
  EmptyState,
  ConfirmDialog,
  Modal,
  Divider,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { purchaseOrderApi, inventoryApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { hasPermission } from '@/utils/permissions';
import { purchaseOrderStatusLabel } from '@/utils/enums';
import {
  formatMoney,
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from '@/utils/format';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Drug,
} from '@/types';

interface Props {
  navigation: any;
  route: { params: { purchaseOrderId: string } };
}

interface ReceiveLine {
  drugId: string;
  drugName: string;
  orderedQty: number;
  qty: string;
  costPrice: string;
  sellingPrice: string;
  lotNo: string;
  expiryDate: string;
}

type Danger =
  | { kind: 'send' }
  | { kind: 'cancel' }
  | { kind: 'hard-delete' }
  | null;

function statusVariant(
  status: string
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

export default function PurchaseOrderDetail({ navigation, route }: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const poId = route.params?.purchaseOrderId ?? '';

  const canReceive = hasPermission(user?.role, 'purchase_orders.receive');
  const canCreate = hasPermission(user?.role, 'purchase_orders.create');
  const isOwner = user?.role === 'owner';

  const poQuery = useQuery({
    queryKey: queryKeys.purchaseOrders.detail(poId),
    queryFn: () => purchaseOrderApi.get(poId),
    enabled: Boolean(poId),
  });

  const drugsQuery = useQuery({
    queryKey: ['inventory', 'drugs', 'po-detail'],
    queryFn: () => inventoryApi.drugs.list({ limit: 500 }),
    enabled: Boolean(poQuery.data),
  });

  const po: PurchaseOrder | null = poQuery.data ?? null;

  const drugs: Record<string, Drug> = useMemo(() => {
    const raw = drugsQuery.data;
    const arr = Array.isArray(raw) ? raw : ((raw as any)?.items ?? []);
    const map: Record<string, Drug> = {};
    for (const d of arr) map[d._id] = d;
    return map;
  }, [drugsQuery.data]);

  const [danger, setDanger] = useState<Danger>(null);
  const [busy, setBusy] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveLines, setReceiveLines] = useState<ReceiveLine[]>([]);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  const supplier = po?.supplierId as any;
  const supplierName = typeof supplier === 'object' ? supplier?.name : null;
  const supplierEmail = typeof supplier === 'object' ? supplier?.email : null;
  const supplierPhone = typeof supplier === 'object' ? supplier?.phone : null;
  const supplierContact =
    typeof supplier === 'object' ? supplier?.contactPerson : null;
  const supplierAddress =
    typeof supplier === 'object' ? supplier?.address : null;

  const totalQty = useMemo(
    () => po?.items?.reduce((s, i) => s + (i.qty || 0), 0) ?? 0,
    [po]
  );

  function openReceive() {
    if (!po) return;
    const lines: ReceiveLine[] = po.items.map((item) => {
      const drug = drugs[item.drugId];
      return {
        drugId: item.drugId,
        drugName: drug?.name ?? 'Unknown drug',
        orderedQty: item.qty,
        qty: String(item.qty),
        costPrice: String(item.costPrice || 0),
        sellingPrice: drug?.lastSellingPrice
          ? String(drug.lastSellingPrice)
          : '',
        lotNo: '',
        expiryDate: '',
      };
    });
    setReceiveLines(lines);
    setReceiveOpen(true);
  }

  function patchLine<K extends keyof ReceiveLine>(
    idx: number,
    key: K,
    value: ReceiveLine[K]
  ) {
    setReceiveLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l))
    );
  }

  async function submitReceive() {
    if (receiveSubmitting || !po) return;

    const errors: string[] = [];
    for (const line of receiveLines) {
      const q = Number(line.qty);
      if (!Number.isFinite(q) || q <= 0) {
        errors.push(`${line.drugName}: quantity must be > 0`);
      }
      if (!line.expiryDate) {
        errors.push(`${line.drugName}: expiry date is required`);
      } else if (new Date(line.expiryDate) <= new Date()) {
        errors.push(`${line.drugName}: expiry must be in the future`);
      }
      const cost = Number(line.costPrice);
      if (!Number.isFinite(cost) || cost < 0) {
        errors.push(`${line.drugName}: cost price must be ≥ 0`);
      }
    }

    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    setReceiveSubmitting(true);
    try {
      await purchaseOrderApi.receive(po._id, {
        items: receiveLines.map((l) => ({
          drugId: l.drugId,
          qty: Number(l.qty),
          costPrice: Number(l.costPrice) || 0,
          sellingPrice: Number(l.sellingPrice) || 0,
          lotNo: l.lotNo.trim() || undefined,
          expiryDate: l.expiryDate,
        })),
      });
      toast.success('Stock received');
      setReceiveOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (e: any) {
      toast.error(e?.message || 'Receive failed');
    } finally {
      setReceiveSubmitting(false);
    }
  }

  async function confirmDanger() {
    if (!po || !danger) return;
    setBusy(true);
    try {
      if (danger.kind === 'send') {
        await purchaseOrderApi.send(po._id);
        toast.success('Purchase order sent to supplier');
        await queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      } else if (danger.kind === 'cancel') {
        await purchaseOrderApi.cancel(po._id);
        toast.success('Purchase order cancelled');
        await queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      } else {
        await purchaseOrderApi.hardRemove(po._id);
        toast.success('Purchase order permanently deleted');
        navigation.goBack();
      }
      setDanger(null);
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  if (poQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  if (!po) {
    return (
      <Screen>
        <Alert variant="danger">Purchase order not found.</Alert>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.poNo, { color: theme.colors.text }]}>
          {po.poNo}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {supplierName
            ? `${supplierName} · ${totalQty} unit${totalQty === 1 ? '' : 's'}`
            : `${totalQty} unit${totalQty === 1 ? '' : 's'}`}
        </Text>

        <View style={styles.headerBadges}>
          <Badge variant={statusVariant(po.status)}>
            {purchaseOrderStatusLabel(po.status)}
          </Badge>
        </View>

        <View style={styles.headerActions}>
          {po.status === 'draft' && canCreate ? (
            <Button
              title="Send"
              size="sm"
              onPress={() => setDanger({ kind: 'send' })}
              leftIcon={
                <Ionicons name="send-outline" size={14} color="#ffffff" />
              }
            />
          ) : null}

          {po.status === 'ordered' && canReceive ? (
            <Button
              title="Receive"
              size="sm"
              onPress={openReceive}
              leftIcon={
                <Ionicons
                  name="download-outline"
                  size={14}
                  color="#ffffff"
                />
              }
            />
          ) : null}

          {po.status !== 'received' &&
          po.status !== 'cancelled' &&
          canCreate ? (
            <Button
              title="Cancel"
              size="sm"
              variant="outline"
              onPress={() => setDanger({ kind: 'cancel' })}
              leftIcon={
                <Ionicons
                  name="close-circle-outline"
                  size={14}
                  color={theme.colors.text}
                />
              }
            />
          ) : null}

          {isOwner &&
          (po.status === 'draft' || po.status === 'cancelled') ? (
            <Button
              title="Delete"
              size="sm"
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
      </View>

      {po.status === 'ordered' ? (
        <Alert variant="info" style={styles.alert}>
          Sent {po.sentAt ? formatRelativeTime(po.sentAt) : ''} to{' '}
          {supplierName ?? 'supplier'}. Awaiting delivery.
        </Alert>
      ) : null}

      {po.status === 'received' ? (
        <Alert variant="success" style={styles.alert}>
          Received{' '}
          {po.receivedAt ? formatRelativeTime(po.receivedAt) : ''} — batches
          were created and stock has been updated.
        </Alert>
      ) : null}

      {po.status === 'cancelled' ? (
        <Alert variant="danger" style={styles.alert}>
          This purchase order was cancelled. No stock was received.
        </Alert>
      ) : null}

      <View style={styles.twoCol}>
        <Card style={styles.col}>
          <View style={styles.colHeader}>
            <View
              style={[
                styles.colIcon,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Ionicons
                name="business-outline"
                size={16}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.colTitle, { color: theme.colors.text }]}>
              Supplier
            </Text>
          </View>

          {supplierName ? (
            <View style={styles.colBody}>
              <Text
                style={[styles.colValue, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {supplierName}
              </Text>
              {supplierContact ? (
                <Text
                  style={[styles.colMeta, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {supplierContact}
                </Text>
              ) : null}
              {supplierEmail ? (
                <Text
                  style={[styles.colMeta, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {supplierEmail}
                </Text>
              ) : null}
              {supplierPhone ? (
                <Text
                  style={[styles.colMeta, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {supplierPhone}
                </Text>
              ) : null}
              {supplierAddress ? (
                <Text
                  style={[styles.colMeta, { color: theme.colors.textMuted }]}
                  numberOfLines={2}
                >
                  {supplierAddress}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={[styles.colMeta, { color: theme.colors.textSubtle }]}>
              —
            </Text>
          )}
        </Card>

        <Card style={styles.col}>
          <View style={styles.colHeader}>
            <View
              style={[
                styles.colIcon,
                { backgroundColor: theme.colors.info + '15' },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={theme.colors.info}
              />
            </View>
            <Text style={[styles.colTitle, { color: theme.colors.text }]}>
              Order details
            </Text>
          </View>

          <View style={styles.colBody}>
            <MiniRow label="PO number" value={po.poNo} />
            <MiniRow
              label="Created"
              value={formatDateTime(po.createdAt)}
            />
            {po.sentAt ? (
              <MiniRow label="Sent" value={formatDateTime(po.sentAt)} />
            ) : null}
            {po.receivedAt ? (
              <MiniRow
                label="Received"
                value={formatDateTime(po.receivedAt)}
              />
            ) : null}
            <MiniRow label="Lines" value={String(po.items?.length ?? 0)} />
            <MiniRow label="Total units" value={String(totalQty)} />
            <View
              style={[
                styles.miniRow,
                { borderTopWidth: 1, borderTopColor: theme.colors.border },
              ]}
            >
              <Text
                style={[styles.miniLabel, { color: theme.colors.textMuted }]}
              >
                Total
              </Text>
              <Text
                style={[styles.miniValueBold, { color: theme.colors.text }]}
              >
                {formatMoney(po.total, 'KES')}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {po.notes ? (
        <Card style={styles.section} header="Notes">
          <Text style={[styles.notesText, { color: theme.colors.textMuted }]}>
            {po.notes}
          </Text>
        </Card>
      ) : null}

      <Card style={styles.section} header="Items">
        {!po.items?.length ? (
          <EmptyState
            icon={
              <Ionicons
                name="cube-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title="No items"
            description="This purchase order has no lines."
          />
        ) : (
          <View style={styles.itemsList}>
            {po.items.map((item: PurchaseOrderItem, i) => {
              const drug = drugs[item.drugId];
              return (
                <View key={i} style={styles.item}>
                  <View style={styles.itemLeft}>
                    <Text
                      style={[styles.itemName, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {drug?.name ?? 'Unknown drug'}
                      {drug?.strength ? ` ${drug.strength}` : ''}
                    </Text>
                    <Text
                      style={[styles.itemMeta, { color: theme.colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {[drug?.generic, drug?.form, drug?.unit]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </Text>
                  </View>

                  <View style={styles.itemRight}>
                    <Text
                      style={[styles.itemQty, { color: theme.colors.text }]}
                    >
                      ×{item.qty}
                    </Text>
                    <Text
                      style={[styles.itemCost, { color: theme.colors.textMuted }]}
                    >
                      @ {formatMoney(item.costPrice, 'KES')}
                    </Text>
                    <Text
                      style={[styles.itemTotal, { color: theme.colors.text }]}
                    >
                      {formatMoney(item.total, 'KES')}
                    </Text>
                  </View>
                </View>
              );
            })}

            <Divider style={styles.divider} />

            <View style={styles.totalRow}>
              <Text
                style={[styles.totalLabel, { color: theme.colors.textMuted }]}
              >
                Subtotal
              </Text>
              <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                {formatMoney(po.subtotal, 'KES')}
              </Text>
            </View>

            {po.tax > 0 ? (
              <View style={styles.totalRow}>
                <Text
                  style={[styles.totalLabel, { color: theme.colors.textMuted }]}
                >
                  Tax
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                  {formatMoney(po.tax, 'KES')}
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.grandRow,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.grandLabel, { color: theme.colors.text }]}>
                Total
              </Text>
              <Text style={[styles.grandValue, { color: theme.colors.text }]}>
                {formatMoney(po.total, 'KES')}
              </Text>
            </View>
          </View>
        )}
      </Card>

      <View style={styles.bottomPad} />

      <Modal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        title="Receive stock"
        size="md"
        busy={receiveSubmitting}
        footer={
          <>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setReceiveOpen(false)}
              disabled={receiveSubmitting}
            />
            <Button
              title={`Receive ${receiveLines.length} line${receiveLines.length === 1 ? '' : 's'}`}
              onPress={submitReceive}
              loading={receiveSubmitting}
              leftIcon={
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color="#ffffff"
                />
              }
            />
          </>
        }
      >
        <Alert variant="info" style={styles.alert}>
          Receiving creates a stock batch per line and logs a movement. Expiry
          is required for every line.
        </Alert>

        <View style={styles.receiveList}>
          {receiveLines.map((line, idx) => (
            <View
              key={line.drugId}
              style={[
                styles.receiveCard,
                {
                  backgroundColor: theme.colors.surface2,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.receiveHeader}>
                <View style={styles.receiveHeaderLeft}>
                  <Text
                    style={[styles.receiveName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {line.drugName}
                  </Text>
                  <Text
                    style={[
                      styles.receiveMeta,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Ordered: {line.orderedQty}
                  </Text>
                </View>
                <Badge variant="neutral">Line {idx + 1}</Badge>
              </View>

              <FormField label="Qty received" required>
                <Input
                  value={line.qty}
                  onChangeText={(v) => patchLine(idx, 'qty', v)}
                  keyboardType="numeric"
                  editable={!receiveSubmitting}
                />
              </FormField>

              <FormField label="Cost price" required>
                <Input
                  value={line.costPrice}
                  onChangeText={(v) => patchLine(idx, 'costPrice', v)}
                  keyboardType="decimal-pad"
                  editable={!receiveSubmitting}
                />
              </FormField>

              <FormField label="Selling price">
                <Input
                  value={line.sellingPrice}
                  onChangeText={(v) => patchLine(idx, 'sellingPrice', v)}
                  keyboardType="decimal-pad"
                  placeholder="Inherit"
                  editable={!receiveSubmitting}
                />
              </FormField>

              <FormField label="Lot number">
                <Input
                  value={line.lotNo}
                  onChangeText={(v) => patchLine(idx, 'lotNo', v)}
                  placeholder="e.g. LOT-2026-A12"
                  editable={!receiveSubmitting}
                />
              </FormField>

              <FormField label="Expiry date" required hint="Format: YYYY-MM-DD">
                <Input
                  value={line.expiryDate}
                  onChangeText={(v) => patchLine(idx, 'expiryDate', v)}
                  placeholder="2027-12-31"
                  editable={!receiveSubmitting}
                />
              </FormField>
            </View>
          ))}
        </View>
      </Modal>

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'send'
            ? `Send ${po.poNo} to the supplier?`
            : danger?.kind === 'hard-delete'
            ? `Permanently delete ${po.poNo}?`
            : `Cancel ${po.poNo}?`
        }
        description={
          danger?.kind === 'send'
            ? `This will notify ${supplierName ?? 'the supplier'} with the order details and move the PO to Sent.`
            : danger?.kind === 'hard-delete'
            ? 'This cannot be undone. Only draft or cancelled POs can be deleted.'
            : 'The PO status changes to cancelled. No stock is affected.'
        }
        confirmLabel={
          danger?.kind === 'send'
            ? 'Send to supplier'
            : danger?.kind === 'hard-delete'
            ? 'Delete permanently'
            : 'Cancel PO'
        }
        variant={danger?.kind === 'send' ? 'primary' : 'danger'}
        loading={busy}
      />
    </Screen>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.miniRow}>
      <Text style={[styles.miniLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[styles.miniValue, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginTop: 16, marginBottom: 16 },
  poNo: { fontSize: 22, fontWeight: '700', fontFamily: 'Courier' },
  subtitle: { fontSize: 13, marginTop: 4 },
  headerBadges: { marginTop: 10, flexDirection: 'row' },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  alert: { marginBottom: 12 },
  twoCol: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  col: { flexGrow: 1, flexBasis: '47%', minWidth: 140 },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  colIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colTitle: { fontSize: 14, fontWeight: '600' },
  colBody: { gap: 6 },
  colValue: { fontSize: 14, fontWeight: '600' },
  colMeta: { fontSize: 12 },
  miniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  miniLabel: { fontSize: 12 },
  miniValue: { fontSize: 12, fontWeight: '500', flexShrink: 1 },
  miniValueBold: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  section: { marginBottom: 16 },
  notesText: { fontSize: 13, lineHeight: 19 },
  itemsList: { gap: 6 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  itemLeft: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 13, fontWeight: '500' },
  itemMeta: { fontSize: 11, marginTop: 3 },
  itemRight: { alignItems: 'flex-end', gap: 2 },
  itemQty: { fontSize: 13, fontWeight: '600' },
  itemCost: { fontSize: 10 },
  itemTotal: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  divider: { marginVertical: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 13 },
  totalValue: { fontSize: 13, fontWeight: '500' },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 8,
  },
  grandLabel: { fontSize: 15, fontWeight: '600' },
  grandValue: { fontSize: 16, fontWeight: '700' },
  receiveList: { gap: 12 },
  receiveCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  receiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  receiveHeaderLeft: { flex: 1, minWidth: 0 },
  receiveName: { fontSize: 13, fontWeight: '600' },
  receiveMeta: { fontSize: 11, marginTop: 2 },
  bottomPad: { height: 24 },
});