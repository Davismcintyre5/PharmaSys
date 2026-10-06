import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Button } from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { formatMoney, formatDateTime } from '@/utils/format';
import { printReceipt } from '@/utils/receiptHtml';
import { getReceiptCustomerName } from '@/utils/saleHelpers';
import { useReceiptBrand } from '@/utils/receiptBrand';
import type { Sale, Branch } from '@/types';

interface Props {
  sale: Sale;
  businessName: string;
  branch?: Branch | null;
  cashierName?: string | null;
  customerName?: string | null;
  onNewSale: () => void;
  onClose: () => void;
}

const AUTOPRINT_KEY = 'pharmasys_pos_autoprint';

export function PaymentSuccess({
  sale,
  businessName,
  branch = null,
  cashierName,
  customerName: customerNameProp,
  onNewSale,
  onClose,
}: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const receiptBrand = useReceiptBrand();

  const [autoPrint, setAutoPrint] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AUTOPRINT_KEY)
      .then((v) => setAutoPrint(v === 'true'))
      .catch(() => null);
  }, []);

  async function persistAutoPrint(v: boolean) {
    setAutoPrint(v);
    try {
      await AsyncStorage.setItem(AUTOPRINT_KEY, String(v));
    } catch {}
  }

  const customerName =
    customerNameProp ?? getReceiptCustomerName(sale) ?? null;

  async function handlePrint() {
    if (printing) return;
    setPrinting(true);
    try {
      await printReceipt({
        sale,
        businessName: receiptBrand.businessName || businessName,
        logoUrl: receiptBrand.logoUrl,
        storeAddress: receiptBrand.storeAddress,
        headerOverride: receiptBrand.receiptHeader,
        footerOverride: receiptBrand.receiptFooter,
        branchName: branch?.name ?? null,
        branchAddress: branch?.address ?? null,
        branchPhone: branch?.phone ?? null,
        cashierName,
        customerName,
        currency: receiptBrand.currency,
      });
    } catch (e: any) {
      toast.error(e?.message || 'Could not print receipt');
    } finally {
      setPrinting(false);
    }
  }

  useEffect(() => {
    if (autoPrint) handlePrint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint]);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.colors.success + '20' },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={40}
              color={theme.colors.success}
            />
          </View>

          <Text style={[styles.amount, { color: theme.colors.text }]}>
            {formatMoney(sale.grandTotal, receiptBrand.currency)}
          </Text>
          <Text style={[styles.method, { color: theme.colors.textMuted }]}>
            {sale.paymentMethod === 'cash' ? 'Cash' : sale.paymentMethod}
          </Text>

          <View
            style={[
              styles.summary,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <SummaryRow label="Invoice" value={sale.invoiceNo} />
            <SummaryRow
              label="Date"
              value={formatDateTime(sale.createdAt)}
            />
            {customerName ? (
              <SummaryRow label="Customer" value={customerName} />
            ) : null}
            <SummaryRow
              label="Items"
              value={String(
                sale.items.reduce((s, i) => s + i.qty, 0)
              )}
            />
            <SummaryRow
              label="Total"
              value={formatMoney(sale.grandTotal, receiptBrand.currency)}
              bold
            />
          </View>

          <Pressable
            onPress={handlePrint}
            disabled={printing}
            style={[
              styles.printBtn,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
              },
            ]}
          >
            <Ionicons
              name="print-outline"
              size={16}
              color={theme.colors.text}
            />
            <Text style={[styles.printText, { color: theme.colors.text }]}>
              {printing ? 'Generating…' : 'Print receipt'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => persistAutoPrint(!autoPrint)}
            style={styles.autoprintRow}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: autoPrint
                    ? theme.colors.primary
                    : 'transparent',
                },
              ]}
            >
              {autoPrint ? (
                <Ionicons name="checkmark" size={12} color="#ffffff" />
              ) : null}
            </View>
            <Text
              style={[styles.autoText, { color: theme.colors.textMuted }]}
            >
              Auto-print next time
            </Text>
          </Pressable>

          <View style={styles.actions}>
            <Button
              title="Close"
              variant="ghost"
              onPress={onClose}
              leftIcon={
                <Ionicons
                  name="close"
                  size={14}
                  color={theme.colors.textMuted}
                />
              }
            />
            <Button
              title="New sale"
              onPress={onNewSale}
              leftIcon={
                <Ionicons name="add" size={14} color="#ffffff" />
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.summaryValue,
          {
            color: theme.colors.text,
            fontWeight: bold ? '700' : '500',
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  amount: { fontSize: 28, fontWeight: '700' },
  method: { fontSize: 13, marginTop: 4, textTransform: 'capitalize' },
  summary: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 12, flexShrink: 1, textAlign: 'right' },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    width: '100%',
    justifyContent: 'center',
  },
  printText: { fontSize: 14, fontWeight: '600' },
  autoprintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoText: { fontSize: 12 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    width: '100%',
    justifyContent: 'flex-end',
  },
});