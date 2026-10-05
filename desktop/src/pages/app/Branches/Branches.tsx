import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  PowerOff,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { branchApi } from '@/api/branch';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/format';
import type { Branch, BranchPayload } from '@/types';

interface BranchFormState {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
}

const EMPTY_FORM: BranchFormState = {
  name: '',
  code: '',
  address: '',
  phone: '',
  email: '',
};

export default function Branches() {
  const toast = useToast();
  const { user, plan } = useAuth();
  const isOwner = user?.role === 'owner';
  const maxBranches = plan?.limits?.maxBranches ?? 1;

  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    const list = await branchApi.list().catch(() => []);
    setBranches(list);
    return list;
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(branch: Branch) {
    setForm({
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
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
      await load();
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
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Could not deactivate');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeCount = branches?.filter((b) => b.isActive).length ?? 0;
  const atLimit = activeCount >= maxBranches;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Branches"
        subtitle={
          isOwner
            ? `${activeCount} of ${maxBranches} branch${maxBranches === 1 ? '' : 'es'} used on your plan`
            : 'Your assigned branches'
        }
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        actions={
          isOwner && (
            <Button
              leftIcon={<Plus size={14} />}
              onClick={openCreate}
              disabled={atLimit}
              title={atLimit ? `Plan allows ${maxBranches} branch(es)` : undefined}
            >
              New branch
            </Button>
          )
        }
      />

      {atLimit && isOwner && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-text-muted">
              You've reached the branch limit on your current plan.
            </span>
            <Link to="/app/billing">
              <Button size="sm" variant="outline">
                Upgrade plan
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {!branches?.length ? (
        <Card>
          <EmptyState
            icon={<Building2 size={22} />}
            title="No branches yet"
            description={
              isOwner
                ? 'Create your first branch to start organizing sales, staff, and stock.'
                : 'No branches have been assigned to you yet.'
            }
            action={
              isOwner && (
                <Button leftIcon={<Plus size={14} />} onClick={openCreate}>
                  New branch
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map((branch) => (
            <Card key={branch._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-text">
                      {branch.name}
                    </h3>
                    {!branch.isActive && <Badge variant="neutral">Inactive</Badge>}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-text-muted">
                    {branch.code}
                  </p>
                </div>

                {isOwner && branch.isActive && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Pencil size={12} />}
                      onClick={() => openEdit(branch)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<PowerOff size={12} />}
                      onClick={() => setDeactivating(branch)}
                    >
                      Deactivate
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-text-muted">
                {branch.address && (
                  <p className="flex items-start gap-1.5">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    <span>{branch.address}</span>
                  </p>
                )}
                {branch.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone size={12} className="shrink-0" />
                    <span className="font-mono">{branch.phone}</span>
                  </p>
                )}
                <p className="text-text-subtle">Created {formatDate(branch.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={creating || editing !== null}
        onClose={closeForm}
        title={editing ? `Edit ${editing.name}` : 'New branch'}
        size="md"
        onSubmit={submit}
        busy={saving}
        footer={
          <>
            <Button variant="ghost" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {editing ? 'Save changes' : 'Create branch'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <FormField label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Kilimani Branch"
                autoFocus
              />
            </FormField>
            <FormField label="Code" required hint="Short code, e.g. KIL-01">
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                placeholder="KIL-01"
                disabled={!!editing}
              />
            </FormField>
          </div>

          <FormField label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Argwings Kodhek Rd, Nairobi"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone">
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0712345678"
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="kilimani@pharmacy.co.ke"
              />
            </FormField>
          </div>

          {!editing && (
            <p className="text-xs text-text-subtle">
              The branch code cannot be changed after creation.
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={deactivating !== null}
        onClose={() => setDeactivating(null)}
        onConfirm={confirmDeactivate}
        title={`Deactivate ${deactivating?.name}?`}
        description={
          <>
            Staff assigned to this branch will lose access. Historical data is
            preserved. You can reactivate later from the database.
          </>
        }
        confirmLabel="Deactivate"
        variant="danger"
      />
    </div>
  );
}