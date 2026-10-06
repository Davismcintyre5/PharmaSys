import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Input,
  FormField,
  Modal,
  ConfirmDialog,
  EmptyState,
  Spinner,
  Alert,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { supplierApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { hasPermission } from '@/utils/permissions';
import { formatDate } from '@/utils/format';
import type { Supplier, SupplierPayload } from '@/types';

interface FormState {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
};

type Danger =
  | { supplier: Supplier; kind: 'deactivate' }
  | { supplier: Supplier; kind: 'hard-delete' }
  | null;

export default function Suppliers() {
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canView = hasPermission(user?.role, 'suppliers.view');
  const canManage = hasPermission(user?.role, 'suppliers.manage');
  const isOwner = user?.role === 'owner';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const suppliersQuery = useQuery({
    queryKey: queryKeys.suppliers.list({ search: debouncedSearch }),
    queryFn: () =>
      supplierApi.list(debouncedSearch ? { search: debouncedSearch } : {}),
    enabled: canView,
  });

  const suppliers: Supplier[] = useMemo(() => {
    const raw = suppliersQuery.data;
    return Array.isArray(raw) ? raw : ((raw as any)?.items ?? []);
  }, [suppliersQuery.data]);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [danger, setDanger] = useState<Danger>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(s: Supplier) {
    setForm({
      name: s.name,
      contactPerson: s.contactPerson ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      address: s.address ?? '',
    });
    setEditing(s);
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

  async function submit() {
    if (saving) return;
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const payload: SupplierPayload = {
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
      };

      if (editing) {
        await supplierApi.update(editing._id, payload);
        toast.success('Supplier updated');
      } else {
        await supplierApi.create(payload);
        toast.success('Supplier added');
      }

      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      closeForm();
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDanger() {
    if (!danger) return;
    const { supplier, kind } = danger;
    try {
      if (kind === 'deactivate') {
        await supplierApi.remove(supplier._id);
        toast.success('Supplier deactivated');
      } else {
        await supplierApi.hardRemove(supplier._id);
        toast.success('Supplier permanently deleted');
      }
      setDanger(null);
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  if (!canView) {
    return (
      <Screen>
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title="No access"
            description="You don't have permission to view suppliers. Ask your branch manager or owner."
          />
        </View>
      </Screen>
    );
  }

  const renderItem = ({ item }: { item: Supplier }) => (
    <Card style={styles.supplierCard}>
      <View style={styles.supplierRow}>
        <View style={styles.supplierLeft}>
          <Text
            style={[styles.supplierName, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          {item.contactPerson ? (
            <Text
              style={[styles.contactPerson, { color: theme.colors.textMuted }]}
              numberOfLines={1}
            >
              {item.contactPerson}
            </Text>
          ) : null}

          <View style={styles.metaBlock}>
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

            {item.address ? (
              <View style={styles.metaLine}>
                <Ionicons
                  name="location-outline"
                  size={11}
                  color={theme.colors.textSubtle}
                />
                <Text
                  style={[styles.metaText, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {item.address}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.metaSub, { color: theme.colors.textSubtle }]}>
            Added {item.createdAt ? formatDate(item.createdAt) : '—'}
          </Text>
        </View>

        {canManage ? (
          <Pressable
            onPress={() => openEdit(item)}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Ionicons
              name="pencil-outline"
              size={16}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      {canManage ? (
        <View style={styles.cardActions}>
          <Pressable onPress={() => openEdit(item)} style={styles.actionBtn}>
            <Ionicons
              name="create-outline"
              size={12}
              color={theme.colors.primary}
            />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>
              Edit
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setDanger({ supplier: item, kind: 'deactivate' })}
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
                setDanger({ supplier: item, kind: 'hard-delete' })
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
    </Card>
  );

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Suppliers
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Manage your supply chain
          </Text>
        </View>

        {canManage ? (
          <Button
            title="Add"
            size="sm"
            onPress={openCreate}
            leftIcon={<Ionicons name="add" size={16} color="#ffffff" />}
          />
        ) : null}
      </View>

      {!canManage ? (
        <Alert variant="info" style={styles.alert}>
          Only the owner can add or edit suppliers.
        </Alert>
      ) : null}

      <View style={styles.searchWrap}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name…"
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

      {suppliersQuery.isLoading ? (
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      ) : !suppliers.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <Ionicons
                name="car-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title={search ? 'No matches' : 'No suppliers yet'}
            description={
              search
                ? 'Try a different name.'
                : 'Add your first supplier to start creating purchase orders.'
            }
            action={
              !search && canManage ? (
                <Button
                  title="Add supplier"
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
          data={suppliers}
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
        title={editing ? `Edit ${editing.name}` : 'Add supplier'}
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
              title={editing ? 'Save changes' : 'Add supplier'}
              onPress={submit}
              loading={saving}
            />
          </>
        }
      >
        <FormField label="Business name" required>
          <Input
            value={form.name}
            onChangeText={(v) => patch('name', v)}
            placeholder="Nairobi Pharma Distributors"
            editable={!saving}
          />
        </FormField>

        <FormField label="Contact person">
          <Input
            value={form.contactPerson}
            onChangeText={(v) => patch('contactPerson', v)}
            placeholder="John Kamau"
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
            placeholder="orders@supplier.co.ke"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!saving}
          />
        </FormField>

        <FormField label="Address">
          <Input
            value={form.address}
            onChangeText={(v) => patch('address', v)}
            placeholder="Industrial Area, Nairobi"
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
            ? `Permanently delete ${danger.supplier.name}?`
            : `Deactivate ${danger?.supplier.name ?? ''}?`
        }
        description={
          danger?.kind === 'hard-delete'
            ? 'This cannot be undone. Historical purchase orders stay intact for accounting.'
            : "The supplier won't appear in new purchase orders. Their history is preserved."
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
    marginBottom: 12,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  alert: { marginBottom: 12 },
  searchWrap: { marginBottom: 16 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  list: { gap: 10 },
  supplierCard: { marginBottom: 0 },
  supplierRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  supplierLeft: { flex: 1, minWidth: 0 },
  supplierName: { fontSize: 15, fontWeight: '600' },
  contactPerson: { fontSize: 12, marginTop: 3 },
  metaBlock: { marginTop: 8, gap: 4 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, flex: 1 },
  metaSub: { fontSize: 11, marginTop: 8 },
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