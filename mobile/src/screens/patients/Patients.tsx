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
  Select,
  Textarea,
  FormField,
  Modal,
  ConfirmDialog,
  EmptyState,
  Spinner,
  Badge,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { patientApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { hasPermission } from '@/utils/permissions';
import { formatDate } from '@/utils/format';
import { genderLabel } from '@/utils/enums';
import type { Patient, PatientPayload, Gender } from '@/types';

interface FormState {
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender: '' | Gender;
  allergies: string;
  chronicConditions: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  phone: '',
  email: '',
  dob: '',
  gender: '',
  allergies: '',
  chronicConditions: '',
  notes: '',
};

type Danger =
  | { patient: Patient; kind: 'deactivate' }
  | { patient: Patient; kind: 'hard-delete' }
  | null;

export default function Patients() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canCreate = hasPermission(user?.role, 'patients.create');
  const canUpdate = hasPermission(user?.role, 'patients.update');
  const isOwner = user?.role === 'owner';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const patientsQuery = useQuery({
    queryKey: queryKeys.patients.list({ search: debouncedSearch }),
    queryFn: () =>
      patientApi.list(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const patients: Patient[] = useMemo(
    () => (Array.isArray(patientsQuery.data) ? patientsQuery.data : []),
    [patientsQuery.data]
  );

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [danger, setDanger] = useState<Danger>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(p: Patient) {
    setForm({
      name: p.name,
      phone: p.phone ?? '',
      email: p.email ?? '',
      dob: p.dob ? p.dob.slice(0, 10) : '',
      gender: (p.gender as Gender) || '',
      allergies: (p.allergies ?? []).join(', '),
      chronicConditions: (p.chronicConditions ?? []).join(', '),
      notes: p.notes ?? '',
    });
    setEditing(p);
    setCreating(false);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function parseList(s: string): string[] {
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  async function submit() {
    if (saving) return;
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const payload: PatientPayload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        allergies: form.allergies.trim() ? parseList(form.allergies) : undefined,
        chronicConditions: form.chronicConditions.trim()
          ? parseList(form.chronicConditions)
          : undefined,
        notes: form.notes.trim() || undefined,
      };

      if (editing) {
        await patientApi.update(editing._id, payload);
        toast.success('Patient updated');
      } else {
        await patientApi.create(payload);
        toast.success('Patient added');
      }

      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      closeForm();
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDanger() {
    if (!danger) return;
    const { patient, kind } = danger;
    try {
      if (kind === 'deactivate') {
        await patientApi.remove(patient._id);
        toast.success('Patient deactivated');
      } else {
        await patientApi.hardRemove(patient._id);
        toast.success('Patient permanently deleted');
      }
      setDanger(null);
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  const renderItem = ({ item }: { item: Patient }) => {
    const hasAlerts =
      (item.allergies?.length ?? 0) > 0 ||
      (item.chronicConditions?.length ?? 0) > 0;

    return (
      <Pressable
        onPress={() =>
          navigation.navigate('PatientDetail', { patientId: item._id })
        }
        style={({ pressed }) => [
          styles.patientCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.patientRow}>
          <View style={styles.patientLeft}>
            <Text
              style={[styles.patientName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <View style={styles.contactBlock}>
              {item.phone ? (
                <View style={styles.metaLine}>
                  <Ionicons
                    name="call-outline"
                    size={11}
                    color={theme.colors.textSubtle}
                  />
                  <Text
                    style={[styles.metaText, { color: theme.colors.textMuted }]}
                  >
                    {item.phone}
                  </Text>
                </View>
              ) : null}

              {item.email ? (
                <View style={styles.metaLine}>
                  <Ionicons
                    name="mail-outline"
                    size={11}
                    color={theme.colors.textSubtle}
                  />
                  <Text
                    style={[styles.metaText, { color: theme.colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {item.email}
                  </Text>
                </View>
              ) : null}

              {!item.phone && !item.email ? (
                <Text
                  style={[styles.metaText, { color: theme.colors.textSubtle }]}
                >
                  No contact info
                </Text>
              ) : null}
            </View>

            <View style={styles.metaRow}>
              {item.gender ? (
                <Text
                  style={[styles.metaText, { color: theme.colors.textMuted }]}
                >
                  {genderLabel(item.gender)}
                </Text>
              ) : null}
              {item.gender && item.createdAt ? (
                <Text
                  style={[styles.metaText, { color: theme.colors.textSubtle }]}
                >
                  {' · '}
                </Text>
              ) : null}
              <Text style={[styles.metaText, { color: theme.colors.textSubtle }]}>
                Added {item.createdAt ? formatDate(item.createdAt) : '—'}
              </Text>
            </View>
          </View>

          <View style={styles.patientRight}>
            {hasAlerts ? (
              <View style={styles.alertsBlock}>
                {item.allergies?.length ? (
                  <Badge variant="danger">
                    {item.allergies.length} allerg
                    {item.allergies.length === 1 ? 'y' : 'ies'}
                  </Badge>
                ) : null}
                {item.chronicConditions?.length ? (
                  <Badge variant="warning">
                    {item.chronicConditions.length} chronic
                  </Badge>
                ) : null}
              </View>
            ) : null}

            {canUpdate ? (
              <Pressable
                onPress={() => openEdit(item)}
                style={styles.iconBtn}
                hitSlop={8}
              >
                <Ionicons
                  name="pencil-outline"
                  size={14}
                  color={theme.colors.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
        </View>

        {canUpdate ? (
          <View style={styles.cardActions}>
            <Pressable
              onPress={() =>
                navigation.navigate('PatientDetail', { patientId: item._id })
              }
              style={styles.actionBtn}
            >
              <Ionicons
                name="eye-outline"
                size={12}
                color={theme.colors.primary}
              />
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                View
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                navigation.navigate('MoreTab', {
                  screen: 'Prescriptions',
                })
              }
              style={styles.actionBtn}
            >
              <Ionicons
                name="medkit-outline"
                size={12}
                color={theme.colors.primary}
              />
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                Prescriptions
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setDanger({ patient: item, kind: 'deactivate' })}
              style={styles.actionBtn}
            >
              <Ionicons
                name="close-circle-outline"
                size={12}
                color={theme.colors.danger}
              />
              <Text style={[styles.actionText, { color: theme.colors.danger }]}>
                Deactivate
              </Text>
            </Pressable>

            {isOwner ? (
              <Pressable
                onPress={() =>
                  setDanger({ patient: item, kind: 'hard-delete' })
                }
                style={styles.actionBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={12}
                  color={theme.colors.danger}
                />
                <Text style={[styles.actionText, { color: theme.colors.danger }]}>
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
            Patients
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Medical records and history
          </Text>
        </View>

        {canCreate && (
          <Button
            title="Add"
            size="sm"
            onPress={openCreate}
            leftIcon={<Ionicons name="add" size={16} color="#ffffff" />}
          />
        )}
      </View>

      <View style={styles.searchWrap}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or phone…"
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

      {patientsQuery.isLoading ? (
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      ) : !patients.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <Ionicons
                name="medkit-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title={search ? 'No matches' : 'No patients yet'}
            description={
              search
                ? 'Try a different name or phone number.'
                : 'Add your first patient to start tracking prescriptions and history.'
            }
            action={
              !search && canCreate ? (
                <Button
                  title="Add patient"
                  size="sm"
                  onPress={openCreate}
                  leftIcon={<Ionicons name="add" size={14} color="#ffffff" />}
                />
              ) : undefined
            }
          />
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.bottomPad} />}
        />
      )}

      <Modal
        open={creating || editing !== null}
        onClose={closeForm}
        title={editing ? `Edit ${editing.name}` : 'Add patient'}
        size="md"
        busy={saving}
        footer={
          <>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={closeForm}
              disabled={saving}
            />
            <Button
              title={editing ? 'Save changes' : 'Add patient'}
              onPress={submit}
              loading={saving}
            />
          </>
        }
      >
        <FormField label="Full name" required>
          <Input
            value={form.name}
            onChangeText={(v) => patch('name', v)}
            placeholder="Jane Wanjiku"
            editable={!saving}
          />
        </FormField>

        <FormField label="Phone">
          <Input
            value={form.phone}
            onChangeText={(v) => patch('phone', v)}
            placeholder="0712345678"
            keyboardType="phone-pad"
            editable={!saving}
          />
        </FormField>

        <FormField label="Email">
          <Input
            value={form.email}
            onChangeText={(v) => patch('email', v)}
            placeholder="jane@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!saving}
          />
        </FormField>

        <FormField label="Date of birth" hint="Format: YYYY-MM-DD">
          <Input
            value={form.dob}
            onChangeText={(v) => patch('dob', v)}
            placeholder="1990-05-20"
            editable={!saving}
          />
        </FormField>

        <FormField label="Gender">
          <Select
            value={form.gender}
            options={[
              { value: '', label: 'Not specified' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            onChange={(v) => patch('gender', v as FormState['gender'])}
            disabled={saving}
          />
        </FormField>

        <FormField
          label="Allergies"
          hint="Comma-separated. E.g. Penicillin, Sulfa drugs"
        >
          <Input
            value={form.allergies}
            onChangeText={(v) => patch('allergies', v)}
            placeholder="Penicillin, Aspirin"
            editable={!saving}
          />
        </FormField>

        <FormField
          label="Chronic conditions"
          hint="Comma-separated. E.g. Diabetes, Hypertension"
        >
          <Input
            value={form.chronicConditions}
            onChangeText={(v) => patch('chronicConditions', v)}
            placeholder="Diabetes"
            editable={!saving}
          />
        </FormField>

        <FormField label="Notes">
          <Textarea
            value={form.notes}
            onChangeText={(v) => patch('notes', v)}
            placeholder="Any additional clinical notes…"
            editable={!saving}
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'hard-delete'
            ? `Permanently delete ${danger.patient.name}?`
            : `Deactivate ${danger?.patient.name ?? ''}?`
        }
        description={
          danger?.kind === 'hard-delete'
            ? 'This cannot be undone. The patient record and its links will be removed. Sales history stays intact.'
            : "The patient won't appear in searches or new prescriptions. Their history is preserved."
        }
        confirmLabel={
          danger?.kind === 'hard-delete' ? 'Delete permanently' : 'Deactivate'
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
    marginBottom: 16,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  searchWrap: { marginBottom: 16 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  list: { gap: 10 },
  patientCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  patientLeft: { flex: 1, minWidth: 0 },
  patientName: { fontSize: 15, fontWeight: '600' },
  contactBlock: { marginTop: 6, gap: 4 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  patientRight: { alignItems: 'flex-end', gap: 8 },
  alertsBlock: { alignItems: 'flex-end', gap: 4 },
  iconBtn: { padding: 6 },
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