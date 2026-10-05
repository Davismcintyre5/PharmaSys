import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Building2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Save,
  ScrollText,
  Store,
  Upload,
  User as UserIcon,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { settingsApi } from '@/api/settings';
import { authApi } from '@/api/auth';
import { useAuth } from '@/context/AuthProvider';
import { useSite } from '@/context/SiteProvider';
import { useToast } from '@/hooks/useToast';
import { roleLabel } from '@/utils/enums';
import { CURRENCIES } from '@/utils/constants';
import { cn } from '@/components/ui/_cn';
import type {
  TenantSettings,
  UpdateSettingsPayload,
  UploadSignature,
} from '@/types';

type TabKey = 'store' | 'profile' | 'receipts' | 'integrations';
type LogoMode = 'url' | 'upload';

interface FormState {
  name: string;
  currency: string;
  taxRate: string;
  taxInclusive: boolean;
  address: string;
  logoUrl: string;
  receiptHeader: string;
  receiptFooter: string;
  aiEnabled: boolean;
  smsEnabled: boolean;
}

const DEFAULTS: FormState = {
  name: '',
  currency: 'KES',
  taxRate: '16',
  taxInclusive: false,
  address: '',
  logoUrl: '',
  receiptHeader: '',
  receiptFooter: '',
  aiEnabled: true,
  smsEnabled: true,
};

