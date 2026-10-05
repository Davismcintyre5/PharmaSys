import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
  UserX,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { supplierApi } from '@/api/supplier';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { hasPermission } from '@/utils/permissions';
import { formatDate } from '@/utils/format';
import type { Supplier, SupplierPayload } from '@/types';

const PAGE_SIZE = 20;

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

type Danger = { supplier: Supplier; kind: 'deactivate' | 'hard-delete' } | null;

export default function Suppliers() {
  const toast = useToast();
  const { user } = useAuth();
  const canView = hasPermission(user?.role, 'suppliers.view');
  const canManage = hasPermission(user?.role, 'suppliers.manage');
  const isOwner = user?.role === 'owner';

  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [danger, setDanger] = useState<Danger>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function load() {
    const list = await supplierApi.list({ search: search || undefined }).catch(() => []);
    setSuppliers(list);
    return list;
  }

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, canView]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(s: Supplier) {
    setForm({
      name: s.name,
      contactPerson: s.contactPerson || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
    });
    setEditing(s);
    setCreating(false);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setForm(EMPTY_FORM);
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
      await load();
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
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  const paged = useMemo(() => {
    if (!suppliers) return [];
    const start = (page - 1) * PAGE_SIZE;
    return suppliers.slice(start, start + PAGE_SIZE);
  }, [suppliers, page]);

  const pages = suppliers ? Math.max(1, Math.ceil(suppliers.length / PAGE_SIZE)) : 1;

  if (!canView) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Suppliers"
          subtitle="Manage your supply chain"
          breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        />
        <Card>
          <EmptyState
            icon={<Truck size={22} />}
            title="No access"
            description="You don't have permission to view suppliers. Ask your branch manager or owner."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Suppliers"
        subtitle="Manage your supply chain"
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        actions={
          canManage && (
            <Button leftIcon={<Plus size={14} />} onClick={openCreate}>
              Add supplier
            </Button>
          )
        }
      />

      {!canManage && (
        <Alert variant="info" className="mb-4">
          Only the owner can add or edit suppliers.
        </Alert>
      )}

      <Card className="mb-4" plain>
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          leftIcon={<Search size={14} />}
          placeholder="Search suppliers by name…"
        />
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !suppliers?.length ? (
        <Card>
          <EmptyState
            icon={<Truck size={22} />}
            title={search ? 'No matches' : 'No suppliers yet'}
            description={
              search
                ? 'Try a different name.'
                : 'Add your first supplier to start creating purchase orders.'
            }
            action={
              !search &&
              canManage && (
                <Button leftIcon={<Plus size={14} />} onClick={openCreate}>
                  Add supplier
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          <Card plain className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Contact person</TH>
                  <TH>Phone</TH>
                  <TH>Email</TH>
                  <TH>Address</TH>
                  <TH>Added</TH>
                  {canManage && <TH className="text-right">Actions</TH>}
                </TR>
              </THead>
              <TBody>
                {paged.map((s) => (
                  <TR key={s._id}>
                    <TD>
                      <span className="truncate text-sm font-medium text-text">
                        {s.name}
                      </span>
                    </TD>

                    <TD>
                      <span className="text-xs text-text-muted">
                        {s.contactPerson || '—'}
                      </span>
                    </TD>

                    <TD>
                      {s.phone ? (
                        <span className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Phone size={11} />
                          <span className="font-mono">{s.phone}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-text-subtle">—</span>
                      )}
                    </TD>

                    <TD>
                      {s.email ? (
                        <span className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Mail size={11} />
                          <span className="truncate">{s.email}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-text-subtle">—</span>
                      )}
                    </TD>

                    <TD>
                      {s.address ? (
                        <span className="flex items-center gap-1.5 text-xs text-text-muted">
                          <MapPin size={11} />
                          <span className="truncate">{s.address}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-text-subtle">—</span>
                      )}
                    </TD>

                    <TD>
                      <span className="text-xs text-text-muted">
                        {formatDate(s.createdAt)}
                      </span>
                    </TD>

                    {canManage && (
                      <TD className="text-right">
                        <Dropdown
                          align="right"
                          trigger={
                            <IconButton aria-label="Actions" size="sm">
                              <MoreVertical size={14} />
                            </IconButton>
                          }
                        >
                          <DropdownItem onClick={() => openEdit(s)}>
                            Edit details
                          </DropdownItem>
                          <DropdownItem
                            danger
                            onClick={() => setDanger({ supplier: s, kind: 'deactivate' })}
                          >
                            <span className="flex items-center gap-2">
                              <UserX size={14} /> Deactivate
                            </span>
                          </DropdownItem>
                          {isOwner && (
                            <>
                              <DropdownSeparator />
                              <DropdownItem
                                danger
                                onClick={() => setDanger({ supplier: s, kind: 'hard-delete' })}
                              >
                                <span className="flex items-center gap-2">
                                  <Trash2 size={14} /> Delete permanently
                                </span>
                              </DropdownItem>
                            </>
                          )}
                        </Dropdown>
                      </TD>
                    )}
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>

          {pages > 1 && (
            <Pagination
              page={page}
              pages={pages}
              total={suppliers.length}
              onChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        open={creating || editing !== null}
        onClose={closeForm}
        title={editing ? `Edit ${editing.name}` : 'Add supplier'}
        onSubmit={submit}
        busy={saving}
        footer={
          <>
            <Button variant="ghost" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {editing ? 'Save changes' : 'Add supplier'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Business name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nairobi Pharma Distributors"
              autoFocus
            />
          </FormField>

          <FormField label="Contact person">
            <Input
              value={form.contactPerson}
              onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
              placeholder="John Kamau"
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
                placeholder="orders@supplier.co.ke"
              />
            </FormField>
          </div>

          <FormField label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Industrial Area, Nairobi"
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'hard-delete'
            ? `Permanently delete ${danger.supplier.name}?`
            : `Deactivate ${danger?.supplier.name}?`
        }
        description={
          danger?.kind === 'hard-delete' ? (
            <>
              This <strong>cannot be undone</strong>. The supplier record and its links to
              purchase orders will be removed. Historical POs stay intact for accounting.
            </>
          ) : (
            <>
              The supplier won't appear in new purchase orders. Their history is preserved
              and you can reactivate later.
            </>
          )
        }
        confirmLabel={danger?.kind === 'hard-delete' ? 'Delete permanently' : 'Deactivate'}
        variant="danger"
      />
    </div>
  );
}