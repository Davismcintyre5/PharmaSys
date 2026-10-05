import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserX,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { patientApi } from '@/api/patient';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { hasPermission } from '@/utils/permissions';
import { formatDate } from '@/utils/format';
import { genderLabel } from '@/utils/enums';
import type { Patient, PatientPayload, Gender } from '@/types';

const PAGE_SIZE = 20;

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

type Danger = { patient: Patient; kind: 'deactivate' | 'hard-delete' } | null;

export default function Patients() {
  const toast = useToast();
  const { user } = useAuth();
  const canCreate = hasPermission(user?.role, 'patients.create');
  const canUpdate = hasPermission(user?.role, 'patients.update');
  const isOwner = user?.role === 'owner';

  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [danger, setDanger] = useState<Danger>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function load() {
    const list = await patientApi.list({ search: search || undefined }).catch(() => []);
    setPatients(list);
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

  function openEdit(p: Patient) {
    setForm({
      name: p.name,
      phone: p.phone || '',
      email: p.email || '',
      dob: p.dob ? p.dob.slice(0, 10) : '',
      gender: (p.gender as Gender) || '',
      allergies: (p.allergies || []).join(', '),
      chronicConditions: (p.chronicConditions || []).join(', '),
      notes: p.notes || '',
    });
    setEditing(p);
    setCreating(false);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setForm(EMPTY_FORM);
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
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  const paged = useMemo(() => {
    if (!patients) return [];
    const start = (page - 1) * PAGE_SIZE;
    return patients.slice(start, start + PAGE_SIZE);
  }, [patients, page]);

  const pages = patients ? Math.max(1, Math.ceil(patients.length / PAGE_SIZE)) : 1;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Patients"
        subtitle="Medical records and history"
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        actions={
          canCreate && (
            <Button leftIcon={<Plus size={14} />} onClick={openCreate}>
              Add patient
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
          placeholder="Search patients by name or phone…"
        />
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !patients?.length ? (
        <Card>
          <EmptyState
            icon={<Stethoscope size={22} />}
            title={search ? 'No matches' : 'No patients yet'}
            description={
              search
                ? 'Try a different name or phone number.'
                : 'Add your first patient to start tracking prescriptions and history.'
            }
            action={
              !search &&
              canCreate && (
                <Button leftIcon={<Plus size={14} />} onClick={openCreate}>
                  Add patient
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
                  <TH>Gender</TH>
                  <TH>Allergies</TH>
                  <TH>Added</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paged.map((p) => (
                  <TR key={p._id}>
                    <TD>
                      <Link
                        to={`/app/patients/${p._id}`}
                        className="truncate text-sm font-medium text-text hover:text-primary"
                      >
                        {p.name}
                      </Link>
                    </TD>

                    <TD>
                      <div className="space-y-0.5">
                        {p.phone && (
                          <span className="flex items-center gap-1.5 text-xs text-text-muted">
                            <Phone size={11} />
                            <span className="font-mono">{p.phone}</span>
                          </span>
                        )}
                        {p.email && (
                          <span className="flex items-center gap-1.5 text-xs text-text-muted">
                            <Mail size={11} />
                            <span className="truncate">{p.email}</span>
                          </span>
                        )}
                        {!p.phone && !p.email && (
                          <span className="text-xs text-text-subtle">—</span>
                        )}
                      </div>
                    </TD>

                    <TD>
                      <span className="text-xs text-text-muted">
                        {p.gender ? genderLabel(p.gender) : '—'}
                      </span>
                    </TD>

                    <TD>
                      {p.allergies?.length ? (
                        <span className="text-xs text-danger">
                          {p.allergies.slice(0, 2).join(', ')}
                          {p.allergies.length > 2 && ` +${p.allergies.length - 2}`}
                        </span>
                      ) : (
                        <span className="text-xs text-text-subtle">None</span>
                      )}
                    </TD>

                    <TD>
                      <span className="text-xs text-text-muted">
                        {formatDate(p.createdAt)}
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
                          <DropdownItem onClick={() => openEdit(p)}>
                            Edit details
                          </DropdownItem>
                          <DropdownItem
                            danger
                            onClick={() => setDanger({ patient: p, kind: 'deactivate' })}
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
                                onClick={() => setDanger({ patient: p, kind: 'hard-delete' })}
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
              total={patients.length}
              onChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        open={creating || editing !== null}
        onClose={closeForm}
        title={editing ? `Edit ${editing.name}` : 'Add patient'}
        size="lg"
        onSubmit={submit}
        busy={saving}
        footer={
          <>
            <Button variant="ghost" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {editing ? 'Save changes' : 'Add patient'}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date of birth">
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
              />
            </FormField>
            <FormField label="Gender">
              <Select
                value={form.gender}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gender: e.target.value as FormState['gender'] }))
                }
                options={[
                  { value: '', label: 'Not specified' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </FormField>
          </div>

          <FormField
            label="Allergies"
            hint="Comma-separated. E.g. Penicillin, Sulfa drugs"
          >
            <Input
              value={form.allergies}
              onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
              placeholder="Penicillin, Aspirin"
            />
          </FormField>

          <FormField
            label="Chronic conditions"
            hint="Comma-separated. E.g. Diabetes, Hypertension"
          >
            <Input
              value={form.chronicConditions}
              onChange={(e) => setForm((f) => ({ ...f, chronicConditions: e.target.value }))}
              placeholder="Diabetes"
            />
          </FormField>

          <FormField label="Notes">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional clinical notes…"
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
            ? `Permanently delete ${danger.patient.name}?`
            : `Deactivate ${danger?.patient.name}?`
        }
        description={
          danger?.kind === 'hard-delete' ? (
            <>
              This <strong>cannot be undone</strong>. The patient record and its links to
              prescriptions will be removed. Sales history that references the patient
              will stay intact for accounting.
            </>
          ) : (
            <>
              The patient won't appear in searches or new prescriptions. Their history is
              preserved and you can reactivate later.
            </>
          )
        }
        confirmLabel={danger?.kind === 'hard-delete' ? 'Delete permanently' : 'Deactivate'}
        variant="danger"
      />
    </div>
  );
}