function toForm(s: TenantSettings | null, name?: string): FormState {
  if (!s) return { ...DEFAULTS, name: name || '' };
  return {
    name: name || '',
    currency: s.currency || 'KES',
    taxRate: String(s.taxRate ?? 16),
    taxInclusive: !!s.taxInclusive,
    address: s.address || '',
    logoUrl: s.logoUrl || '',
    receiptHeader: s.receiptHeader || '',
    receiptFooter: s.receiptFooter || '',
    aiEnabled: s.aiEnabled !== false,
    smsEnabled: s.smsEnabled !== false,
  };
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export default function Settings() {
  const toast = useToast();
  const { user, reload: reloadAuth } = useAuth();
  const { settings: siteSettings } = useSite();
  const isOwner = user?.role === 'owner';

  const [tab, setTab] = useState<TabKey>(isOwner ? 'store' : 'profile');
  const [loading, setLoading] = useState(isOwner);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [original, setOriginal] = useState<FormState>(DEFAULTS);
  const [tenantName, setTenantName] = useState<string>('');

  // Logo upload state
  const [logoMode, setLogoMode] = useState<LogoMode>('url');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwShow, setPwShow] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  /* ─── load settings (owners only — non-owners don't need them) ─── */
  useEffect(() => {
    if (!isOwner) {
      setLoading(false);
      return;
    }
    settingsApi
      .get()
      .then((s) => {
        const t = s as TenantSettings & { name?: string };
        setTenantName(t.name || '');
        const f = toForm(t, t.name);
        setForm(f);
        setOriginal(f);
      })
      .catch((e: any) => toast.error(e?.message || 'Could not load settings'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(original);

  async function save() {
    const taxNum = Number(form.taxRate);
    if (!Number.isFinite(taxNum) || taxNum < 0 || taxNum > 100) {
      toast.error('Tax rate must be between 0 and 100');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Business name is required');
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateSettingsPayload & { name?: string } = {
        name: form.name.trim(),
        currency: form.currency,
        taxRate: taxNum,
        taxInclusive: form.taxInclusive,
        // `null` (not `undefined`) so the server can clear the field.
        // The controller uses `!== undefined` when merging, so null sticks.
        address: form.address.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        receiptHeader: form.receiptHeader.trim() || null,
        receiptFooter: form.receiptFooter.trim() || null,
        aiEnabled: form.aiEnabled,
        smsEnabled: form.smsEnabled,
      };
      const updated = (await settingsApi.update(payload)) as TenantSettings & {
        name?: string;
      };
      setTenantName(updated.name || '');
      const f = toForm(updated, updated.name);
      setForm(f);
      setOriginal(f);

      // Refresh the auth context so `useReceiptBrand()` picks up
      // the new logo/name/address on the next receipt print.
      await reloadAuth().catch(() => {});

      toast.success('Settings saved');
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  /* ─── Logo upload ─── */

  async function handleFile(file: File) {
    if (!isOwner) {
      toast.error('Only the owner can change the logo');
      return;
    }
    if (!/^image\/(png|jpe?g|svg\+xml|webp|gif)$/i.test(file.type)) {
      toast.error('Please upload a PNG, JPG, SVG, WEBP, or GIF');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('Logo must be under 2 MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const sig: UploadSignature = await settingsApi.signUpload({
        folder: 'logo',
        publicId: `tenant-${Date.now()}`,
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.api_key);
      formData.append('timestamp', String(sig.timestamp));
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);
      if (sig.public_id) formData.append('public_id', sig.public_id);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`;

      const secureUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.secure_url);
            } catch {
              reject(new Error('Invalid Cloudinary response'));
            }
          } else {
            let msg = `Upload failed (${xhr.status})`;
            try {
              const err = JSON.parse(xhr.responseText);
              if (err?.error?.message) msg = err.error.message;
            } catch {}
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });

      patch('logoUrl', secureUrl);
      setLogoMode('url');
      toast.success('Logo uploaded — remember to save');
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  /* ─── Password change ─── */

  async function changePassword() {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error('Fill in both password fields');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPwSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      toast.error(e?.message || 'Password change failed');
    } finally {
      setPwSubmitting(false);
    }
  }

  /* ─── derived ─── */

  const currencyOptions = useMemo(
    () =>
      siteSettings?.currencies?.length
        ? siteSettings.currencies.map((code) => ({ value: code, label: code }))
        : CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
    [siteSettings]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const TABS = isOwner
    ? [
        { value: 'store', label: 'Store', icon: <Store size={14} /> },
        { value: 'profile', label: 'Profile', icon: <UserIcon size={14} /> },
        { value: 'receipts', label: 'Receipts', icon: <ScrollText size={14} /> },
        { value: 'integrations', label: 'Integrations', icon: <Bot size={14} /> },
      ]
    : [
        { value: 'profile', label: 'Profile', icon: <UserIcon size={14} /> },
      ];

  const showSave =
    isOwner && (tab === 'store' || tab === 'receipts' || tab === 'integrations');

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle={
          isOwner && tenantName
            ? `Manage ${tenantName}`
            : isOwner
              ? 'Manage your pharmacy'
              : 'Your account'
        }
        breadcrumb={<Link to="/app/dashboard">Dashboard</Link>}
        actions={
          showSave && (
            <Button
              leftIcon={<Save size={14} />}
              loading={saving}
              onClick={save}
              disabled={!dirty}
            >
              Save changes
            </Button>
          )
        }
      />

      {/* Only owners see the tab bar — non-owners get a single Profile view */}
      {isOwner && TABS.length > 1 && (
        <div className="mb-6 overflow-x-auto">
          <Tabs items={TABS} value={tab} onChange={(v) => setTab(v as TabKey)} />
        </div>
      )}

      {/* ═══════════ STORE (owner only) ═══════════ */}
      {isOwner && tab === 'store' && (
        <div className="space-y-4">
          {/* Logo */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ImageIcon size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text">Logo</h2>
                  <p className="text-xs text-text-muted">
                    Shown on receipts and printed documents
                  </p>
                </div>
              </div>
              <div className="flex rounded-md border border-border bg-surface-2 p-0.5">
                <button
                  type="button"
                  onClick={() => setLogoMode('url')}
                  className={cn(
                    'rounded px-2.5 py-1 text-[11px] font-medium transition-colors',
                    logoMode === 'url'
                      ? 'bg-surface text-text shadow-sm'
                      : 'text-text-muted hover:text-text'
                  )}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setLogoMode('upload')}
                  className={cn(
                    'rounded px-2.5 py-1 text-[11px] font-medium transition-colors',
                    logoMode === 'upload'
                      ? 'bg-surface text-text shadow-sm'
                      : 'text-text-muted hover:text-text'
                  )}
                >
                  Upload
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              <div>
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-border bg-surface-2 p-3">
                  {form.logoUrl.trim() ? (
                    <img
                      src={form.logoUrl}
                      alt="Logo preview"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-text-subtle">
                      <ImageIcon size={24} />
                      <span className="text-[10px]">No logo</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-center text-[10px] text-text-subtle">
                  Live preview
                </p>
              </div>

              <div>
                {logoMode === 'url' && (
                  <>
                    <FormField
                      label="Logo URL"
                      hint="Direct link to a PNG, JPG, or SVG. Recommended 512×512 or larger."
                    >
                      <Input
                        value={form.logoUrl}
                        onChange={(e) => patch('logoUrl', e.target.value)}
                        placeholder="https://example.com/logo.png"
                        leftIcon={<ImageIcon size={14} />}
                      />
                    </FormField>
                    {form.logoUrl.trim() && (
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <a
                          href={form.logoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink size={11} /> Open
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(form.logoUrl);
                            toast.success('URL copied');
                          }}
                          className="inline-flex items-center gap-1 text-text-muted hover:text-text"
                        >
                          <Copy size={11} /> Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => patch('logoUrl', '')}
                          className="inline-flex items-center gap-1 text-danger hover:underline"
                        >
                          <X size={11} /> Clear
                        </button>
                      </div>
                    )}
                  </>
                )}

                {logoMode === 'upload' && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                      onChange={onFilePicked}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div
                      onDrop={onDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={cn(
                        'flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-2 transition-colors',
                        !uploading && 'hover:border-primary/40 hover:bg-primary/5',
                        uploading && 'cursor-wait opacity-70'
                      )}
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={20} className="animate-spin text-primary" />
                          <p className="mt-2 text-xs text-text-muted">
                            Uploading… {uploadProgress}%
                          </p>
                          <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-border">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload size={20} className="text-text-subtle" />
                          <p className="mt-2 text-xs font-medium text-text">
                            Click to upload or drag & drop
                          </p>
                          <p className="mt-1 text-[10px] text-text-subtle">
                            PNG, JPG, SVG, WEBP · max 2 MB
                          </p>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Store details */}
          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text">Store details</h2>
                <p className="text-xs text-text-muted">
                  Business name, address, currency, and tax
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                label="Business name"
                required
                hint="Appears on the sidebar, receipts, and public pages"
              >
                <Input
                  value={form.name}
                  onChange={(e) => patch('name', e.target.value)}
                  placeholder="Kilimani Pharmacy"
                  leftIcon={<Building2 size={14} />}
                />
              </FormField>

              <FormField
                label="Store address"
                hint="Appears on receipts and printed documents"
              >
                <Input
                  value={form.address}
                  onChange={(e) => patch('address', e.target.value)}
                  placeholder="Argwings Kodhek Rd, Nairobi"
                  leftIcon={<MapPin size={14} />}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Currency" required>
                  <Select
                    value={form.currency}
                    onChange={(e) => patch('currency', e.target.value)}
                    options={currencyOptions}
                  />
                </FormField>
                <FormField label="Tax rate (%)" required hint="Applied on sales">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    max={100}
                    value={form.taxRate}
                    onChange={(e) => patch('taxRate', e.target.value)}
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-text">
                    Tax-inclusive pricing
                  </p>
                  <p className="text-xs text-text-muted">
                    When on, listed prices already include tax
                  </p>
                </div>
                <Switch
                  checked={form.taxInclusive}
                  onChange={(v) => patch('taxInclusive', v)}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ PROFILE (all roles) ═══════════ */}
      {tab === 'profile' && (
        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserIcon size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text">Your profile</h2>
                <p className="text-xs text-text-muted">
                  View your account details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full name">
                  <Input value={user?.fullName || ''} disabled />
                </FormField>
                <FormField label="Email">
                  <Input value={user?.email || ''} disabled />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Phone">
                  <Input value={user?.phone || '—'} disabled />
                </FormField>
                <FormField label="Role">
                  <div className="flex h-10 items-center">
                    <Badge variant="info">{roleLabel(user?.role || '')}</Badge>
                  </div>
                </FormField>
              </div>
              <Alert variant="info">
                <div className="text-xs">
                  {user?.role === 'owner' ? (
                    <>
                      To change your own name or phone, use the{' '}
                      <Link to="/app/users" className="text-primary underline">
                        Staff
                      </Link>{' '}
                      page.
                    </>
                  ) : (
                    <>
                      To change your name or phone, ask your{' '}
                      <Link to="/app/users" className="text-primary underline">
                        branch manager or owner
                      </Link>
                      .
                    </>
                  )}
                </div>
              </Alert>
            </div>
          </Card>

          {/* Change password */}
          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lock size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text">Password</h2>
                <p className="text-xs text-text-muted">
                  Change your account password
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <FormField label="Current password" required>
                <Input
                  type={pwShow ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={pwForm.currentPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, currentPassword: e.target.value }))
                  }
                  leftIcon={<Lock size={14} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setPwShow((v) => !v)}
                      className="text-text-subtle hover:text-text"
                      tabIndex={-1}
                      aria-label={pwShow ? 'Hide password' : 'Show password'}
                    >
                      {pwShow ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                  placeholder="••••••••"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="New password"
                  required
                  hint="At least 8 characters"
                >
                  <Input
                    type={pwShow ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={pwForm.newPassword}
                    onChange={(e) =>
                      setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                    }
                    placeholder="••••••••"
                  />
                </FormField>
                <FormField label="Confirm new password" required>
                  <Input
                    type={pwShow ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={pwForm.confirmPassword}
                    onChange={(e) =>
                      setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))
                    }
                    placeholder="••••••••"
                  />
                </FormField>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={changePassword}
                  loading={pwSubmitting}
                  disabled={
                    !pwForm.currentPassword ||
                    !pwForm.newPassword ||
                    !pwForm.confirmPassword
                  }
                  leftIcon={<Lock size={14} />}
                >
                  Change password
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ RECEIPTS (owner only) ═══════════ */}
      {isOwner && tab === 'receipts' && (
        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ScrollText size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text">Receipt text</h2>
                <p className="text-xs text-text-muted">
                  Printed on every customer receipt
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                label="Receipt header"
                hint="Appears at the top of every receipt"
              >
                <Input
                  value={form.receiptHeader}
                  onChange={(e) => patch('receiptHeader', e.target.value)}
                  placeholder={form.name || 'Your pharmacy name'}
                />
              </FormField>

              <FormField
                label="Receipt footer"
                hint="Appears at the bottom — return policy, contact info, etc."
              >
                <Textarea
                  rows={3}
                  value={form.receiptFooter}
                  onChange={(e) => patch('receiptFooter', e.target.value)}
                  placeholder="Thank you for shopping with us. Goods sold are not returnable after 7 days."
                />
              </FormField>

              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wide text-text-muted">
                  Preview
                </p>
                <div className="rounded-lg border border-dashed border-border bg-surface-2 p-4">
                  <div className="mx-auto w-full max-w-xs rounded border border-border bg-surface p-3 text-center font-mono text-[11px] text-text">
                    {form.logoUrl.trim() && (
                      <img
                        src={form.logoUrl}
                        alt=""
                        className="mx-auto mb-2 h-8 w-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <p className="font-bold">{form.name || 'Pharmacy'}</p>
                    {form.address && (
                      <p className="mt-0.5 text-[10px] text-text-muted">
                        {form.address}
                      </p>
                    )}
                    {form.receiptHeader && form.receiptHeader !== form.name && (
                      <p className="mt-1 text-[10px] text-text-muted">
                        {form.receiptHeader}
                      </p>
                    )}
                    <div className="my-2 border-t border-dashed border-border" />
                    <p className="text-left text-[10px]">Item .......... KES 100</p>
                    <p className="text-left text-[10px]">Item .......... KES 250</p>
                    <div className="my-2 border-t border-dashed border-border" />
                    <p className="text-right font-bold">TOTAL: KES 350</p>
                    <div className="my-2 border-t border-dashed border-border" />
                    <p className="text-[10px] text-text-muted">
                      {form.receiptFooter || 'Thank you!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ INTEGRATIONS (owner only) ═══════════ */}
      {isOwner && tab === 'integrations' && (
        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text">Integrations</h2>
                <p className="text-xs text-text-muted">AI and messaging</p>
              </div>
            </div>

            <div className="space-y-3">
              <ToggleRow
                icon={<Bot size={14} />}
                title="AI assistant"
                description="Enable AI chat, insights, and forecasts for your team."
                checked={form.aiEnabled}
                onChange={(v) => patch('aiEnabled', v)}
              />
              <ToggleRow
                icon={<MessageSquare size={14} />}
                title="SMS notifications"
                description="Send SMS alerts to owners and patients (uses your plan quota)."
                checked={form.smsEnabled}
                onChange={(v) => patch('smsEnabled', v)}
              />
            </div>
          </Card>
        </div>
      )}

      {showSave && (
        <div className="mt-6 flex justify-end">
          <Button
            leftIcon={<Save size={14} />}
            loading={saving}
            onClick={save}
            disabled={!dirty}
            fullWidth
          >
            Save changes
          </Button>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-surface-2 px-3 py-2.5">
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 shrink-0 text-text-muted">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text">{title}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}