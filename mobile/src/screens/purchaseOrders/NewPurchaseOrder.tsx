import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Input,
  Textarea,
  Select,
  FormField,
  Alert,
  EmptyState,
  Spinner,
  Modal,
} from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { purchaseOrderApi, supplierApi, inventoryApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { formatMoney } from '@/utils/format';
import type { Supplier, Drug } from '@/types';

interface Props {
  navigation: any;
}

interface LineDraft {
  id: string;
  drug: Drug | null;
  qty: string;
  costPrice: string;
}

function newLine(): LineDraft {
  return {
    id: Math.random().toString(36).slice(2),
    drug: null,
    qty: '1',
    costPrice: '',
  };
}

export default function NewPurchaseOrder({ navigation }: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const suppliersQuery = useQuery({
    queryKey: queryKeys.suppliers.list(),
    queryFn: () => supplierApi.list(),
  });

  const suppliers: Supplier[] = useMemo(() => {
    const raw = suppliersQuery.data;
    return Array.isArray(raw) ? raw : ((raw as any)?.items ?? []);
  }, [suppliersQuery.data]);

  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([newLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [drugPickerIndex, setDrugPickerIndex] = useState<number | null>(null);

  function addLine() {
    setLines((prev) => [...prev, newLine()]);
  }

  function removeLine(id: string) {
    setLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)
    );
  }

  function patchLine(id: string, patch: Partial<LineDraft>) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!supplierId) list.push('Pick a supplier');

    const validLines = lines.filter((l) => l.drug);
    if (!validLines.length) list.push('Add at least one drug');

    for (const line of validLines) {
      const q = Number(line.qty);
      if (!Number.isFinite(q) || q <= 0) {
        list.push(`${line.drug!.name}: quantity must be greater than 0`);
      }
      const c = Number(line.costPrice);
      if (line.costPrice === '' || !Number.isFinite(c) || c < 0) {
        list.push(`${line.drug!.name}: enter a cost price`);
      }
    }
    return list;
  }, [supplierId, lines]);

  const valid = errors.length === 0;

  const totals = useMemo(() => {
    const items = lines
      .filter((l) => l.drug)
      .map((l) => {
        const q = Number(l.qty) || 0;
        const c = Number(l.costPrice) || 0;
        return { qty: q, cost: c, subtotal: q * c };
      });
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const units = items.reduce((s, i) => s + i.qty, 0);
    return { subtotal, total: subtotal, units, lineCount: items.length };
  }, [lines]);

  async function submit(sendNow: boolean) {
    setAttempted(true);
    if (!valid) {
      if (errors.length) toast.error(errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      const po = await purchaseOrderApi.create({
        supplierId,
        items: lines
          .filter((l) => l.drug)
          .map((l) => ({
            drugId: l.drug!._id,
            qty: Number(l.qty),
            costPrice: Number(l.costPrice),
            total: Number(l.qty) * Number(l.costPrice),
          })),
        notes: notes.trim() || undefined,
      });

      if (sendNow) {
        try {
          await purchaseOrderApi.send(po._id);
          toast.success('Purchase order sent to supplier');
        } catch (e: any) {
          toast.error(
            `Draft saved, but sending failed: ${e?.message || 'unknown error'}`
          );
        }
      } else {
        toast.success('Draft saved');
      }

      await queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      navigation.replace('PurchaseOrderDetail', {
        purchaseOrderId: po._id,
      });
    } catch (e: any) {
      toast.error(e?.message || 'Could not create purchase order');
    } finally {
      setSubmitting(false);
    }
  }

  const supplierOptions = [
    {
      value: '',
      label: suppliersQuery.isLoading ? 'Loading…' : 'Select a supplier…',
    },
    ...suppliers.map((s) => ({ value: s._id, label: s.name })),
  ];

  return (
    <Screen scroll keyboardAvoid>
      {attempted && !valid && errors.length > 0 ? (
        <Alert variant="warning" style={styles.alert}>
          {errors[0]}
        </Alert>
      ) : null}

      <Card style={styles.section} header="Supplier">
        {suppliersQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            <Spinner />
          </View>
        ) : !suppliers.length ? (
          <EmptyState
            icon={
              <Ionicons
                name="car-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title="No suppliers yet"
            description="Add a supplier from the Suppliers page first."
          />
        ) : (
          <FormField label="Supplier" required>
            <Select
              value={supplierId}
              options={supplierOptions}
              onChange={setSupplierId}
              disabled={submitting}
            />
          </FormField>
        )}
      </Card>

      <Card
        style={styles.section}
        header={`Items (${totals.lineCount} line${totals.lineCount === 1 ? '' : 's'})`}
        footer={
          <Pressable onPress={addLine} style={styles.addLineBtn}>
            <Ionicons name="add" size={16} color={theme.colors.primary} />
            <Text
              style={[styles.addLineText, { color: theme.colors.primary }]}
            >
              Add line
            </Text>
          </Pressable>
        }
      >
        <View style={styles.linesList}>
          {lines.map((line, idx) => (
            <View
              key={line.id}
              style={[
                styles.lineCard,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface2,
                },
              ]}
            >
              <View style={styles.lineHeader}>
                <Text
                  style={[styles.lineIndex, { color: theme.colors.textSubtle }]}
                >
                  Line {idx + 1}
                </Text>
                {lines.length > 1 ? (
                  <Pressable onPress={() => removeLine(line.id)} hitSlop={8}>
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={theme.colors.danger}
                    />
                  </Pressable>
                ) : null}
              </View>

              {line.drug ? (
                <View
                  style={[
                    styles.drugRow,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <View style={styles.drugLeft}>
                    <Text
                      style={[styles.drugName, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {line.drug.name}
                      {line.drug.strength ? ` ${line.drug.strength}` : ''}
                    </Text>
                    <Text
                      style={[
                        styles.drugMeta,
                        { color: theme.colors.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {[line.drug.generic, line.drug.form, line.drug.unit]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => patchLine(line.id, { drug: null })}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={theme.colors.textSubtle}
                    />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setDrugPickerIndex(idx)}
                  style={({ pressed }) => [
                    styles.pickDrugBtn,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: pressed
                        ? theme.colors.surface
                        : theme.colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={14}
                    color={theme.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.pickDrugText,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Pick a drug
                  </Text>
                </Pressable>
              )}

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <FormField label="Quantity" required>
                    <Input
                      value={line.qty}
                      onChangeText={(v) => patchLine(line.id, { qty: v })}
                      keyboardType="numeric"
                      placeholder="1"
                      editable={!submitting}
                    />
                  </FormField>
                </View>
                <View style={styles.gridCol}>
                  <FormField label="Cost price" required>
                    <Input
                      value={line.costPrice}
                      onChangeText={(v) =>
                        patchLine(line.id, { costPrice: v })
                      }
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      editable={!submitting}
                    />
                  </FormField>
                </View>
              </View>

              <View
                style={[
                  styles.lineTotalRow,
                  { borderTopColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.lineTotalLabel,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  Line total
                </Text>
                <Text
                  style={[styles.lineTotalValue, { color: theme.colors.text }]}
                >
                  {formatMoney(
                    (Number(line.qty) || 0) * (Number(line.costPrice) || 0),
                    'KES'
                  )}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.section} header="Notes">
        <FormField
          label="Delivery instructions"
          hint="Optional — payment terms, delivery location, etc."
        >
          <Textarea
            value={notes}
            onChangeText={setNotes}
            placeholder="Deliver to Main Branch by Friday. Invoice on delivery."
            editable={!submitting}
          />
        </FormField>
      </Card>

      <Card style={styles.section} header="Summary">
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
            Lines
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
            {totals.lineCount}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
            Total units
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
            {totals.units}
          </Text>
        </View>
        <View
          style={[styles.grandRow, { borderTopColor: theme.colors.border }]}
        >
          <Text style={[styles.grandLabel, { color: theme.colors.text }]}>
            Total
          </Text>
          <Text style={[styles.grandValue, { color: theme.colors.text }]}>
            {formatMoney(totals.total, 'KES')}
          </Text>
        </View>
      </Card>

      <View style={styles.actionsWrap}>
        <Button
          title="Save as draft"
          variant="outline"
          onPress={() => submit(false)}
          loading={submitting}
          disabled={submitting}
          fullWidth
          leftIcon={
            <Ionicons
              name="document-outline"
              size={16}
              color={theme.colors.text}
            />
          }
        />
        <Button
          title="Save & send"
          onPress={() => submit(true)}
          loading={submitting}
          disabled={submitting}
          fullWidth
          leftIcon={<Ionicons name="send-outline" size={16} color="#ffffff" />}
        />
      </View>

      <DrugPickerModal
        open={drugPickerIndex !== null}
        onClose={() => setDrugPickerIndex(null)}
        onPick={(d) => {
          if (drugPickerIndex !== null) {
            const line = lines[drugPickerIndex];
            if (line) {
              const pref = line.costPrice
                ? line.costPrice
                : d.lastCostPrice
                ? String(d.lastCostPrice)
                : '';
              patchLine(line.id, { drug: d, costPrice: pref });
            }
          }
          setDrugPickerIndex(null);
        }}
      />

      <View style={styles.bottomPad} />
    </Screen>
  );
}

function DrugPickerModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (d: Drug) => void;
}) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);

  const listQuery = useQuery({
    queryKey: ['drugs', 'po-picker', debounced],
    queryFn: () =>
      inventoryApi.drugs.list(
        debounced ? { search: debounced } : { limit: 50 }
      ),
    enabled: open,
  });

  const results: Drug[] = useMemo(() => {
    const raw = listQuery.data;
    const arr = Array.isArray(raw) ? raw : ((raw as any)?.items ?? []);
    return arr.slice(0, 40);
  }, [listQuery.data]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pick a drug"
      size="md"
      footer={<Button title="Cancel" variant="ghost" onPress={onClose} />}
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or generic…"
        leftIcon={
          <Ionicons
            name="search"
            size={14}
            color={theme.colors.textSubtle}
          />
        }
        autoFocus
      />

      <View style={styles.pickerList}>
        {listQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            <Spinner />
          </View>
        ) : !results.length ? (
          <EmptyState
            icon={
              <Ionicons
                name="cube-outline"
                size={20}
                color={theme.colors.textMuted}
              />
            }
            title={query ? 'No matches' : 'No drugs'}
            description={
              query
                ? 'Try a different name.'
                : 'Add drugs from the Inventory page first.'
            }
          />
        ) : (
          results.map((d) => (
            <Pressable
              key={d._id}
              onPress={() => onPick(d)}
              style={({ pressed }) => [
                styles.pickerRow,
                {
                  backgroundColor: pressed
                    ? theme.colors.surface2
                    : 'transparent',
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.pickerRowLeft}>
                <Text
                  style={[styles.pickerName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {d.name}
                  {d.strength ? ` ${d.strength}` : ''}
                </Text>
                <Text
                  style={[
                    styles.pickerMeta,
                    { color: theme.colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {[d.generic, d.form, d.unit].filter(Boolean).join(' · ') ||
                    '—'}
                </Text>
              </View>
              {d.currentQty !== undefined ? (
                <Text
                  style={[
                    styles.pickerStock,
                    { color: theme.colors.textSubtle },
                  ]}
                >
                  {d.currentQty} in stock
                </Text>
              ) : null}
            </Pressable>
          ))
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  alert: { marginBottom: 12 },
  section: { marginBottom: 16 },
  loadingWrap: { paddingVertical: 32, alignItems: 'center' },
  addLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  addLineText: { fontSize: 13, fontWeight: '600' },
  linesList: { gap: 12 },
  lineCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  lineIndex: { fontSize: 11, fontWeight: '600' },
  drugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  drugLeft: { flex: 1, minWidth: 0 },
  drugName: { fontSize: 13, fontWeight: '600' },
  drugMeta: { fontSize: 11, marginTop: 3 },
  pickDrugBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
  },
  pickDrugText: { fontSize: 13, fontWeight: '500' },
  gridRow: { flexDirection: 'row', gap: 12 },
  gridCol: { flex: 1 },
  lineTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 8,
  },
  lineTotalLabel: { fontSize: 12 },
  lineTotalValue: { fontSize: 13, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 13, fontWeight: '500' },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 8,
  },
  grandLabel: { fontSize: 15, fontWeight: '600' },
  grandValue: { fontSize: 16, fontWeight: '700' },
  actionsWrap: { gap: 8, marginTop: 8, marginBottom: 16 },
  pickerList: {
    marginTop: 12,
    maxHeight: 360,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.3)',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerRowLeft: { flex: 1, minWidth: 0 },
  pickerName: { fontSize: 14, fontWeight: '500' },
  pickerMeta: { fontSize: 12, marginTop: 2 },
  pickerStock: { fontSize: 10 },
  bottomPad: { height: 24 },
});