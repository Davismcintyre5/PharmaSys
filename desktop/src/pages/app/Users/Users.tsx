import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MoreVertical,
  Phone,
  Plus,
  ShieldOff,
  Trash2,
  UserPlus,
  UserX,
  Users as UsersIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { branchApi } from '@/api/branch';
import { userApi } from '@/api/user';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { roleLabel, userStatusLabel } from '@/utils/enums';
import { userStatusColor, roleColor } from '@/utils/colors';
import { formatRelativeTime } from '@/utils/format';
import type { Branch, User, InviteUserPayload, UserRole } from '@/types';

type TabKey = 'all' | 'owner' | 'branch_manager' | 'cashier';
type Danger = { user: User; kind: 'deactivate' | 'hard-delete' } | null;

export default function Users() {
  const toast = useToast();
  const { user: me } = useAuth();
  const isOwner = me?.role === 'owner';
  const isCashier = me?.role === 'cashier';
  const isManager = me?.role === 'branch_manager';

  const [users, setUsers] = useState<User[] | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('all');

  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [danger, setDanger] = useState<Danger>(null);
  const [saving, setSaving] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'cashier' as UserRole,
    branchId: '',
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    status: 'active' as User['status'],
  });

  async function load() {
    if (isCashier) {
      setUsers([]);
      return [];
    }
    const [list, branchList] = await Promise.all([
      userApi.list().catch(() => []),
      branchApi.list().catch(() => []),
    ]);
    setUsers(list);
    setBranches(branchList);
    return list;
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function canEdit(target: User): boolean {
    if (isCashier) return false;
    if (target.role === 'owner') return false;
    if (String(target._id) === String(me?.id)) return false;
    if (isManager) {
      if (target.role === 'branch_manager') return false;
      return target.branchIds?.some((b) => me?.branchIds?.includes(b)) ?? false;
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
      branchId: isManager && me?.branchIds?.[0] ? me.branchIds[0] : '',
    });
    setInviting(true);
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
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Could not send invitation');
    } finally {
      setSaving(false);
    }
  }

  function openEdit(target: User) {
    setEditForm({
      fullName: target.fullName,
      phone: target.phone || '',
      status: target.status,
    });
    setEditing(target);
  }

  async function submitEdit() {
    if (saving) return;
    if (!editing) return;
    setSaving(true);
    try {
      await userApi.update(editing._id, {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim() || null,
        status: editForm.status,
      } as any);
      toast.success('Staff updated');
      setEditing(null);
      await load();
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
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  const counts = useMemo(() => {
    const list = users ?? [];
    return {
      all: list.length,
      owner: list.filter((u) => u.role === 'owner').length,
      branch_manager: list.filter((u) => u.role === 'branch_manager').length,
      cashier: list.filter((u) => u.role === 'cashier').length,
    };
  }, [users]);

  const filtered = useMemo(() => {
    if (!users) return [];
    if (tab === 'all') return users;
    return users.filter((u) => u.role === tab);
  }, [users, tab]);

  const branchMap = useMemo(
    () => Object.fromEntries(branches.map((b) => [b._id, b])),
    [branches]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isCashier) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Staff"
          subtitle="Manage your team"
          breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        />
        <Card>
          <EmptyState
            icon={<ShieldOff size={22} />}
            title="No access"
            description="Cashiers cannot view the staff list. Ask your branch manager or owner."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Staff"
        subtitle={`${counts.all} team member${counts.all === 1 ? '' : 's'}`}
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        actions={
          <Button leftIcon={<UserPlus size={14} />} onClick={openInvite}>
            Invite staff
          </Button>
        }
      />

      <div className="mb-4 overflow-x-auto">
        <Tabs
          items={[
            { value: 'all', label: `All (${counts.all})` },
            { value: 'owner', label: `Owners (${counts.owner})` },
            { value: 'branch_manager', label: `Managers (${counts.branch_manager})` },
            { value: 'cashier', label: `Cashiers (${counts.cashier})` },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
        />
      </div>

      {!filtered.length ? (
        <Card>
          <EmptyState
            icon={<UsersIcon size={22} />}
            title="No staff yet"
            description={
              isOwner
                ? 'Invite your first manager or cashier to get started.'
                : 'No staff assigned to your branch yet.'
            }
            action={
              <Button leftIcon={<Plus size={14} />} onClick={openInvite}>
                Invite staff
              </Button>
            }
          />
        </Card>
      ) : (
        <Card plain className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Contact</TH>
                <TH>Role</TH>
                <TH>Branch</TH>
                <TH>Status</TH>
                <TH>Last login</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((u) => {
                const editable = canEdit(u);
                const removable = canHardDelete(u);
                const branchNames = (u.branchIds || [])
                  .map((id) => branchMap[id]?.name)
                  .filter(Boolean);
                const statusKey = userStatusColor(u.status);

                return (
                  <TR key={u._id}>
                    <TD>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text">
                          {u.fullName}
                          {String(u._id) === String(me?.id) && (
                            <span className="ml-2 text-xs text-text-subtle">(you)</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {u.email}
                        </p>
                      </div>
                    </TD>

                    <TD>
                      {u.phone ? (
                        <span className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Phone size={11} />
                          <span className="font-mono">{u.phone}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-text-subtle">—</span>
                      )}
                    </TD>

                    <TD>
                      <Badge
                        variant={
                          roleColor(u.role) === 'info'
                            ? 'info'
                            : roleColor(u.role) === 'success'
                              ? 'success'
                              : 'neutral'
                        }
                      >
                        {roleLabel(u.role)}
                      </Badge>
                    </TD>

                    <TD>
                      {branchNames.length ? (
                        <span className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Building2 size={11} />
                          <span className="truncate">
                            {branchNames.length > 1
                              ? `${branchNames[0]} +${branchNames.length - 1}`
                              : branchNames[0]}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-text-subtle">—</span>
                      )}
                    </TD>

                    <TD>
                      <Badge
                        variant={
                          statusKey === 'success'
                            ? 'success'
                            : statusKey === 'warning'
                              ? 'warning'
                              : statusKey === 'danger'
                                ? 'danger'
                                : 'neutral'
                        }
                      >
                        {userStatusLabel(u.status)}
                      </Badge>
                    </TD>

                    <TD>
                      <span className="text-xs text-text-muted">
                        {u.lastLoginAt ? formatRelativeTime(u.lastLoginAt) : 'Never'}
                      </span>
                    </TD>

                    <TD className="text-right">
                      {(editable || removable) && (
                        <Dropdown
                          align="right"
                          trigger={
                            <IconButton aria-label="Actions" size="sm">
                              <MoreVertical size={14} />
                            </IconButton>
                          }
                        >
                          {editable && (
                            <DropdownItem onClick={() => openEdit(u)}>
                              Edit details
                            </DropdownItem>
                          )}
                          {editable && (
                            <DropdownItem
                              danger
                              onClick={() =>
                                setDanger({ user: u, kind: 'deactivate' })
                              }
                            >
                              <span className="flex items-center gap-2">
                                <UserX size={14} /> Deactivate
                              </span>
                            </DropdownItem>
                          )}
                          {removable && (
                            <>
                              <DropdownSeparator />
                              <DropdownItem
                                danger
                                onClick={() =>
                                  setDanger({ user: u, kind: 'hard-delete' })
                                }
                              >
                                <span className="flex items-center gap-2">
                                  <Trash2 size={14} /> Delete permanently
                                </span>
                              </DropdownItem>
                            </>
                          )}
                        </Dropdown>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}

      <Modal
        open={inviting}
        onClose={() => setInviting(false)}
        title="Invite staff"
        onSubmit={submitInvite}
        busy={saving}
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviting(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitInvite} loading={saving}>
              Send invitation
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Full name" required>
            <Input
              value={inviteForm.fullName}
              onChange={(e) =>
                setInviteForm((f) => ({ ...f, fullName: e.target.value }))
              }
              placeholder="Jane Wanjiku"
              autoFocus
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Email" required>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="jane@pharmacy.co.ke"
              />
            </FormField>
            <FormField label="Phone">
              <Input
                type="tel"
                value={inviteForm.phone}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="0712345678"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Role" required>
              <Select
                value={inviteForm.role}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, role: e.target.value as UserRole }))
                }
                options={
                  isManager
                    ? [{ value: 'cashier', label: 'Cashier' }]
                    : [
                        { value: 'cashier', label: 'Cashier' },
                        { value: 'branch_manager', label: 'Branch Manager' },
                      ]
                }
              />
            </FormField>

            <FormField label="Branch" required>
              <Select
                value={inviteForm.branchId}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, branchId: e.target.value }))
                }
                options={[
                  { value: '', label: 'Select a branch…' },
                  ...(isManager && me?.branchIds?.length
                    ? me.branchIds
                        .map((id) => branchMap[id])
                        .filter(Boolean)
                        .map((b) => ({ value: b._id, label: b.name }))
                    : branches.map((b) => ({ value: b._id, label: b.name }))),
                ]}
              />
            </FormField>
          </div>

          <p className="text-xs text-text-subtle">
            The invitee gets an email + SMS with a link to set their password.
          </p>
        </div>
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.fullName}` : 'Edit staff'}
        onSubmit={submitEdit}
        busy={saving}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitEdit} loading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Full name" required>
            <Input
              value={editForm.fullName}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, fullName: e.target.value }))
              }
            />
          </FormField>

          <FormField label="Phone">
            <Input
              type="tel"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder="0712345678"
            />
          </FormField>

          {editing && editing.status !== 'pending' && (
            <FormField label="Status">
              <Select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    status: e.target.value as User['status'],
                  }))
                }
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
              />
            </FormField>
          )}

          {editing?.status === 'pending' && (
            <p className="text-xs text-text-subtle">
              This user hasn't accepted their invitation yet. They'll become active
              once they do.
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'hard-delete'
            ? `Permanently delete ${danger.user.fullName}?`
            : `Deactivate ${danger?.user.fullName}?`
        }
        description={
          danger?.kind === 'hard-delete' ? (
            <>
              This <strong>cannot be undone</strong>. The user's account, invitations,
              and access are removed from the database permanently. Any sales or
              activity they logged stay intact.
            </>
          ) : (
            <>
              The user is immediately locked out and can no longer sign in. Their data
              and history stay intact, and you can reactivate them later.
            </>
          )
        }
        confirmLabel={
          danger?.kind === 'hard-delete' ? 'Delete permanently' : 'Deactivate'
        }
        variant="danger"
      />
    </div>
  );
}