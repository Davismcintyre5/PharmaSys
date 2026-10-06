import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Button,
  Input,
  Select,
  FormField,
  Modal,
  ConfirmDialog,
  EmptyState,
  Spinner,
  Badge,
  Alert,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { userApi, branchApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { roleLabel, userStatusLabel } from '@/utils/enums';
import { formatRelativeTime } from '@/utils/format';
import type {
  User,
  Branch,
  InviteUserPayload,
  UserRole,
  UserStatus,
} from '@/types';

type TabKey = 'all' | UserRole;
type Danger =
  | { user: User; kind: 'deactivate' }
  | { user: User; kind: 'hard-delete' }
  | null;

function roleVariant(
  role: UserRole
): 'info' | 'success' | 'neutral' {
  switch (role) {
    case 'owner':
      return 'info';
    case 'branch_manager':
      return 'success';
    case 'cashier':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function statusVariant(
  status: UserStatus
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    case 'suspended':
      return 'danger';
    case 'rejected':
      return 'danger';
    default:
      return 'neutral';
  }
}

interface InviteForm {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  branchId: string;
}

interface EditForm {
  fullName: string;
  phone: string;
  status: UserStatus;
}

export default function Users() {
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user: me } = useAuth();

  const isOwner = me?.role === 'owner';
  const isCashier = me?.role === 'cashier';
  const isManager = me?.role === 'branch_manager';

  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);

  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [danger, setDanger] = useState<Danger>(null);
  const [saving, setSaving] = useState(false);

  const [inviteForm, setInviteForm] = useState<InviteForm>({
    fullName: '',
    email: '',
    phone: '',
    role: 'cashier',
    branchId: '',
  });

  const [editForm, setEditForm] = useState<EditForm>({
    fullName: '',
    phone: '',
    status: 'active',
  });

  const usersQuery = useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: () => userApi.list(),
    enabled: !isCashier,
  });

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches.list,
    queryFn: () => branchApi.list(),
    enabled: !isCashier,
  });

  const users: User[] = useMemo(() => {
    const raw = usersQuery.data;
    return Array.isArray(raw) ? raw : ((raw as any)?.items ?? []);
  }, [usersQuery.data]);

  const branches: Branch[] = useMemo(() => {
    const raw = branchesQuery.data;
    return Array.isArray(raw) ? raw : [];
  }, [branchesQuery.data]);

  const branchMap = useMemo(() => {
    const map: Record<string, Branch> = {};
    for (const b of branches) map[b._id] = b;
    return map;
  }, [branches]);

  const counts = useMemo(
    () => ({
      all: users.length,
      owner: users.filter((u) => u.role === 'owner').length,
      branch_manager: users.filter((u) => u.role === 'branch_manager').length,
      cashier: users.filter((u) => u.role === 'cashier').length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    let list = users;
    if (tab !== 'all') list = list.filter((u) => u.role === tab);

    const q = debounced.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, tab, debounced]);

  function canEdit(target: User): boolean {
    if (isCashier) return false;
    if (target.role === 'owner') return false;
    if (String(target._id) === String(me?.id)) return false;
    if (isManager) {
      if (target.role === 'branch_manager') return false;
      return (
        target.branchIds?.some((b) => me?.branchIds?.includes(b)) ?? false
      );
    }
    return isOwner;
  }

  function canHardDelete(target: User): boolean {
    if (!isOwner) return false;
    if (target.role === 'owner') return false;
    if (String(target._id) === String(me?.id)) return false;
    return true;
  }

  function openInvite() {
    setInviteForm({
      fullName: '',
      email: '',
      phone: '',
      role: 'cashier',
      branchId:
        isManager && me?.branchIds?.[0] ? me.branchIds[0] : '',
    });
    setInviting(true);
  }

  function openEdit(u: User) {
    setEditForm({
      fullName: u.fullName,
      phone: u.phone ?? '',
      status: u.status,
    });
    setEditing(u);
  }

  async function submitInvite() {
    if (saving) return;
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    if (!inviteForm.branchId) {
      toast.error('Please select a branch');
      return;
    }

    setSaving(true);
    try {
      const payload: InviteUserPayload = {
        email: inviteForm.email.trim().toLowerCase(),
        fullName: inviteForm.fullName.trim(),
        phone: inviteForm.phone.trim() || undefined,
        role: inviteForm.role,
        branchId: inviteForm.branchId,
      };
      await userApi.invite(payload);
      toast.success('Invitation sent');
      setInviting(false);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (e: any) {
      toast.error(e?.message || 'Could not send invitation');
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit() {
    if (saving || !editing) return;
    setSaving(true);
    try {
      await userApi.update(editing._id, {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim() || null,
        status: editForm.status,
      } as any);
      toast.success('Staff updated');
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDanger() {
    if (!danger) return;
    const { user, kind } = danger;
    try {
      if (kind === 'deactivate') {
        await userApi.remove(user._id);
        toast.success('Staff deactivated');
      } else {
        await userApi.hardRemove(user._id);
        toast.success('Staff permanently deleted');
      }
      setDanger(null);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  if (isCashier) {
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
            description="Cashiers cannot view the staff list. Ask your branch manager or owner."
          />
        </View>
      </Screen>
    );
  }

  if (usersQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  const tabs: { value: TabKey; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'owner', label: 'Owners', count: counts.owner },
    { value: 'branch_manager', label: 'Managers', count: counts.branch_manager },
    { value: 'cashier', label: 'Cashiers', count: counts.cashier },
  ];

  const inviteRoleOptions = isManager
    ? [{ value: 'cashier', label: 'Cashier' }]
    : [
        { value: 'cashier', label: 'Cashier' },
        { value: 'branch_manager', label: 'Branch Manager' },
      ];

  const inviteBranchOptions = [
    { value: '', label: 'Select a branch…' },
    ...(isManager && me?.branchIds?.length
      ? me.branchIds
          .map((id) => branchMap[id])
          .filter(Boolean)
          .map((b) => ({ value: b._id, label: b.name }))
      : branches.map((b) => ({ value: b._id, label: b.name }))),
  ];

  const renderItem = ({ item }: { item: User }) => {
    const editable = canEdit(item);
    const removable = canHardDelete(item);

    const branchNames = (item.branchIds ?? [])
      .map((id) => branchMap[id]?.name)
      .filter(Boolean);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.name, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {item.fullName}
              </Text>
              {String(item._id) === String(me?.id) ? (
                <Text
                  style={[styles.youTag, { color: theme.colors.textSubtle }]}
                >
                  (you)
                </Text>
              ) : null}
            </View>

            <Text
              style={[styles.email, { color: theme.colors.textMuted }]}
              numberOfLines={1}
            >
              {item.email}
            </Text>

            {item.phone ? (
              <Text
                style={[styles.meta, { color: theme.colors.textMuted }]}
                numberOfLines={1}
              >
                {item.phone}
              </Text>
            ) : null}

            {branchNames.length ? (
              <View style={styles.branchRow}>
                <Ionicons
                  name="business-outline"
                  size={11}
                  color={theme.colors.textSubtle}
                />
                <Text
                  style={[styles.meta, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {branchNames.length > 1
                    ? `${branchNames[0]} +${branchNames.length - 1}`
                    : branchNames[0]}
                </Text>
              </View>
            ) : null}

            <Text
              style={[styles.lastLogin, { color: theme.colors.textSubtle }]}
            >
              {item.lastLoginAt
                ? `Last login ${formatRelativeTime(item.lastLoginAt)}`
                : 'Never logged in'}
            </Text>
          </View>

          <View style={styles.cardRight}>
            <Badge variant={roleVariant(item.role)}>
              {roleLabel(item.role)}
            </Badge>
            <Badge variant={statusVariant(item.status)}>
              {userStatusLabel(item.status)}
            </Badge>
          </View>
        </View>

        {(editable || removable) && (
          <View style={styles.cardActions}>
            {editable ? (
              <Pressable
                onPress={() => openEdit(item)}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="create-outline"
                  size={12}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.actionText, { color: theme.colors.primary }]}
                >
                  Edit
                </Text>
              </Pressable>
            ) : null}

            {editable ? (
              <Pressable
                onPress={() =>
                  setDanger({ user: item, kind: 'deactivate' })
                }
                style={styles.actionBtn}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={12}
                  color={theme.colors.danger}
                />
                <Text
                  style={[styles.actionText, { color: theme.colors.danger }]}
                >
                  Deactivate
                </Text>
              </Pressable>
            ) : null}

            {removable ? (
              <Pressable
                onPress={() =>
                  setDanger({ user: item, kind: 'hard-delete' })
                }
                style={styles.actionBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={12}
                  color={theme.colors.danger}
                />
                <Text
                  style={[styles.actionText, { color: theme.colors.danger }]}
                >
                  Delete
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Staff
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {counts.all} team member{counts.all === 1 ? '' : 's'}
          </Text>
        </View>

        <Button
          title="Invite"
          size="sm"
          onPress={openInvite}
          leftIcon={
            <Ionicons name="person-add-outline" size={14} color="#ffffff" />
          }
        />
      </View>

      <View style={styles.tabsWrap}>
        {tabs.map((t) => {
          const active = tab === t.value;
          return (
            <Pressable
              key={t.value}
              onPress={() => setTab(t.value)}
              style={[
                styles.tab,
                {
                  backgroundColor: active
                    ? theme.colors.primary
                    : theme.colors.surface2,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: active ? '#ffffff' : theme.colors.textMuted,
                  },
                ]}
              >
                {t.label}
                {typeof t.count === 'number' ? ` (${t.count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, email, or phone…"
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

      {!filtered.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <Ionicons
                name="people-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title={search ? 'No matches' : 'No staff yet'}
            description={
              search
                ? 'Try a different search.'
                : isOwner
                ? 'Invite your first manager or cashier to get started.'
                : 'No staff assigned to your branch yet.'
            }
            action={
              !search ? (
                <Button
                  title="Invite staff"
                  size="sm"
                  onPress={openInvite}
                  leftIcon={
                    <Ionicons
                      name="person-add-outline"
                      size={14}
                      color="#ffffff"
                    />
                  }
                />
              ) : undefined
            }
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.bottomPad} />}
        />
      )}

      <Modal
        open={inviting}
        onClose={() => setInviting(false)}
        title="Invite staff"
        size="md"
        busy={saving}
        footer={
          <>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setInviting(false)}
              disabled={saving}
            />
            <Button
              title="Send invitation"
              onPress={submitInvite}
              loading={saving}
            />
          </>
        }
      >
        <FormField label="Full name" required>
          <Input
            value={inviteForm.fullName}
            onChangeText={(v) =>
              setInviteForm((f) => ({ ...f, fullName: v }))
            }
            placeholder="Jane Wanjiku"
            editable={!saving}
          />
        </FormField>

        <FormField label="Email" required>
          <Input
            value={inviteForm.email}
            onChangeText={(v) => setInviteForm((f) => ({ ...f, email: v }))}
            placeholder="jane@pharmacy.co.ke"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
          />
        </FormField>

        <FormField label="Phone">
          <Input
            value={inviteForm.phone}
            onChangeText={(v) => setInviteForm((f) => ({ ...f, phone: v }))}
            placeholder="0712345678"
            keyboardType="phone-pad"
            editable={!saving}
          />
        </FormField>

        <FormField label="Role" required>
          <Select
            value={inviteForm.role}
            options={inviteRoleOptions}
            onChange={(v) =>
              setInviteForm((f) => ({ ...f, role: v as UserRole }))
            }
            disabled={saving}
          />
        </FormField>

        <FormField label="Branch" required>
          <Select
            value={inviteForm.branchId}
            options={inviteBranchOptions}
            onChange={(v) =>
              setInviteForm((f) => ({ ...f, branchId: v }))
            }
            disabled={saving}
          />
        </FormField>

        <Alert variant="info">
          The invitee gets an email and SMS with a link to set their password.
        </Alert>
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.fullName}` : 'Edit staff'}
        size="md"
        busy={saving}
        footer={
          <>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setEditing(null)}
              disabled={saving}
            />
            <Button
              title="Save changes"
              onPress={submitEdit}
              loading={saving}
            />
          </>
        }
      >
        <FormField label="Full name" required>
          <Input
            value={editForm.fullName}
            onChangeText={(v) =>
              setEditForm((f) => ({ ...f, fullName: v }))
            }
            editable={!saving}
          />
        </FormField>

        <FormField label="Phone">
          <Input
            value={editForm.phone}
            onChangeText={(v) =>
              setEditForm((f) => ({ ...f, phone: v }))
            }
            placeholder="0712345678"
            keyboardType="phone-pad"
            editable={!saving}
          />
        </FormField>

        {editing && editing.status !== 'pending' ? (
          <FormField label="Status">
            <Select
              value={editForm.status}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              onChange={(v) =>
                setEditForm((f) => ({ ...f, status: v as UserStatus }))
              }
              disabled={saving}
            />
          </FormField>
        ) : null}

        {editing?.status === 'pending' ? (
          <Alert variant="info">
            This user hasn't accepted their invitation yet. They'll become
            active once they do.
          </Alert>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'hard-delete'
            ? `Permanently delete ${danger.user.fullName}?`
            : `Deactivate ${danger?.user.fullName ?? ''}?`
        }
        description={
          danger?.kind === 'hard-delete'
            ? 'This cannot be undone. The user account, invitations, and access are removed permanently. Sales activity they logged stays intact.'
            : 'The user is immediately locked out and can no longer sign in. You can reactivate them later.'
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
  tabsWrap: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabText: { fontSize: 12, fontWeight: '500' },
  searchWrap: { marginBottom: 16 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  list: { gap: 10 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardLeft: { flex: 1, minWidth: 0 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: { fontSize: 14, fontWeight: '600' },
  youTag: { fontSize: 11 },
  email: { fontSize: 12, marginTop: 3 },
  meta: { fontSize: 12, marginTop: 3 },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lastLogin: { fontSize: 11, marginTop: 6 },
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