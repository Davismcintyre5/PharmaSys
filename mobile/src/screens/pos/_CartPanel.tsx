import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, EmptyState } from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { formatMoney } from '@/utils/format';
import { PatientPicker } from './_PatientPicker';
import { CustomerPicker } from './_CustomerPicker';
import { PrescriptionPicker } from './_PrescriptionPicker';
import type {
  Patient,
  Prescription,
  SalePaymentMethod,
  Drug,
} from '@/types';

type CartLine = {
  drug: Drug;
  qty: number;
  unitPrice: number;
};

interface Props {
  lines: CartLine[];
  patient: Patient | null;
  customerId: string | null;
  customerName: string | null;
  prescription: Prescription | null;
  discount: number;
  paymentMethod: SalePaymentMethod;
  note: string;
  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  grandTotal: number;
  itemCount: number;
  isEmpty: boolean;
  submitting: boolean;
  onQtyChange: (drugId: string, qty: number) => void;
  onPriceChange: (drugId: string, price: number) => void;
  onRemove: (drugId: string) => void;
  onDiscountChange: (n: number) => void;
  onPaymentMethodChange: (m: SalePaymentMethod) => void;
  onNoteChange: (s: string) => void;
  onClear: () => void;
  onSetPatient: (p: Patient | null) => void;
  onSetCustomer: (id: string | null, name: string | null) => void;
  onSetPrescription: (p: Prescription | null) => void;
  onSubmit: () => void;
}

const PAYMENT_METHODS: Array<{ value: SalePaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'card', label: 'Card' },
  { value: 'insurance', label: 'Insurance' },
];

