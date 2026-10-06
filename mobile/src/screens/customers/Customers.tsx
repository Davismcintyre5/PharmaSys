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
  ConfirmDialog,
  EmptyState,
  Spinner,
  Badge,
  ListItem,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { customerApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { hasPermission } from '@/utils/permissions';
import { formatMoney, formatRelativeTime } from '@/utils/format';
import type { Customer, CustomerPayload } from '@/types';

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

type Danger =
  | { customer: Customer; kind: 'deactivate' }
  | { customer: Customer; kind: 'hard-delete' }
  | null;

export default function Customers() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canCreate = hasPermission(user?.role, 'customers.create');
  const canUpdate = hasPermission(user?.role, 'customers.update');
  const isOwner = user?.role === 'owner';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const customersQuery = useQuery({
    queryKey: queryKeys.customers.list({ search: debouncedSearch }),
    queryFn: () =>
      customerApi.list(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const customers: Customer[] = useMemo(
    () => (Array.isArray(customersQuery.data) ? customersQuery.data : []),
    [customersQuery.data]
  );

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [danger, setDanger] = useState<Danger>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(c: Customer) {
    setForm({
      name: c.name,
      phone: c.phone ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
      notes: '',
    });
    setEditing(c);
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
      const payload: CustomerPayload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (editing) {
        await customerApi.update(editing._id, payload);
        toast.success('Customer updated');
      } else {
        await customerApi.create(payload);
        toast.success('Customer added');
      }

      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      closeForm();
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDanger() {
    if (!danger) return;
    const { customer, kind } = danger;
    try {
      if (kind === 'deactivate') {
        await customerApi.remove(customer._id);
        toast.success('Customer deactivated');
      } else {
        await customerApi.hardRemove(customer._id);
        toast.success('Customer permanently deleted');
      }
      setDanger(null);
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  const renderItem = ({ item }: { item: Customer }) => (
    <Card style={styles.customerCard}>
      <View style={styles.customerRow}>
        <View style={styles.customerLeft}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.customerName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.loyaltyPoints > 0 && (
              <Badge variant="accent">{item.loyaltyPoints} pts</Badge>
            )}
          </View>

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
              <Text style={[styles.metaText, { color: theme.colors.textSubtle }]}>
                No contact info
              </Text>
            ) : null}
          </View>

          <View style={styles.statsRow}>
            <Text style={[styles.stat, { color: theme.colors.textMuted }]}>
              <Text style={{ fontWeight: '600', color: theme.colors.text }}>
                {formatMoney(item.totalSpent || 0, 'KES')}
              </Text>{' '}
              lifetime
            </Text>
            <Text style={[styles.stat, { color: theme.colors.textSubtle }]}>
              ·{' '}
              {item.lastPurchaseAt
                ? formatRelativeTime(item.lastPurchaseAt)
                : 'Never'}
            </Text>
          </View>
        </View>

        {canUpdate && (
          <Pressable
            onPress={() => openEdit(item)}
            style={styles.editButton}
            hitSlop={8}
          >
            <Ionicons
              name="pencil-outline"
              size={16}
              color={theme.colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      {canUpdate && (
        <View style={styles.customerActions}>
          <Pressable
            onPress={() =>
              navigation.navigate('MoreTab', {
                screen: 'Sales',
                params: { customerId: item._id },
              })
            }
            style={styles.actionBtn}
          >
            <Ionicons
              name="receipt-outline"
              size={12}
              color={theme.colors.primary}
            />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>
              Purchases
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setDanger({ customer: item, kind: 'deactivate' })}
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
        </View>
      )}
    </Card>
  );

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Customers
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Loyalty and purchase history
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

      {customersQuery.isLoading ? (
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      ) : !customers.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <Ionicons
                name="people-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title={search ? 'No matches' : 'No customers yet'}
            description={
              search
                ? 'Try a different name or phone number.'
                : 'Add your first customer to track purchases and loyalty points.'
            }
            action={
              !search && canCreate ? (
                <Button
                  title="Add customer"
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
          data={customers}
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
        title={editing ? `Edit ${editing.name}` : 'Add customer'}
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
              title={editing ? 'Save changes' : 'Add customer'}
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

        <FormField label="Address">
          <Input
            value={form.address}
            onChangeText={(v) => patch('address', v)}
            placeholder="Argwings Kodhek Rd, Nairobi"
            editable={!saving}
          />
        </FormField>

        <FormField label="Notes">
          <Textarea
            value={form.notes}
            onChangeText={(v) => patch('notes', v)}
            placeholder="Preferences, referral source, anything relevant…"
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
            ? `Permanently delete ${danger.customer.name}?`
            : `Deactivate ${danger?.customer.name ?? ''}?`
        }
        description={
          danger?.kind === 'hard-delete'
            ? 'This cannot be undone. The customer record and its links will be removed. Sales history stays intact for accounting.'
            : "The customer won't appear in searches or new sales. Their purchase history is preserved."
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
  customerCard: { marginBottom: 0 },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  customerLeft: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  customerName: { fontSize: 15, fontWeight: '600' },
  contactBlock: { marginTop: 6, gap: 4 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, flex: 1 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  stat: { fontSize: 11 },
  editButton: {
    padding: 8,
  },
  customerActions: {
    flexDirection: 'row',
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