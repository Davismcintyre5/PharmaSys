import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Input,
  Textarea,
  FormField,
  Modal,
  Alert,
  EmptyState,
  Spinner,
  Badge,
} from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { prescriptionApi, patientApi, inventoryApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import type { Patient, Drug } from '@/types';

interface Props {
  navigation: any;
}

interface ItemDraft {
  id: string;
  drug: Drug | null;
  qty: string;
  dosage: string;
  duration: string;
  refills: string;
  notes: string;
}

function newItem(): ItemDraft {
  return {
    id: Math.random().toString(36).slice(2),
    drug: null,
    qty: '1',
    dosage: '',
    duration: '',
    refills: '0',
    notes: '',
  };
}

export default function NewPrescription({ navigation }: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<ItemDraft[]>([newItem()]);
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [drugPickerIndex, setDrugPickerIndex] = useState<number | null>(null);

  function addItem() {
    setItems((prev) => [...prev, newItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((i) => i.id !== id)
    );
  }

  function patchItem(id: string, patch: Partial<ItemDraft>) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  }

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!patient) list.push('Pick a patient');

    const validItems = items.filter((i) => i.drug);
    if (!validItems.length) list.push('Add at least one drug');

    for (const it of validItems) {
      const q = Number(it.qty);
      if (!Number.isFinite(q) || q <= 0) {
        list.push(`${it.drug!.name}: quantity must be > 0`);
      }
    }
    return list;
  }, [patient, items]);

  const valid = errors.length === 0 && !submitting;

  async function submit() {
    setAttempted(true);
    if (!patient) return;
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      await prescriptionApi.create({
        patientId: patient._id,
        refNo: refNo.trim() || undefined,
        items: items
          .filter((i) => i.drug)
          .map((i) => ({
            drugId: i.drug!._id,
            qty: Number(i.qty),
            dosage: i.dosage.trim() || null,
            duration: i.duration.trim() || null,
            refills: Number(i.refills) || 0,
            notes: i.notes.trim() || null,
          })),
        notes: notes.trim() || undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success('Prescription created');
      navigation.goBack();
    } catch (e: any) {
      toast.error(e?.message || 'Could not create prescription');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll keyboardAvoid>
      {attempted && !valid && errors.length > 0 ? (
        <Alert variant="warning" style={styles.alert}>
          {errors[0]}
        </Alert>
      ) : null}

      <Card style={styles.section} header="Patient">
        {patient ? (
          <View
            style={[
              styles.patientRow,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.patientLeft}>
              <Text
                style={[styles.patientName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {patient.name}
              </Text>
              {patient.phone ? (
                <Text
                  style={[styles.patientMeta, { color: theme.colors.textMuted }]}
                >
                  {patient.phone}
                </Text>
              ) : null}
              {patient.allergies?.length ? (
                <Text
                  style={[styles.patientAlert, { color: theme.colors.danger }]}
                >
                  Allergies: {patient.allergies.join(', ')}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={() => setPatient(null)}
              style={styles.changeBtn}
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
            onPress={() => setPatientPickerOpen(true)}
            style={({ pressed }) => [
              styles.pickBtn,
              {
                borderColor: theme.colors.border,
                backgroundColor: pressed
                  ? theme.colors.surface2
                  : theme.colors.background,
              },
            ]}
          >
            <Ionicons name="add" size={16} color={theme.colors.textMuted} />
            <Text style={[styles.pickText, { color: theme.colors.textMuted }]}>
              Pick a patient
            </Text>
          </Pressable>
        )}
      </Card>

      <Card style={styles.section} header="Prescriber">
        <FormField label="Ref / prescription number">
          <Input
            value={refNo}
            onChangeText={setRefNo}
            placeholder="RX-2026-001"
            editable={!submitting}
          />
        </FormField>
      </Card>

      <Card
        style={styles.section}
        header={`Medications (${items.filter((i) => i.drug).length} selected)`}
        footer={
          <Pressable onPress={addItem} style={styles.addItemBtn}>
            <Ionicons
              name="add"
              size={16}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.addItemText, { color: theme.colors.primary }]}
            >
              Add item
            </Text>
          </Pressable>
        }
      >
        <View style={styles.itemList}>
          {items.map((item, idx) => (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface2,
                },
              ]}
            >
              <View style={styles.itemHeader}>
                <Text
                  style={[styles.itemIndex, { color: theme.colors.textSubtle }]}
                >
                  Item {idx + 1}
                </Text>
                {items.length > 1 ? (
                  <Pressable
                    onPress={() => removeItem(item.id)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={theme.colors.danger}
                    />
                  </Pressable>
                ) : null}
              </View>

              {item.drug ? (
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
                      {item.drug.name}
                      {item.drug.strength ? ` ${item.drug.strength}` : ''}
                    </Text>
                    <Text
                      style={[styles.drugMeta, { color: theme.colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {[item.drug.generic, item.drug.form, item.drug.unit]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => patchItem(item.id, { drug: null })}
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
                      value={item.qty}
                      onChangeText={(v) => patchItem(item.id, { qty: v })}
                      keyboardType="numeric"
                      placeholder="1"
                      editable={!submitting}
                    />
                  </FormField>
                </View>
                <View style={styles.gridCol}>
                  <FormField label="Refills">
                    <Input
                      value={item.refills}
                      onChangeText={(v) => patchItem(item.id, { refills: v })}
                      keyboardType="numeric"
                      placeholder="0"
                      editable={!submitting}
                    />
                  </FormField>
                </View>
              </View>

              <FormField label="Dosage" hint="e.g. 1 tablet twice daily">
                <Input
                  value={item.dosage}
                  onChangeText={(v) => patchItem(item.id, { dosage: v })}
                  placeholder="1 tab twice daily"
                  editable={!submitting}
                />
              </FormField>

              <FormField label="Duration" hint="e.g. 5 days">
                <Input
                  value={item.duration}
                  onChangeText={(v) => patchItem(item.id, { duration: v })}
                  placeholder="5 days"
                  editable={!submitting}
                />
              </FormField>

              <FormField label="Item notes">
                <Input
                  value={item.notes}
                  onChangeText={(v) => patchItem(item.id, { notes: v })}
                  placeholder="Take after meals"
                  editable={!submitting}
                />
              </FormField>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.section} header="Notes">
        <FormField
          label="Additional instructions"
          hint="Appears on the printed prescription"
        >
          <Textarea
            value={notes}
            onChangeText={setNotes}
            placeholder="Take with food. Avoid alcohol."
            editable={!submitting}
          />
        </FormField>
      </Card>

      <View style={styles.submitWrap}>
        <Button
          title="Create prescription"
          onPress={submit}
          loading={submitting}
          disabled={!valid}
          fullWidth
          size="lg"
          leftIcon={
            <Ionicons name="checkmark" size={18} color="#ffffff" />
          }
        />
      </View>

      <PatientPickerModal
        open={patientPickerOpen}
        onClose={() => setPatientPickerOpen(false)}
        onPick={(p) => {
          setPatient(p);
          setPatientPickerOpen(false);
        }}
      />

      <DrugPickerModal
        open={drugPickerIndex !== null}
        onClose={() => setDrugPickerIndex(null)}
        onPick={(d) => {
          if (drugPickerIndex !== null) {
            const item = items[drugPickerIndex];
            if (item) patchItem(item.id, { drug: d });
          }
          setDrugPickerIndex(null);
        }}
      />

      <View style={styles.bottomPad} />
    </Screen>
  );
}

function PatientPickerModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (p: Patient) => void;
}) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);

  const listQuery = useQuery({
    queryKey: ['patients', 'picker', debounced],
    queryFn: () =>
      patientApi.list(debounced ? { search: debounced } : {}),
    enabled: open,
  });

  const results: Patient[] = useMemo(
    () =>
      Array.isArray(listQuery.data) ? listQuery.data.slice(0, 30) : [],
    [listQuery.data]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pick a patient"
      size="md"
      footer={
        <Button title="Cancel" variant="ghost" onPress={onClose} />
      }
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or phone…"
        leftIcon={
          <Ionicons name="search" size={14} color={theme.colors.textSubtle} />
        }
        autoFocus
      />

      <View style={styles.pickerList}>
        {listQuery.isLoading ? (
          <View style={styles.pickerLoading}>
            <Spinner />
          </View>
        ) : !results.length ? (
          <EmptyState
            icon={
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.colors.textMuted}
              />
            }
            title={query ? 'No matches' : 'No patients'}
            description={
              query
                ? 'Try a different search.'
                : 'Add a patient from the Patients page first.'
            }
          />
        ) : (
          results.map((p) => (
            <Pressable
              key={p._id}
              onPress={() => onPick(p)}
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
                  {p.name}
                </Text>
                {p.phone ? (
                  <Text
                    style={[styles.pickerMeta, { color: theme.colors.textMuted }]}
                  >
                    {p.phone}
                  </Text>
                ) : null}
              </View>
              {p.allergies?.length ? (
                <Badge variant="danger">
                  {p.allergies.length} allerg
                  {p.allergies.length === 1 ? 'y' : 'ies'}
                </Badge>
              ) : null}
            </Pressable>
          ))
        )}
      </View>
    </Modal>
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
    queryKey: ['drugs', 'picker', debounced],
    queryFn: () =>
      inventoryApi.drugs.list(
        debounced ? { search: debounced } : { limit: 50 }
      ),
    enabled: open,
  });

  const results: Drug[] = useMemo(() => {
    const raw = listQuery.data;
    const arr = Array.isArray(raw)
      ? raw
      : ((raw as any)?.items ?? []);
    return Array.isArray(arr) ? arr.slice(0, 40) : [];
  }, [listQuery.data]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pick a drug"
      size="md"
      footer={
        <Button title="Cancel" variant="ghost" onPress={onClose} />
      }
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search drugs by name or generic…"
        leftIcon={
          <Ionicons name="search" size={14} color={theme.colors.textSubtle} />
        }
        autoFocus
      />

      <View style={styles.pickerList}>
        {listQuery.isLoading ? (
          <View style={styles.pickerLoading}>
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
                  style={[styles.pickerMeta, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {[d.generic, d.form, d.unit].filter(Boolean).join(' · ') ||
                    '—'}
                </Text>
              </View>
              {d.prescriptionRequired ? (
                <Badge variant="warning">Rx</Badge>
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
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  patientLeft: { flex: 1, minWidth: 0 },
  patientName: { fontSize: 14, fontWeight: '600' },
  patientMeta: { fontSize: 12, marginTop: 3 },
  patientAlert: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  changeBtn: { padding: 4 },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 16,
  },
  pickText: { fontSize: 14, fontWeight: '500' },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  addItemText: { fontSize: 13, fontWeight: '600' },
  itemList: { gap: 12 },
  itemCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemIndex: { fontSize: 11, fontWeight: '600' },
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
  submitWrap: { marginTop: 8, marginBottom: 16 },
  pickerList: {
    marginTop: 12,
    maxHeight: 360,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.3)',
  },
  pickerLoading: { paddingVertical: 32, alignItems: 'center' },
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
  bottomPad: { height: 24 },
});