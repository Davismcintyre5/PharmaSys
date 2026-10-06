import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Input,
  FormField,
  Modal,
  ConfirmDialog,
  Alert,
  Badge,
  EmptyState,
  Spinner,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { branchApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { formatDate } from '@/utils/format';
import type { Branch, BranchPayload } from '@/types';

interface FormState {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  code: '',
  address: '',
  phone: '',
  email: '',
};

export default function Branches() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, plan } = useAuth();

  const isOwner = user?.role === 'owner';
  const maxBranches = plan?.limits?.maxBranches ?? 1;

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches.list,
    queryFn: () => branchApi.list(),
  });

  const branches = (branchesQuery.data ?? []) as Branch[];
  const activeCount = branches.filter((b) => b.isActive).length;
  const atLimit = activeCount >= maxBranches;

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deactivating, setDeactivating] = useState<Branch | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(branch: Branch) {
    setForm({
      name: branch.name,
      code: branch.code,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      email: branch.email ?? '',
    });
    setEditing(branch);
    setCreating(false);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function submit() {
    if (saving) return;
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }

    setSaving(true);
    try {
      const payload: BranchPayload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
      };

      if (editing) {
        await branchApi.update(editing._id, payload);
        toast.success('Branch updated');
      } else {
        await branchApi.create(payload);
        toast.success('Branch created');
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.branches.list });
      closeForm();
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeactivate() {
    if (!deactivating) return;
    try {
      await branchApi.deactivate(deactivating._id);
      toast.success('Branch deactivated');
      setDeactivating(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.branches.list });
    } catch (e: any) {
      toast.error(e?.message || 'Could not deactivate');
    }
  }

  if (branchesQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Branches</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {isOwner
              ? `${activeCount} of ${maxBranches} branch${maxBranches === 1 ? '' : 'es'} used on your plan`
              : 'Your assigned branches'}
          </Text>
        </View>

        {isOwner && (
          <Button
            title="New"
            size="sm"
            disabled={atLimit}
            onPress={openCreate}
            leftIcon={
              <Ionicons name="add" size={16} color="#ffffff" />
            }
          />
        )}
      </View>

      {atLimit && isOwner && (
        <Card style={styles.limitCard}>
          <View style={styles.limitRow}>
            <Text style={[styles.limitText, { color: theme.colors.textMuted }]}>
              You've reached the branch limit on your current plan.
            </Text>
            <Pressable
              onPress={() =>
                navigation.navigate('Billing')
              }
            >
              <Text style={[styles.link, { color: theme.colors.primary }]}>
                Upgrade
              </Text>
            </Pressable>
          </View>
        </Card>
      )}

      {!branches.length ? (
        <Card>
          <EmptyState
            icon={
              <Ionicons
                name="business-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title="No branches yet"
            description={
              isOwner
                ? 'Create your first branch to start organizing sales, staff, and stock.'
                : 'No branches have been assigned to you yet.'
            }
            action={
              isOwner && !atLimit ? (
                <Button
                  title="New branch"
                  size="sm"
                  onPress={openCreate}
                  leftIcon={
                    <Ionicons name="add" size={14} color="#ffffff" />
                  }
                />
              ) : undefined
            }
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {branches.map((branch) => (
            <Card key={branch._id} style={styles.branchCard}>
              <View style={styles.branchHeader}>
                <View style={styles.branchTitleRow}>
                  <Text
                    style={[styles.branchName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {branch.name}
                  </Text>
                  {!branch.isActive && <Badge variant="neutral">Inactive</Badge>}
                </View>
                <Text
                  style={[styles.branchCode, { color: theme.colors.textMuted }]}
                >
                  {branch.code}
                </Text>
              </View>

              <View style={styles.branchMeta}>
                {branch.address ? (
                  <View style={styles.metaLine}>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color={theme.colors.textSubtle}
                    />
                    <Text
                      style={[styles.metaText, { color: theme.colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {branch.address}
                    </Text>
                  </View>
                ) : null}
                {branch.phone ? (
                  <View style={styles.metaLine}>
                    <Ionicons
                      name="call-outline"
                      size={12}
                      color={theme.colors.textSubtle}
                    />
                    <Text
                      style={[styles.metaText, { color: theme.colors.textMuted }]}
                    >
                      {branch.phone}
                    </Text>
                  </View>
                ) : null}
                <Text
                  style={[styles.metaSub, { color: theme.colors.textSubtle }]}
                >
                  Created {formatDate(branch.createdAt)}
                </Text>
              </View>

              {isOwner && branch.isActive && (
                <View style={styles.branchActions}>
                  <Button
                    title="Edit"
                    size="sm"
                    variant="ghost"
                    onPress={() => openEdit(branch)}
                    leftIcon={
                      <Ionicons
                        name="pencil-outline"
                        size={14}
                        color={theme.colors.text}
                      />
                    }
                  />
                  <Button
                    title="Deactivate"
                    size="sm"
                    variant="ghost"
                    onPress={() => setDeactivating(branch)}
                    leftIcon={
                      <Ionicons
                        name="power-outline"
                        size={14}
                        color={theme.colors.danger}
                      />
                    }
                  />
                </View>
              )}
            </Card>
          ))}
        </View>
      )}

      <Modal
        open={creating || editing !== null}
        onClose={closeForm}
        title={editing ? `Edit ${editing.name}` : 'New branch'}
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
              title={editing ? 'Save changes' : 'Create branch'}
              onPress={submit}
              loading={saving}
            />
          </>
        }
      >
        <FormField label="Name" required>
          <Input
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Kilimani Branch"
            editable={!saving}
          />
        </FormField>

        <FormField
          label="Code"
          required
          hint="Short code, e.g. KIL-01. Cannot be changed later."
        >
          <Input
            value={form.code}
            onChangeText={(v) => setForm((f) => ({ ...f, code: v.toUpperCase() }))}
            placeholder="KIL-01"
            autoCapitalize="characters"
            editable={!saving && !editing}
          />
        </FormField>

        <FormField label="Address">
          <Input
            value={form.address}
            onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
            placeholder="Argwings Kodhek Rd, Nairobi"
            editable={!saving}
          />
        </FormField>

        <FormField label="Phone">
          <Input
            value={form.phone}
            onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="0712345678"
            keyboardType="phone-pad"
            editable={!saving}
          />
        </FormField>

        <FormField label="Email">
          <Input
            value={form.email}
            onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="kilimani@pharmacy.co.ke"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!saving}
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        open={deactivating !== null}
        onClose={() => setDeactivating(null)}
        onConfirm={confirmDeactivate}
        title={`Deactivate ${deactivating?.name ?? ''}?`}
        description="Staff assigned to this branch will lose access. Historical data is preserved."
        confirmLabel="Deactivate"
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
    marginBottom: 20,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  limitCard: { marginBottom: 16 },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  limitText: { fontSize: 13, flex: 1 },
  link: { fontSize: 13, fontWeight: '600' },
  list: { gap: 12 },
  branchCard: { marginBottom: 0 },
  branchHeader: { marginBottom: 12 },
  branchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  branchName: { fontSize: 16, fontWeight: '600' },
  branchCode: { fontSize: 12, marginTop: 4, fontFamily: 'Courier' },
  branchMeta: { gap: 6 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, flex: 1 },
  metaSub: { fontSize: 11, marginTop: 4 },
  branchActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.3)',
  },
});