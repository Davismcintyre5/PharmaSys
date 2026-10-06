import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Input,
  Select,
  FormField,
  Switch,
  Alert,
} from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { inventoryApi, supplierApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { DRUG_CATEGORIES, DRUG_FORMS, DRUG_FORM_LABELS } from '@/utils/constants';
import type { Drug, DrugForm as DrugFormType, DrugPayload } from '@/types';

interface Props {
  navigation: any;
  route: { params?: { drugId?: string; mode?: 'create' | 'edit' | 'restock' } };
}

interface FormState {
  name: string;
  generic: string;
  brand: string;
  barcode: string;
  category: string;
  form: DrugFormType;
  strength: string;
  unit: string;
  taxRate: string;
  reorderLevel: string;
  prescriptionRequired: boolean;
  controlled: boolean;

  initQty: string;
  initExpiryDate: string;
  initCostPrice: string;
  initSellingPrice: string;
  initLotNo: string;
  initSupplierId: string;
}

const EMPTY: FormState = {
  name: '',
  generic: '',
  brand: '',
  barcode: '',
  category: '',
  form: 'tablet',
  strength: '',
  unit: 'pcs',
  taxRate: '0',
  reorderLevel: '10',
  prescriptionRequired: false,
  controlled: false,

  initQty: '',
  initExpiryDate: '',
  initCostPrice: '',
  initSellingPrice: '',
  initLotNo: '',
  initSupplierId: '',
};

function fromDrug(d: Drug): FormState {
  return {
    ...EMPTY,
    name: d.name || '',
    generic: d.generic || '',
    brand: d.brand || '',
    barcode: d.barcode || '',
    category: d.category || '',
    form: (d.form as DrugFormType) || 'tablet',
    strength: d.strength || '',
    unit: d.unit || 'pcs',
    taxRate: String(d.taxRate ?? 0),
    reorderLevel: String(d.reorderLevel ?? 10),
    prescriptionRequired: !!d.prescriptionRequired,
    controlled: !!d.controlled,
  };
}

export default function DrugForm({ navigation, route }: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const drugId = route.params?.drugId;
  const mode = route.params?.mode ?? (drugId ? 'edit' : 'create');
  const isEdit = mode === 'edit';
  const isRestock = mode === 'restock';
  const isCreate = mode === 'create';

  const drugQuery = useQuery({
    queryKey: queryKeys.inventory.drug(drugId ?? ''),
    queryFn: () => inventoryApi.drugs.get(drugId!),
    enabled: Boolean(drugId),
  });

  const suppliersQuery = useQuery({
    queryKey: queryKeys.suppliers.list(),
    queryFn: () => supplierApi.list(),
    enabled: isCreate || isRestock,
  });

  const suppliers = useMemo(() => {
    const raw = suppliersQuery.data;
    return Array.isArray(raw) ? raw : ((raw as any)?.items ?? []);
  }, [suppliersQuery.data]);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showStock, setShowStock] = useState(!isEdit);

  React.useEffect(() => {
    if (isEdit && drugQuery.data) {
      const raw = drugQuery.data;
      const d =
        typeof raw === 'object' && 'drug' in raw
          ? (raw as any).drug
          : (raw as any);
      setForm(fromDrug(d as Drug));
    }
  }, [isEdit, drugQuery.data]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const errors = useMemo(() => {
    const list: string[] = [];

    if (!isRestock) {
      if (!form.name.trim()) list.push('Name is required');
      if (!form.form) list.push('Form is required');
    }

    const needsStockFields =
      isRestock || (isCreate && form.initQty.trim().length > 0);

    if (needsStockFields) {
      const q = Number(form.initQty);
      if (!Number.isFinite(q) || q <= 0) {
        list.push(
          isRestock
            ? 'Quantity must be greater than 0'
            : 'Initial quantity must be greater than 0'
        );
      }
      if (!form.initExpiryDate) {
        list.push(
          isRestock ? 'Expiry date is required' : 'Expiry date is required for initial stock'
        );
      } else if (new Date(form.initExpiryDate) <= new Date()) {
        list.push('Expiry date must be in the future');
      }
    }

    return list;
  }, [form, isEdit, isCreate, isRestock]);

  const valid = errors.length === 0;

  async function submitRestock() {
    if (!drugId) return;
    await inventoryApi.drugs.addBatch(drugId, {
      qty: Number(form.initQty),
      expiryDate: form.initExpiryDate,
      costPrice: form.initCostPrice ? Number(form.initCostPrice) : undefined,
      sellingPrice: form.initSellingPrice
        ? Number(form.initSellingPrice)
        : undefined,
      lotNo: form.initLotNo.trim() || undefined,
      supplierId: form.initSupplierId || undefined,
    });
    toast.success(`Added ${form.initQty} units to stock`);
    await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    navigation.goBack();
  }

  async function submitCreateOrEdit() {
    const payload: DrugPayload = {
      name: form.name.trim(),
      generic: form.generic.trim() || undefined,
      brand: form.brand.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      category: form.category.trim() || undefined,
      form: form.form,
      strength: form.strength.trim() || undefined,
      unit: form.unit.trim() || undefined,
      taxRate: Number(form.taxRate) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      prescriptionRequired: form.prescriptionRequired,
      controlled: form.controlled,
    };

    if (isEdit && drugId) {
      await inventoryApi.drugs.update(drugId, payload);
      toast.success('Drug updated');
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      navigation.goBack();
      return;
    }

    const saved = await inventoryApi.drugs.create(payload);

    if (form.initQty.trim()) {
      try {
        await inventoryApi.drugs.addBatch(saved._id, {
          qty: Number(form.initQty),
          expiryDate: form.initExpiryDate,
          costPrice: form.initCostPrice ? Number(form.initCostPrice) : undefined,
          sellingPrice: form.initSellingPrice
            ? Number(form.initSellingPrice)
            : undefined,
          lotNo: form.initLotNo.trim() || undefined,
          supplierId: form.initSupplierId || undefined,
        });
        toast.success(`${saved.name} added with ${form.initQty} in stock`);
      } catch (e: any) {
        toast.error(
          `Drug created, but initial stock failed: ${e?.message || 'unknown error'}`
        );
      }
    } else {
      toast.success('Drug added');
    }

    await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    navigation.goBack();
  }

  async function submit() {
    setAttempted(true);
    if (!valid || saving) {
      if (errors.length) toast.error(errors[0]);
      return;
    }

    setSaving(true);
    try {
      if (isRestock) {
        await submitRestock();
      } else {
        await submitCreateOrEdit();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const categoryOptions = [
    { value: '', label: 'No category' },
    ...DRUG_CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  const formOptions = DRUG_FORMS.map((f) => ({
    value: f,
    label: DRUG_FORM_LABELS[f] ?? f,
  }));

  const supplierOptions = [
    { value: '', label: 'Not specified' },
    ...suppliers.map((s: any) => ({ value: s._id, label: s.name })),
  ];

  const title = isRestock ? 'Restock' : isEdit ? 'Edit drug' : 'New drug';
  const submitLabel = isRestock
    ? 'Add to stock'
    : isEdit
    ? 'Save changes'
    : 'Add drug';

  return (
    <Screen scroll keyboardAvoid>
      {attempted && !valid && errors.length > 0 ? (
        <Alert variant="warning" style={styles.alert}>
          {errors[0]}
        </Alert>
      ) : null}

      {isRestock ? (
        <Card style={styles.section} header="Restock details">
          <FormField label="Quantity to add" required>
            <Input
              value={form.initQty}
              onChangeText={(v) => patch('initQty', v)}
              keyboardType="numeric"
              placeholder="e.g. 50"
              editable={!saving}
            />
          </FormField>

          <FormField label="Expiry date" required hint="Format: YYYY-MM-DD">
            <Input
              value={form.initExpiryDate}
              onChangeText={(v) => patch('initExpiryDate', v)}
              placeholder="2027-12-31"
              editable={!saving}
            />
          </FormField>

          <FormField label="Cost price">
            <Input
              value={form.initCostPrice}
              onChangeText={(v) => patch('initCostPrice', v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 200"
              editable={!saving}
            />
          </FormField>

          <FormField label="Selling price">
            <Input
              value={form.initSellingPrice}
              onChangeText={(v) => patch('initSellingPrice', v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 300"
              editable={!saving}
            />
          </FormField>

          <FormField label="Lot number">
            <Input
              value={form.initLotNo}
              onChangeText={(v) => patch('initLotNo', v)}
              placeholder="e.g. LOT-2026-A12"
              editable={!saving}
            />
          </FormField>

          <FormField label="Supplier">
            <Select
              value={form.initSupplierId}
              options={supplierOptions}
              onChange={(v) => patch('initSupplierId', v)}
              disabled={saving}
            />
          </FormField>
        </Card>
      ) : (
        <>
          <Card style={styles.section} header="Drug details">
            <FormField label="Name" required>
              <Input
                value={form.name}
                onChangeText={(v) => patch('name', v)}
                placeholder="Paracetamol"
                editable={!saving}
              />
            </FormField>

            <FormField label="Generic name">
              <Input
                value={form.generic}
                onChangeText={(v) => patch('generic', v)}
                placeholder="Acetaminophen"
                editable={!saving}
              />
            </FormField>

            <FormField label="Brand">
              <Input
                value={form.brand}
                onChangeText={(v) => patch('brand', v)}
                placeholder="Panadol"
                editable={!saving}
              />
            </FormField>

            <FormField label="Category">
              <Select
                value={form.category}
                options={categoryOptions}
                onChange={(v) => patch('category', v)}
                disabled={saving}
              />
            </FormField>

            <FormField label="Barcode">
              <Input
                value={form.barcode}
                onChangeText={(v) => patch('barcode', v)}
                placeholder="6161100012345"
                editable={!saving}
              />
            </FormField>

            <FormField label="Form" required>
              <Select
                value={form.form}
                options={formOptions}
                onChange={(v) => patch('form', v as DrugFormType)}
                disabled={saving}
              />
            </FormField>

            <FormField label="Strength">
              <Input
                value={form.strength}
                onChangeText={(v) => patch('strength', v)}
                placeholder="500mg"
                editable={!saving}
              />
            </FormField>

            <FormField label="Unit">
              <Input
                value={form.unit}
                onChangeText={(v) => patch('unit', v)}
                placeholder="pcs"
                editable={!saving}
              />
            </FormField>

            <FormField label="Tax rate (%)" hint="Applied on sales">
              <Input
                value={form.taxRate}
                onChangeText={(v) => patch('taxRate', v)}
                keyboardType="decimal-pad"
                placeholder="0"
                editable={!saving}
              />
            </FormField>

            <FormField
              label="Reorder level"
              hint="Alert when stock drops to this quantity"
            >
              <Input
                value={form.reorderLevel}
                onChangeText={(v) => patch('reorderLevel', v)}
                keyboardType="numeric"
                placeholder="10"
                editable={!saving}
              />
            </FormField>

            <View
              style={[
                styles.switchRow,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface2,
                },
              ]}
            >
              <View style={styles.switchText}>
                <Text
                  style={[styles.switchTitle, { color: theme.colors.text }]}
                >
                  Prescription required
                </Text>
                <Text
                  style={[
                    styles.switchDesc,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  Sales of this drug require a prescription
                </Text>
              </View>
              <Switch
                checked={form.prescriptionRequired}
                onChange={(v) => patch('prescriptionRequired', v)}
                disabled={saving}
              />
            </View>

            <View
              style={[
                styles.switchRow,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface2,
                },
              ]}
            >
              <View style={styles.switchText}>
                <Text
                  style={[styles.switchTitle, { color: theme.colors.text }]}
                >
                  Controlled substance
                </Text>
                <Text
                  style={[
                    styles.switchDesc,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  Extra logging and restricted sales apply
                </Text>
              </View>
              <Switch
                checked={form.controlled}
                onChange={(v) => patch('controlled', v)}
                disabled={saving}
              />
            </View>
          </Card>

          {isCreate ? (
            <Card style={styles.section} header="Initial stock (optional)">
              {showStock ? (
                <>
                  <FormField label="Quantity">
                    <Input
                      value={form.initQty}
                      onChangeText={(v) => patch('initQty', v)}
                      keyboardType="numeric"
                      placeholder="e.g. 50"
                      editable={!saving}
                    />
                  </FormField>

                  <FormField
                    label="Expiry date"
                    hint="Format: YYYY-MM-DD"
                  >
                    <Input
                      value={form.initExpiryDate}
                      onChangeText={(v) => patch('initExpiryDate', v)}
                      placeholder="2027-12-31"
                      editable={!saving}
                    />
                  </FormField>

                  <FormField label="Cost price">
                    <Input
                      value={form.initCostPrice}
                      onChangeText={(v) => patch('initCostPrice', v)}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 200"
                      editable={!saving}
                    />
                  </FormField>

                  <FormField label="Selling price">
                    <Input
                      value={form.initSellingPrice}
                      onChangeText={(v) => patch('initSellingPrice', v)}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 300"
                      editable={!saving}
                    />
                  </FormField>

                  <FormField label="Lot number">
                    <Input
                      value={form.initLotNo}
                      onChangeText={(v) => patch('initLotNo', v)}
                      placeholder="e.g. LOT-2026-A12"
                      editable={!saving}
                    />
                  </FormField>

                  <FormField label="Supplier">
                    <Select
                      value={form.initSupplierId}
                      options={supplierOptions}
                      onChange={(v) => patch('initSupplierId', v)}
                      disabled={saving}
                    />
                  </FormField>

                  <Pressable
                    onPress={() => {
                      patch('initQty', '');
                      patch('initExpiryDate', '');
                      patch('initCostPrice', '');
                      patch('initSellingPrice', '');
                      patch('initLotNo', '');
                      patch('initSupplierId', '');
                      setShowStock(false);
                    }}
                    style={styles.clearStockBtn}
                  >
                    <Text
                      style={[
                        styles.clearStockText,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      Clear initial stock
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={() => setShowStock(true)}
                  style={[
                    styles.addStockBtn,
                    { borderColor: theme.colors.border },
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.addStockText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Add initial stock
                  </Text>
                </Pressable>
              )}
            </Card>
          ) : null}
        </>
      )}

      <View style={styles.submitWrap}>
        <Button
          title={submitLabel}
          onPress={submit}
          loading={saving}
          disabled={!valid}
          fullWidth
          size="lg"
          leftIcon={
            <Ionicons
              name={isRestock ? 'add-circle-outline' : 'checkmark'}
              size={18}
              color="#ffffff"
            />
          }
        />
      </View>

      <View style={styles.bottomPad} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  alert: { marginBottom: 12 },
  section: { marginBottom: 16 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  switchText: { flex: 1 },
  switchTitle: { fontSize: 14, fontWeight: '500' },
  switchDesc: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  clearStockBtn: { alignItems: 'center', paddingVertical: 8 },
  clearStockText: { fontSize: 12, fontWeight: '500' },
  addStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 16,
  },
  addStockText: { fontSize: 13, fontWeight: '600' },
  submitWrap: { marginTop: 8, marginBottom: 16 },
  bottomPad: { height: 24 },
});