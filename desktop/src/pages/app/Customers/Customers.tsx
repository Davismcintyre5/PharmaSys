import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Trash2,
  UserX,
  Users as UsersIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { customerApi } from '@/api/customer';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { hasPermission } from '@/utils/permissions';
import { formatMoney, formatRelativeTime } from '@/utils/format';
import type { Customer, CustomerPayload } from '@/types';

const PAGE_SIZE = 20;

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

type Danger = { customer: Customer; kind: 'deactivate' | 'hard-delete' } | null;

export default function Customers() {
  const toast = useToast();
  const { user } = useAuth();
  const canCreate = hasPermission(user?.role, 'customers.create');
  const canUpdate = hasPermission(user?.role, 'customers.update');
  const isOwner = user?.role === 'owner';
  const currency = 'KES';

  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [danger, setDanger] = useState<Danger>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function load() {
    const list = await customerApi.list({ search: search || undefined }).catch(() => []);
    setCustomers(list);
    return list;
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(c: Customer) {
    setForm({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
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
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  const paged = useMemo(() => {
    if (!customers) return [];
    const start = (page - 1) * PAGE_SIZE;
    return customers.slice(start, start + PAGE_SIZE);
  }, [customers, page]);

  const pages = customers ? Math.max(1, Math.ceil(customers.length / PAGE_SIZE)) : 1;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Customers"
        subtitle="Loyalty and purchase history"
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        actions={
          canCreate && (
            <Button leftIcon={<Plus size={14} />} onClick={openCreate}>
              Add customer
            </Button>
          )
        }
      />

      <Card className="mb-4" plain>
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          leftIcon={<Search size={14} />}
          placeholder="Search customers by name or phone…"
        />
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !customers?.length ? (
        <Card>
          <EmptyState
            icon={<UsersIcon size={22} />}
            title={search ? 'No matches' : 'No customers yet'}
            description={
              search
                ? 'Try a different name or phone number.'
                : 'Add your first customer to track purchases and loyalty points.'
            }
            action={
              !search &&
              canCreate && (
                <Button leftIcon={<Plus size={14} />} onClick={openCreate}>
                  Add customer
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
                  <TH>Contact</TH>
                  <TH>Total spent</TH>
                  <TH>Last purchase</TH>
                  <TH>Added</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paged.map((c) => (
                  <TR key={c._id}>
                    <TD>
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-text">
                          {c.name}
                        </span>
                        {c.loyaltyPoints > 0 && (
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                            {c.loyaltyPoints} pts
                          </span>
                        )}
                      </div>
                    </TD>

                    <TD>
                      <div className="space-y-0.5">
                        {c.phone && (
                          <span className="flex items-center gap-1.5 text-xs text-text-muted">
                            <Phone size={11} />
                            <span className="font-mono">{c.phone}</span>
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1.5 text-xs text-text-muted">
                            <Mail size={11} />
                            <span className="truncate">{c.email}</span>
                          </span>
                        )}
                        {!c.phone && !c.email && (
                          <span className="text-xs text-text-subtle">—</span>
                        )}
                      </div>
                    </TD>

                    <TD>
                      <span className="text-sm font-medium text-text">
                        {formatMoney(c.totalSpent || 0, currency)}
                      </span>
                    </TD>

                    <TD>
                      <span className="text-xs text-text-muted">
                        {c.lastPurchaseAt
                          ? formatRelativeTime(c.lastPurchaseAt)
                          : 'Never'}
                      </span>
                    </TD>

                    <TD>
                      <span className="text-xs text-text-muted">
                        {c.createdAt ? formatRelativeTime(c.createdAt) : '—'}
                      </span>
                    </TD>

                    <TD className="text-right">
                      {canUpdate && (
                        <Dropdown
                          align="right"
                          trigger={
                            <IconButton aria-label="Actions" size="sm">
                              <MoreVertical size={14} />
                            </IconButton>
                          }
                        >
                          <DropdownItem onClick={() => openEdit(c)}>
                            Edit details
                          </DropdownItem>
                          <DropdownItem
                            danger
                            onClick={() => setDanger({ customer: c, kind: 'deactivate' })}
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
                                onClick={() => setDanger({ customer: c, kind: 'hard-delete' })}
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
                ))}
              </TBody>
            </Table>
          </Card>

          {pages > 1 && (
            <Pagination
              page={page}
              pages={pages}
              total={customers.length}
              onChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        open={creating || editing !== null}
        onClose={closeForm}
        title={editing ? `Edit ${editing.name}` : 'Add customer'}
        onSubmit={submit}
        busy={saving}
        footer={
          <>
            <Button variant="ghost" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {editing ? 'Save changes' : 'Add customer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Full name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jane Wanjiku"
              autoFocus
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
                placeholder="jane@example.com"
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

          <FormField label="Notes">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Preferences, referral source, anything relevant…"
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
            ? `Permanently delete ${danger.customer.name}?`
            : `Deactivate ${danger?.customer.name}?`
        }
        description={
          danger?.kind === 'hard-delete' ? (
            <>
              This <strong>cannot be undone</strong>. The customer record and its
              purchase history links will be removed. Sales themselves stay intact for
              accounting.
            </>
          ) : (
            <>
              The customer won't appear in searches or new sales. Their purchase
              history is preserved and you can reactivate later.
            </>
          )
        }
        confirmLabel={danger?.kind === 'hard-delete' ? 'Delete permanently' : 'Deactivate'}
        variant="danger"
      />
    </div>
  );
}