export function CartPanel({
  lines,
  patient,
  customerId,
  customerName,
  prescription,
  discount,
  paymentMethod,
  note,
  subtotal,
  taxTotal,
  discountAmount,
  grandTotal,
  itemCount,
  isEmpty,
  submitting,
  onQtyChange,
  onPriceChange,
  onRemove,
  onDiscountChange,
  onPaymentMethodChange,
  onNoteChange,
  onClear,
  onSetPatient,
  onSetCustomer,
  onSetPrescription,
  onSubmit,
}: Props) {
  const { theme } = useTheme();
  const [showCustomer, setShowCustomer] = useState(false);
  const [showPatient, setShowPatient] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showNote, setShowNote] = useState(Boolean(note));

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
        style={[styles.attachRow, { borderBottomColor: theme.colors.border }]}
      >
        {customerName ? (
          <AttachChip
            icon="person-outline"
            label={customerName}
            onRemove={() => onSetCustomer(null, null)}
          />
        ) : (
          <Pressable
            onPress={() => setShowCustomer(true)}
            style={styles.attachBtn}
          >
            <Ionicons
              name="person-outline"
              size={12}
              color={theme.colors.textMuted}
            />
            <Text
              style={[styles.attachText, { color: theme.colors.textMuted }]}
            >
              Customer
            </Text>
          </Pressable>
        )}

        {patient ? (
          <AttachChip
            icon="medkit-outline"
            label={patient.name}
            onRemove={() => onSetPatient(null)}
          />
        ) : (
          <Pressable
            onPress={() => setShowPatient(true)}
            style={styles.attachBtn}
          >
            <Ionicons
              name="medkit-outline"
              size={12}
              color={theme.colors.textMuted}
            />
            <Text
              style={[styles.attachText, { color: theme.colors.textMuted }]}
            >
              Patient
            </Text>
          </Pressable>
        )}

        {prescription ? (
          <AttachChip
            icon="document-text-outline"
            label={
              prescription.refNo ??
              String(prescription._id).slice(-6).toUpperCase()
            }
            onRemove={() => onSetPrescription(null)}
          />
        ) : (
          <Pressable
            onPress={() => setShowPrescription(true)}
            style={styles.attachBtn}
          >
            <Ionicons
              name="document-text-outline"
              size={12}
              color={theme.colors.textMuted}
            />
            <Text
              style={[styles.attachText, { color: theme.colors.textMuted }]}
            >
              Rx
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isEmpty ? (
          <EmptyState
            icon={
              <Ionicons
                name="cart-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title="Cart is empty"
            description="Search or tap a drug to add it to the sale."
          />
        ) : (
          <View style={styles.lines}>
            {lines.map((line) => (
              <CartRow
                key={line.drug._id}
                line={line}
                onQtyChange={(q) => onQtyChange(line.drug._id, q)}
                onPriceChange={(p) => onPriceChange(line.drug._id, p)}
                onRemove={() => onRemove(line.drug._id)}
              />
            ))}
          </View>
        )}

        <View style={styles.noteRow}>
          <Pressable
            onPress={() => setShowNote((v) => !v)}
            style={styles.noteToggle}
          >
            <Ionicons
              name={showNote ? 'remove-circle-outline' : 'add-circle-outline'}
              size={12}
              color={theme.colors.primary}
            />
            <Text style={[styles.noteToggleText, { color: theme.colors.primary }]}>
              {showNote ? 'Hide note' : 'Add note'}
            </Text>
          </Pressable>
        </View>

        {showNote ? (
          <TextInput
            value={note}
            onChangeText={onNoteChange}
            placeholder="Optional note about this sale…"
            placeholderTextColor={theme.colors.textSubtle}
            multiline
            style={[
              styles.noteInput,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
              },
            ]}
          />
        ) : null}

        <View style={styles.discountRow}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
            Discount
          </Text>
          <TextInput
            value={discount ? String(discount) : ''}
            onChangeText={(v) => onDiscountChange(Number(v) || 0)}
            placeholder="0"
            placeholderTextColor={theme.colors.textSubtle}
            keyboardType="decimal-pad"
            style={[
              styles.discountInput,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
              },
            ]}
          />
        </View>

        <View style={styles.totals}>
          <Row label="Items" value={String(itemCount)} />
          <Row label="Subtotal" value={formatMoney(subtotal, 'KES')} />
          {taxTotal > 0 ? (
            <Row label="Tax" value={formatMoney(taxTotal, 'KES')} />
          ) : null}
          {discountAmount > 0 ? (
            <Row
              label="Discount"
              value={`-${formatMoney(discountAmount, 'KES')}`}
            />
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
              {formatMoney(grandTotal, 'KES')}
            </Text>
          </View>
        </View>

        <View style={styles.paymentWrap}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
            Payment method
          </Text>
          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map((m) => {
              const active = paymentMethod === m.value;
              return (
                <Pressable
                  key={m.value}
                  onPress={() => onPaymentMethodChange(m.value)}
                  style={[
                    styles.payPill,
                    {
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.colors.surface2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.payPillText,
                      {
                        color: active ? '#ffffff' : theme.colors.textMuted,
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { borderTopColor: theme.colors.border }]}
      >
        <Button
          title="Clear"
          variant="ghost"
          onPress={onClear}
          disabled={isEmpty || submitting}
        />
        <View style={styles.footerRight}>
          <Button
            title={`Pay ${formatMoney(grandTotal, 'KES')}`}
            onPress={onSubmit}
            loading={submitting}
            disabled={isEmpty}
            size="lg"
          />
        </View>
      </View>

      {showCustomer ? (
        <CustomerPicker
          onClose={() => setShowCustomer(false)}
          onPick={(c) => {
            onSetCustomer(c._id, c.name);
            setShowCustomer(false);
          }}
        />
      ) : null}

      {showPatient ? (
        <PatientPicker
          onClose={() => setShowPatient(false)}
          onPick={(p) => {
            onSetPatient(p);
            setShowPatient(false);
          }}
        />
      ) : null}

      {showPrescription ? (
        <PrescriptionPicker
          onClose={() => setShowPrescription(false)}
          onPick={(rx) => {
            onSetPrescription(rx);
            setShowPrescription(false);
          }}
        />
      ) : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function AttachChip({
  icon,
  label,
  onRemove,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onRemove: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.chip,
        {
          borderColor: theme.colors.primary + '60',
          backgroundColor: theme.colors.primary + '10',
        },
      ]}
    >
      <Ionicons name={icon} size={11} color={theme.colors.primary} />
      <Text
        style={[styles.chipText, { color: theme.colors.primary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Pressable onPress={onRemove} hitSlop={6}>
        <Ionicons name="close" size={12} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
}

function CartRow({
  line,
  onQtyChange,
  onPriceChange,
  onRemove,
}: {
  line: CartLine;
  onQtyChange: (q: number) => void;
  onPriceChange: (p: number) => void;
  onRemove: () => void;
}) {
  const { theme } = useTheme();
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState(String(line.unitPrice));

  const lineTotal = line.unitPrice * line.qty;

  return (
    <View
      style={[
        styles.cartLine,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.cartLineHeader}>
        <View style={styles.cartLineHeaderLeft}>
          <Text
            style={[styles.cartLineName, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {line.drug.name}
            {line.drug.strength ? ` ${line.drug.strength}` : ''}
          </Text>
          {line.drug.prescriptionRequired ? (
            <View
              style={[
                styles.rxTagSmall,
                { backgroundColor: theme.colors.warning + '20' },
              ]}
            >
              <Text
                style={[styles.rxTextSmall, { color: theme.colors.warning }]}
              >
                Rx
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={onRemove} hitSlop={6}>
          <Ionicons
            name="trash-outline"
            size={14}
            color={theme.colors.danger}
          />
        </Pressable>
      </View>

      <View style={styles.cartLineControls}>
        <View
          style={[
            styles.qtyControl,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Pressable
            onPress={() => onQtyChange(Math.max(1, line.qty - 1))}
            disabled={line.qty <= 1}
            style={styles.qtyBtn}
            hitSlop={4}
          >
            <Ionicons
              name="remove"
              size={12}
              color={theme.colors.textMuted}
            />
          </Pressable>
          <TextInput
            value={String(line.qty)}
            onChangeText={(v) => onQtyChange(Number(v) || 1)}
            keyboardType="numeric"
            style={[styles.qtyInput, { color: theme.colors.text }]}
            textAlign="center"
          />
          <Pressable
            onPress={() => onQtyChange(line.qty + 1)}
            style={styles.qtyBtn}
            hitSlop={4}
          >
            <Ionicons name="add" size={12} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.priceWrap}>
          {editingPrice ? (
            <TextInput
              value={priceDraft}
              onChangeText={setPriceDraft}
              onBlur={() => {
                const p = Number(priceDraft);
                if (Number.isFinite(p) && p >= 0) onPriceChange(p);
                else setPriceDraft(String(line.unitPrice));
                setEditingPrice(false);
              }}
              keyboardType="decimal-pad"
              autoFocus
              style={[
                styles.priceInput,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                },
              ]}
              textAlign="right"
            />
          ) : (
            <Pressable
              onPress={() => {
                setPriceDraft(String(line.unitPrice));
                setEditingPrice(true);
              }}
            >
              <Text
                style={[styles.priceText, { color: theme.colors.textMuted }]}
              >
                {formatMoney(line.unitPrice, 'KES')} × {line.qty}
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={[styles.lineTotal, { color: theme.colors.text }]}>
          {formatMoney(lineTotal, 'KES')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  attachRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attachText: { fontSize: 11, fontWeight: '500' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 4,
    maxWidth: 160,
  },
  chipText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, gap: 12 },
  lines: { gap: 8 },
  cartLine: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  cartLineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  cartLineHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  cartLineName: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  rxTagSmall: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  rxTextSmall: { fontSize: 9, fontWeight: '700' },
  cartLineControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    height: 28,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    width: 36,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 0,
  },
  priceWrap: { flex: 1, alignItems: 'center' },
  priceText: { fontSize: 11 },
  priceInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    minWidth: 70,
  },
  lineTotal: { fontSize: 13, fontWeight: '700' },
  noteRow: { alignItems: 'flex-start' },
  noteToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  noteToggleText: { fontSize: 11, fontWeight: '500' },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    minHeight: 50,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldLabel: { fontSize: 11, fontWeight: '600' },
  discountInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  totals: { gap: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13, fontWeight: '500' },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 6,
  },
  grandLabel: { fontSize: 15, fontWeight: '600' },
  grandValue: { fontSize: 16, fontWeight: '700' },
  paymentWrap: { gap: 8 },
  paymentRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  payPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  payPillText: { fontSize: 11, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  footerRight: { flex: 1, alignItems: 'flex-end' },
});