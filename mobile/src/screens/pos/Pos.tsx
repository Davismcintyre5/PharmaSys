import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Button,
  Alert,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useBranch } from '@/context/BranchProvider';
import { useCart } from '@/context/CartProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { saleApi } from '@/api/axios';
import { DrugGrid } from './_DrugGrid';
import { CartPanel } from './_CartPanel';
import { PaymentSuccess } from './_PaymentSuccess';
import type { Drug, Sale, SalePaymentMethod } from '@/types';

type CartLine = {
  drug: Drug;
  qty: number;
  unitPrice: number;
};

export default function Pos() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();
  const { branches, currentBranch } = useBranch();

  const {
    items: contextItems,
    addItem,
    updateQty,
    removeItem,
    clear,
    subtotal,
    taxTotal,
    discount,
    discountAmount,
    grandTotal,
    itemCount,
    isEmpty,
    paymentMethod,
    setPaymentMethod,
    setDiscount,
    note,
    setNote,
    patient,
    setPatient,
    prescription,
    setPrescription,
    customerId,
    customerName,
    setCustomer,
  } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const lines: CartLine[] = useMemo(
    () =>
      contextItems
        .map((ci) => {
          // Reconstruct a minimal Drug shape from the cart item
          const drug: Drug = {
            _id: ci.drugId,
            tenantId: '',
            name: ci.drugName,
            generic: null,
            brand: null,
            barcode: null,
            category: null,
            form: 'tablet',
            strength: null,
            unit: 'pcs',
            taxRate: ci.taxRate,
            reorderLevel: 0,
            prescriptionRequired: false,
            controlled: false,
            imagePublicId: null,
            imageUrl: null,
            isActive: true,
            createdAt: '',
            currentQty: ci.availableQty,
            lastSellingPrice: ci.unitPrice,
          };
          return {
            drug,
            qty: ci.qty,
            unitPrice: ci.unitPrice,
          };
        }),
    [contextItems]
  );

  function handleAddDrug(drug: Drug) {
    if ((drug.currentQty ?? 0) <= 0) {
      toast.error(`${drug.name} is out of stock`);
      return;
    }
    if (drug.controlled) {
      toast.error('Controlled substances cannot be sold from POS');
      return;
    }

    const existing = contextItems.find((ci) => ci.drugId === drug._id);
    const unitPrice =
      existing?.unitPrice ?? drug.lastSellingPrice ?? 0;

    const nextQty = existing ? existing.qty + 1 : 1;

    if (nextQty > (drug.currentQty ?? 0)) {
      toast.error(`Only ${drug.currentQty} in stock`);
      return;
    }

    addItem({
      drugId: drug._id,
      drugName: drug.name,
      batchId: 'default',
      lotNo: null,
      unitPrice,
      qty: 1,
      discount: 0,
      taxRate: drug.taxRate ?? 0,
      lineTotal: unitPrice,
      expiryDate: new Date(
        Date.now() + 365 * 86_400_000
      ).toISOString(),
      availableQty: drug.currentQty ?? 0,
    });
  }

  function handleQtyChange(drugId: string, qty: number) {
    updateQty(drugId, 'default', qty);
  }

  function handlePriceChange(drugId: string, price: number) {
    const existing = contextItems.find((ci) => ci.drugId === drugId);
    if (!existing) return;
    removeItem(drugId, 'default');
    addItem({
      ...existing,
      unitPrice: Math.max(0, price),
      lineTotal: Math.max(0, price) * existing.qty,
    });
  }

  function handleRemove(drugId: string) {
    removeItem(drugId, 'default');
  }

  function handleClear() {
    clear();
  }

  function handleSetPatient(p: typeof patient) {
    setPatient(p);
  }

  function handleSetPrescription(p: typeof prescription) {
    setPrescription(p);
  }

  function handleSetCustomer(id: string | null, name: string | null) {
    setCustomer(id, name);
  }

  async function handleSubmit() {
    if (!contextItems.length) {
      toast.error('Cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      const sale = await saleApi.create({
        items: contextItems.map((ci) => ({
          drugId: ci.drugId,
          qty: ci.qty,
          unitPrice: ci.unitPrice,
          discount: ci.discount,
        })),
        customerId: customerId ?? undefined,
        patientId: patient?._id ?? undefined,
        prescriptionId: prescription?._id ?? undefined,
        paymentMethod,
        discount: discountAmount,
        note: note.trim() || undefined,
      });

      setCompletedSale(sale);
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (e: any) {
      toast.error(e?.message || 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewSale() {
    clear();
    setCompletedSale(null);
  }

  function handleCloseSuccess() {
    clear();
    setCompletedSale(null);
    navigation.goBack();
  }

  const receiptBranch = branches.length > 1 ? currentBranch : null;

  return (
    <Screen scroll={false} padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.flex}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Point of sale
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {tenant?.name ?? 'Pharmacy'}
              {receiptBranch ? ` · ${receiptBranch.name}` : ''}
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.navigate('SaleDetail', { saleId: '' })}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={theme.colors.textMuted}
            />
          </Pressable>
        </View>

        <View style={styles.panels}>
          <View style={styles.gridPanel}>
            <DrugGrid
              onPick={handleAddDrug}
              cartDrugIds={contextItems.map((i) => i.drugId)}
            />
          </View>

          <View style={styles.cartPanel}>
            <CartPanel
              lines={lines}
              patient={patient}
              customerId={customerId}
              customerName={customerName}
              prescription={prescription}
              discount={discount}
              paymentMethod={paymentMethod}
              note={note}
              subtotal={subtotal}
              taxTotal={taxTotal}
              discountAmount={discountAmount}
              grandTotal={grandTotal}
              itemCount={itemCount}
              isEmpty={isEmpty}
              submitting={submitting}
              onQtyChange={handleQtyChange}
              onPriceChange={handlePriceChange}
              onRemove={handleRemove}
              onDiscountChange={setDiscount}
              onPaymentMethodChange={setPaymentMethod}
              onNoteChange={setNote}
              onClear={handleClear}
              onSetPatient={handleSetPatient}
              onSetCustomer={handleSetCustomer}
              onSetPrescription={handleSetPrescription}
              onSubmit={handleSubmit}
            />
          </View>
        </View>

        {completedSale ? (
          <PaymentSuccess
            sale={completedSale}
            businessName={tenant?.name ?? 'Pharmacy'}
            branch={receiptBranch}
            cashierName={user?.fullName}
            customerName={customerName ?? patient?.name ?? null}
            onNewSale={handleNewSale}
            onClose={handleCloseSuccess}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 3 },
  headerBtn: { padding: 6 },
  panels: {
    flex: 1,
    flexDirection: 'column',
  },
  gridPanel: {
    flex: 3,
    paddingHorizontal: 16,
    paddingBottom: 8,
    minHeight: 200,
  },
  cartPanel: {
    flex: 4,
    paddingHorizontal: 16,
    paddingBottom: 16,
    minHeight: 250,
  },
});