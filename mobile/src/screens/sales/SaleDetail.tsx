import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Badge,
  Input,
  FormField,
  Alert,
  Modal,
  Spinner,
  ConfirmDialog,
  Divider,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useBranch } from '@/context/BranchProvider';
import { useToast } from '@/hooks/useToast';
import { saleApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { hasPermission } from '@/utils/permissions';
import { saleStatusLabel } from '@/utils/enums';
import {
  formatMoney,
  formatDateTime,
  formatRelativeTime,
} from '@/utils/format';
import { printReceipt } from '@/utils/receiptHtml';
import { useReceiptBrand } from '@/utils/receiptBrand';
import {
  getCustomerName,
  getPatientName,
  getCashierName,
  getBranchName,
  getBranchAddress,
  getBranchPhone,
  getReceiptCustomerName,
} from '@/utils/saleHelpers';
import type { Sale, SaleItem } from '@/types';

interface Props {
  navigation: any;
  route: { params: { saleId: string } };
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  card: 'Card',
  insurance: 'Insurance',
};

function statusVariant(
  status: string
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

export default function SaleDetail({ navigation, route }: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { branches } = useBranch();
  const receiptBrand = useReceiptBrand();

  const saleId = route.params?.saleId ?? '';
  const canRefund = hasPermission(user?.role, 'sales.refund');

  const saleQuery = useQuery({
    queryKey: queryKeys.sales.detail(saleId),
    queryFn: () => saleApi.get(saleId),
    enabled: Boolean(saleId),
  });

  const sale: Sale | null = saleQuery.data ?? null;

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundItems, setRefundItems] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [danger, setDanger] = useState<{ kind: 'refund' } | null>(null);

  function openRefund() {
    if (!sale) return;
    const initial: Record<number, number> = {};
    sale.items.forEach((_, i) => {
      initial[i] = 0;
    });
    setRefundItems(initial);
    setRefundReason('');
    setRefundOpen(true);
  }

  async function submitRefund() {
    if (submitting || !sale) return;

    const items = Object.entries(refundItems)
      .filter(([, qty]) => qty > 0)
      .map(([idx, qty]) => ({
        saleItemIndex: Number(idx),
        qty,
      }));

    if (!items.length) {
      toast.error('Select at least one item to refund');
      return;
    }

    setSubmitting(true);
    try {
      await saleApi.refund(sale._id, {
        items,
        reason: refundReason.trim() || undefined,
      });
      toast.success('Refund processed');
      setRefundOpen(false);
      setDanger(null);
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
    } catch (e: any) {
      toast.error(e?.message || 'Refund failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePrint() {
    if (!sale || printing) return;
    setPrinting(true);
    try {
      const showBranch = branches.length > 1;

      await printReceipt({
        sale,
        businessName: receiptBrand.businessName,
        logoUrl: receiptBrand.logoUrl,
        storeAddress: receiptBrand.storeAddress,
        headerOverride: receiptBrand.receiptHeader,
        footerOverride: receiptBrand.receiptFooter,
        branchName: showBranch ? getBranchName(sale) : null,
        branchAddress: showBranch ? getBranchAddress(sale) : null,
        branchPhone: showBranch ? getBranchPhone(sale) : null,
        cashierName: getCashierName(sale),
        customerName: getReceiptCustomerName(sale),
        currency: receiptBrand.currency,
      });
    } catch (e: any) {
      toast.error(e?.message || 'Could not print receipt');
    } finally {
      setPrinting(false);
    }
  }

  const totalQty = useMemo(
    () => sale?.items.reduce((s, i) => s + i.qty, 0) ?? 0,
    [sale]
  );

  const refundedTotal = useMemo(
    () =>
      (sale?.returns ?? []).reduce((s, r) => s + (r.refundAmount || 0), 0),
    [sale]
  );

  if (saleQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  if (!sale) {
    return (
      <Screen>
        <Alert variant="danger">Sale not found.</Alert>
      </Screen>
    );
  }

  const customerName = getCustomerName(sale);
  const patientName = getPatientName(sale);
  const cashierName = getCashierName(sale);
  const saleBranchName = getBranchName(sale);
  const showBranchMeta = branches.length > 1 && !!saleBranchName;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.invoice, { color: theme.colors.text }]}>
          Sale {sale.invoiceNo}
        </Text>
        <Text style={[styles.date, { color: theme.colors.textMuted }]}>
          {formatDateTime(sale.createdAt)}
        </Text>

        <View style={styles.headerActions}>
          <Badge variant={statusVariant(sale.status)}>
            {saleStatusLabel(sale.status)}
          </Badge>

          <View style={styles.headerButtons}>
            <Button
              title="Print"
              size="sm"
              variant="outline"
              onPress={handlePrint}
              loading={printing}
              leftIcon={
                <Ionicons
                  name="print-outline"
                  size={14}
                  color={theme.colors.text}
                />
              }
            />

            {canRefund &&
            sale.status !== 'refunded' &&
            sale.status !== 'voided' ? (
              <Button
                title="Refund"
                size="sm"
                variant="outline"
                onPress={openRefund}
                leftIcon={
                  <Ionicons
                    name="arrow-undo-outline"
                    size={14}
                    color={theme.colors.text}
                  />
                }
              />
            ) : null}
          </View>
        </View>
      </View>

      {sale.status === 'refunded' ? (
        <Alert variant="info" style={styles.alert}>
          Fully refunded — {formatMoney(refundedTotal, receiptBrand.currency)}
        </Alert>
      ) : null}

      {sale.status === 'partially_refunded' ? (
        <Alert variant="warning" style={styles.alert}>
          Partially refunded —{' '}
          {formatMoney(refundedTotal, receiptBrand.currency)} returned
        </Alert>
      ) : null}

      <Card style={styles.section}>
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <MetaRow
              icon="card-outline"
              label="Payment method"
              value={PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
            />
            <MetaRow
              icon="checkmark-circle-outline"
              label="Items"
              value={`${sale.items.length} line${sale.items.length === 1 ? '' : 's'} · ${totalQty} unit${totalQty === 1 ? '' : 's'}`}
            />
            <MetaRow
              icon="person-outline"
              label="Served by"
              value={cashierName ?? '—'}
            />
          </View>

          <View style={styles.col}>
            <MetaRow
              icon="people-outline"
              label="Customer"
              value={customerName ?? 'Walk-in'}
            />
            {patientName ? (
              <MetaRow
                icon="medkit-outline"
                label="Patient"
                value={patientName}
              />
            ) : null}
            {showBranchMeta ? (
              <MetaRow
                icon="business-outline"
                label="Branch"
                value={saleBranchName ?? '—'}
              />
            ) : null}
          </View>
        </View>
      </Card>

      <Card style={styles.section} header="Items">
        {!sale.items?.length ? (
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            No items.
          </Text>
        ) : (
          <View style={styles.itemsList}>
            {sale.items.map((item: SaleItem, i) => (
              <View key={i} style={styles.item}>
                <View style={styles.itemLeft}>
                  <Text
                    style={[styles.itemName, { color: theme.colors.text }]}
                    numberOfLines={2}
                  >
                    {item.name ?? 'Item'}
                  </Text>
                  <Text
                    style={[styles.itemMeta, { color: theme.colors.textMuted }]}
                  >
                    {formatMoney(item.unitPrice, receiptBrand.currency)} ×{' '}
                    {item.qty}
                  </Text>
                </View>
                <Text style={[styles.itemTotal, { color: theme.colors.text }]}>
                  {formatMoney(item.total, receiptBrand.currency)}
                </Text>
              </View>
            ))}

            <Divider style={styles.divider} />

            <View style={styles.totalRow}>
              <Text
                style={[styles.totalLabel, { color: theme.colors.textMuted }]}
              >
                Subtotal
              </Text>
              <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                {formatMoney(sale.subtotal, receiptBrand.currency)}
              </Text>
            </View>

            {sale.tax > 0 ? (
              <View style={styles.totalRow}>
                <Text
                  style={[styles.totalLabel, { color: theme.colors.textMuted }]}
                >
                  Tax
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                  {formatMoney(sale.tax, receiptBrand.currency)}
                </Text>
              </View>
            ) : null}

            {sale.discount > 0 ? (
              <View style={styles.totalRow}>
                <Text
                  style={[styles.totalLabel, { color: theme.colors.textMuted }]}
                >
                  Discount
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                  -{formatMoney(sale.discount, receiptBrand.currency)}
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.grandRow,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <Text
                style={[styles.grandLabel, { color: theme.colors.text }]}
              >
                Total
              </Text>
              <Text
                style={[styles.grandValue, { color: theme.colors.text }]}
              >
                {formatMoney(sale.grandTotal, receiptBrand.currency)}
              </Text>
            </View>
          </View>
        )}
      </Card>

      {sale.returns?.length ? (
        <Card style={styles.section} header="Refund history">
          <View style={styles.returns}>
            {sale.returns.map((r) => (
              <View
                key={r._id}
                style={[
                  styles.refundCard,
                  {
                    backgroundColor: theme.colors.surface2,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.refundHeader}>
                  <Text
                    style={[
                      styles.refundTime,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {formatRelativeTime(r.processedAt ?? r.createdAt)}
                  </Text>
                  <Text
                    style={[
                      styles.refundAmount,
                      { color: theme.colors.danger },
                    ]}
                  >
                    -{formatMoney(r.refundAmount, receiptBrand.currency)}
                  </Text>
                </View>
                {r.reason ? (
                  <Text
                    style={[
                      styles.refundReason,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Reason: {r.reason}
                  </Text>
                ) : null}
                <Text
                  style={[
                    styles.refundMeta,
                    { color: theme.colors.textSubtle },
                  ]}
                >
                  {r.items.length} item{r.items.length === 1 ? '' : 's'} ·{' '}
                  {r.status}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Modal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title="Process refund"
        size="md"
        busy={submitting}
        footer={
          <>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setRefundOpen(false)}
              disabled={submitting}
            />
            <Button
              title="Refund selected"
              variant="danger"
              onPress={() => setDanger({ kind: 'refund' })}
              disabled={submitting}
            />
          </>
        }
      >
        <Alert variant="warning" style={styles.alert}>
          Refunding returns the item to stock and marks the sale as partially or
          fully refunded.
        </Alert>

        <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
          Items to refund
        </Text>

        <View style={styles.refundItems}>
          {sale.items.map((item, i) => (
            <View
              key={i}
              style={[
                styles.refundRow,
                {
                  backgroundColor: theme.colors.surface2,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.refundRowLeft}>
                <Text
                  style={[
                    styles.refundRowName,
                    { color: theme.colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {item.name ?? `Item ${i + 1}`}
                </Text>
                <Text
                  style={[
                    styles.refundRowMeta,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {formatMoney(item.unitPrice, receiptBrand.currency)} · bought{' '}
                  {item.qty}
                </Text>
              </View>
              <Input
                value={String(refundItems[i] ?? 0)}
                onChangeText={(v) => {
                  const n = Math.max(
                    0,
                    Math.min(item.qty, Number(v) || 0)
                  );
                  setRefundItems((prev) => ({ ...prev, [i]: n }));
                }}
                keyboardType="numeric"
                containerStyle={styles.refundInput}
                textAlign="center"
              />
            </View>
          ))}
        </View>

        <FormField label="Reason (optional)">
          <Input
            value={refundReason}
            onChangeText={setRefundReason}
            placeholder="Customer changed mind"
            editable={!submitting}
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        open={danger?.kind === 'refund'}
        onClose={() => setDanger(null)}
        onConfirm={submitRefund}
        title="Confirm refund"
        description="This will return the selected items to stock and mark the sale as refunded or partially refunded. This cannot be undone."
        confirmLabel="Process refund"
        variant="danger"
        loading={submitting}
      />
    </Screen>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={14} color={theme.colors.textMuted} />
      <View style={styles.metaText}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginTop: 16, marginBottom: 16 },
  invoice: { fontSize: 22, fontWeight: '700' },
  date: { fontSize: 13, marginTop: 4 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  headerButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  alert: { marginBottom: 12 },
  section: { marginBottom: 16 },
  twoCol: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  col: { flexGrow: 1, flexBasis: '47%', gap: 12, minWidth: 140 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  metaText: { flex: 1, minWidth: 0 },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: { fontSize: 13, fontWeight: '500', marginTop: 3 },
  emptyText: { fontSize: 13 },
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
  itemTotal: { fontSize: 13, fontWeight: '600' },
  divider: { marginVertical: 10 },
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
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
  },
  grandLabel: { fontSize: 15, fontWeight: '600' },
  grandValue: { fontSize: 16, fontWeight: '700' },
  returns: { gap: 10 },
  refundCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  refundTime: { fontSize: 12 },
  refundAmount: { fontSize: 14, fontWeight: '700' },
  refundReason: { fontSize: 12, marginTop: 6 },
  refundMeta: { fontSize: 11, marginTop: 4 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  refundItems: { gap: 8, marginBottom: 16 },
  refundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  refundRowLeft: { flex: 1, minWidth: 0 },
  refundRowName: { fontSize: 13, fontWeight: '500' },
  refundRowMeta: { fontSize: 11, marginTop: 3 },
  refundInput: { width: 70 },
});