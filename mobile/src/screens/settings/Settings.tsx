import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Input,
  Textarea,
  Select,
  FormField,
  Switch,
  Spinner,
  Alert,
  Badge,
  Divider,
  ConfirmDialog,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useSite } from '@/context/SiteProvider';
import { useToast } from '@/hooks/useToast';
import { settingsApi, authApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { CURRENCIES, APP_VERSION } from '@/utils/constants';
import { roleLabel } from '@/utils/enums';
import { checkForUpdate } from '@/utils/updateChecker';
import type {
  TenantSettings,
  UpdateSettingsPayload,
  UploadSignature,
} from '@/types';

type TabKey =
  | 'store'
  | 'profile'
  | 'receipts'
  | 'integrations'
  | 'updates'
  | 'logout';

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

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function toForm(s: TenantSettings | null, name?: string): FormState {
  if (!s) return { ...DEFAULTS, name: name ?? '' };
  return {
    name: name ?? '',
    currency: s.currency ?? 'KES',
    taxRate: String(s.taxRate ?? 16),
    taxInclusive: !!s.taxInclusive,
    address: s.address ?? '',
    logoUrl: s.logoUrl ?? '',
    receiptHeader: s.receiptHeader ?? '',
    receiptFooter: s.receiptFooter ?? '',
    aiEnabled: s.aiEnabled !== false,
    smsEnabled: s.smsEnabled !== false,
  };
}

export default function Settings() {
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, tenant, reload: reloadAuth, logout } = useAuth();
  const { settings: siteSettings } = useSite();

  const isOwner = user?.role === 'owner';

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings.tenant,
    queryFn: () => settingsApi.get(),
    enabled: isOwner,
  });

  const initialTab: TabKey = isOwner ? 'store' : 'profile';
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [original, setOriginal] = useState<FormState>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwShow, setPwShow] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    if (!settingsQuery.data) return;
    const s = settingsQuery.data as TenantSettings;
    const f = toForm(s, tenant?.name);
    setForm(f);
    setOriginal(f);
  }, [settingsQuery.data, tenant?.name]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(original),
    [form, original]
  );

  const currencyOptions = useMemo(() => {
    if (siteSettings?.currencies?.length) {
      return siteSettings.currencies.map((c) => ({ value: c, label: c }));
    }
    return CURRENCIES.map((c) => ({
      value: c.code,
      label: `${c.code} — ${c.name}`,
    }));
  }, [siteSettings]);

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
        address: form.address.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        receiptHeader: form.receiptHeader.trim() || null,
        receiptFooter: form.receiptFooter.trim() || null,
        aiEnabled: form.aiEnabled,
        smsEnabled: form.smsEnabled,
      };

      const updated = (await settingsApi.update(payload)) as TenantSettings;

      const f = toForm(updated, form.name);
      setForm(f);
      setOriginal(f);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.settings.tenant,
      });
      await reloadAuth().catch(() => {});

      toast.success('Settings saved');
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function pickLogo() {
    if (!isOwner) {
      toast.error('Only the owner can change the logo');
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error('Permission to access photos is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      exif: false,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset) return;

    if (asset.fileSize && asset.fileSize > MAX_LOGO_BYTES) {
      toast.error('Logo must be under 2 MB');
      return;
    }

    setUploading(true);
    try {
      const sig: UploadSignature = await settingsApi.signUpload({
        folder: 'logo',
        publicId: `tenant-${Date.now()}`,
      });

      const formData = new FormData();

      formData.append('file', {
        uri: asset.uri,
        type: asset.mimeType ?? 'image/jpeg',
        name: asset.fileName ?? `logo-${Date.now()}.jpg`,
      } as any);
      formData.append('api_key', sig.api_key);
      formData.append('timestamp', String(sig.timestamp));
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);
      if (sig.public_id) formData.append('public_id', sig.public_id);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message ?? 'Upload failed');
      }

      patch('logoUrl', data.secure_url);
      toast.success('Logo uploaded — remember to save');
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

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

  async function handleCheckUpdate() {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    try {
      await checkForUpdate(true);
    } finally {
      setCheckingUpdate(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      queryClient.clear();
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  }

  const tabs: {
    value: TabKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = isOwner
    ? [
        { value: 'store', label: 'Store', icon: 'storefront-outline' },
        { value: 'profile', label: 'Profile', icon: 'person-outline' },
        {
          value: 'receipts',
          label: 'Receipts',
          icon: 'document-text-outline',
        },
        {
          value: 'integrations',
          label: 'Integrations',
          icon: 'extension-puzzle-outline',
        },
        {
          value: 'updates',
          label: 'Updates',
          icon: 'cloud-download-outline',
        },
        {
          value: 'logout',
          label: 'Logout',
          icon: 'log-out-outline',
        },
      ]
    : [
        { value: 'profile', label: 'Profile', icon: 'person-outline' },
        {
          value: 'updates',
          label: 'Updates',
          icon: 'cloud-download-outline',
        },
        {
          value: 'logout',
          label: 'Logout',
          icon: 'log-out-outline',
        },
      ];

  if (settingsQuery.isLoading && isOwner) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  const showSave =
    isOwner &&
    (tab === 'store' || tab === 'receipts' || tab === 'integrations');

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Settings
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {isOwner && tenant?.name ? `Manage ${tenant.name}` : 'Your account'}
          </Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        {tabs.map((t) => {
          const active = tab === t.value;
          const isDanger = t.value === 'logout';
          const activeColor = isDanger
            ? theme.colors.danger
            : theme.colors.primary;
          return (
            <Pressable
              key={t.value}
              onPress={() => setTab(t.value)}
              style={[
                styles.tab,
                {
                  backgroundColor: active
                    ? activeColor
                    : theme.colors.surface2,
                },
              ]}
            >
              <Ionicons
                name={t.icon}
                size={14}
                color={active ? '#ffffff' : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: active ? '#ffffff' : theme.colors.textMuted,
                  },
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isOwner && tab === 'store' ? (
        <>
          <Card style={styles.section} header="Logo">
            <View style={styles.logoRow}>
              <View
                style={[
                  styles.logoPreview,
                  {
                    backgroundColor: theme.colors.surface2,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {form.logoUrl.trim() ? (
                  <Image
                    source={{ uri: form.logoUrl }}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={theme.colors.textSubtle}
                  />
                )}
              </View>

              <View style={styles.logoActions}>
                <Button
                  title={form.logoUrl ? 'Change logo' : 'Upload logo'}
                  size="sm"
                  variant="outline"
                  onPress={pickLogo}
                  loading={uploading}
                  leftIcon={
                    <Ionicons
                      name="cloud-upload-outline"
                      size={14}
                      color={theme.colors.text}
                    />
                  }
                />

                {form.logoUrl ? (
                  <Button
                    title="Remove"
                    size="sm"
                    variant="ghost"
                    onPress={() => patch('logoUrl', '')}
                    leftIcon={
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color={theme.colors.danger}
                      />
                    }
                  />
                ) : null}

                <Text
                  style={[styles.logoHint, { color: theme.colors.textSubtle }]}
                >
                  PNG, JPG, SVG — max 2 MB. Square works best.
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.section} header="Store details">
            <FormField label="Business name" required>
              <Input
                value={form.name}
                onChangeText={(v) => patch('name', v)}
                placeholder="Kilimani Pharmacy"
                editable={!saving}
              />
            </FormField>

            <FormField label="Store address">
              <Input
                value={form.address}
                onChangeText={(v) => patch('address', v)}
                placeholder="Argwings Kodhek Rd, Nairobi"
                editable={!saving}
              />
            </FormField>

            <FormField label="Currency" required>
              <Select
                value={form.currency}
                options={currencyOptions}
                onChange={(v) => patch('currency', v)}
                disabled={saving}
              />
            </FormField>

            <FormField label="Tax rate (%)" required hint="Applied on sales">
              <Input
                value={form.taxRate}
                onChangeText={(v) => patch('taxRate', v)}
                keyboardType="decimal-pad"
                placeholder="16"
                editable={!saving}
              />
            </FormField>

            <View
              style={[
                styles.switchRow,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface2,
                },
              ]}
            >
              <View style={styles.switchText}>
                <Text
                  style={[styles.switchTitle, { color: theme.colors.text }]}
                >
                  Tax-inclusive pricing
                </Text>
                <Text
                  style={[
                    styles.switchDesc,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  When on, listed prices already include tax
                </Text>
              </View>
              <Switch
                checked={form.taxInclusive}
                onChange={(v) => patch('taxInclusive', v)}
                disabled={saving}
              />
            </View>
          </Card>
        </>
      ) : null}

      {tab === 'profile' ? (
        <>
          <Card style={styles.section} header="Your profile">
            <FormField label="Full name">
              <Input value={user?.fullName ?? ''} editable={false} />
            </FormField>

            <FormField label="Email">
              <Input value={user?.email ?? ''} editable={false} />
            </FormField>

            <FormField label="Phone">
              <Input value={user?.phone ?? '—'} editable={false} />
            </FormField>

            <FormField label="Role">
              <View style={styles.roleRow}>
                <Badge variant="info">{roleLabel(user?.role ?? '')}</Badge>
              </View>
            </FormField>

            <Alert variant="info">
              {isOwner
                ? 'To change your own name or phone, use the Staff page.'
                : 'To change your name or phone, ask your branch manager or owner.'}
            </Alert>
          </Card>

          <Card style={styles.section} header="Password">
            <FormField label="Current password" required>
              <Input
                value={pwForm.currentPassword}
                onChangeText={(v) =>
                  setPwForm((f) => ({ ...f, currentPassword: v }))
                }
                placeholder="Enter current password"
                secureTextEntry={!pwShow}
                autoCapitalize="none"
                editable={!pwSubmitting}
                rightIcon={
                  <Pressable onPress={() => setPwShow((v) => !v)} hitSlop={8}>
                    <Ionicons
                      name={pwShow ? 'eye-off-outline' : 'eye-outline'}
                      size={16}
                      color={theme.colors.textSubtle}
                    />
                  </Pressable>
                }
              />
            </FormField>

            <FormField
              label="New password"
              required
              hint="At least 8 characters"
            >
              <Input
                value={pwForm.newPassword}
                onChangeText={(v) =>
                  setPwForm((f) => ({ ...f, newPassword: v }))
                }
                placeholder="Enter new password"
                secureTextEntry={!pwShow}
                autoCapitalize="none"
                editable={!pwSubmitting}
              />
            </FormField>

            <FormField label="Confirm new password" required>
              <Input
                value={pwForm.confirmPassword}
                onChangeText={(v) =>
                  setPwForm((f) => ({ ...f, confirmPassword: v }))
                }
                placeholder="Repeat new password"
                secureTextEntry={!pwShow}
                autoCapitalize="none"
                editable={!pwSubmitting}
              />
            </FormField>

            <Button
              title="Change password"
              onPress={changePassword}
              loading={pwSubmitting}
              disabled={
                !pwForm.currentPassword ||
                !pwForm.newPassword ||
                !pwForm.confirmPassword
              }
              fullWidth
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={14}
                  color="#ffffff"
                />
              }
            />
          </Card>
        </>
      ) : null}

      {isOwner && tab === 'receipts' ? (
        <>
          <Card style={styles.section} header="Receipt text">
            <FormField
              label="Receipt header"
              hint="Appears at the top of every receipt"
            >
              <Input
                value={form.receiptHeader}
                onChangeText={(v) => patch('receiptHeader', v)}
                placeholder={form.name || 'Your pharmacy name'}
                editable={!saving}
              />
            </FormField>

            <FormField
              label="Receipt footer"
              hint="Return policy, contact info, etc."
            >
              <Textarea
                value={form.receiptFooter}
                onChangeText={(v) => patch('receiptFooter', v)}
                placeholder="Thank you for shopping with us. Goods sold are not returnable after 7 days."
                editable={!saving}
              />
            </FormField>
          </Card>

          <Card style={styles.section} header="Preview">
            <View
              style={[
                styles.preview,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface2,
                },
              ]}
            >
              <View
                style={[
                  styles.previewPaper,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                {form.logoUrl.trim() ? (
                  <Image
                    source={{ uri: form.logoUrl }}
                    style={styles.previewLogo}
                    resizeMode="contain"
                  />
                ) : null}

                <Text
                  style={[styles.previewName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {form.name || 'Pharmacy'}
                </Text>

                {form.address ? (
                  <Text
                    style={[
                      styles.previewMeta,
                      { color: theme.colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {form.address}
                  </Text>
                ) : null}

                {form.receiptHeader && form.receiptHeader !== form.name ? (
                  <Text
                    style={[
                      styles.previewMeta,
                      { color: theme.colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {form.receiptHeader}
                  </Text>
                ) : null}

                <View
                  style={[
                    styles.previewDivider,
                    { borderColor: theme.colors.border },
                  ]}
                />

                <View style={styles.previewLine}>
                  <Text
                    style={[styles.previewItem, { color: theme.colors.text }]}
                  >
                    Item .......... KES 100
                  </Text>
                </View>
                <View style={styles.previewLine}>
                  <Text
                    style={[styles.previewItem, { color: theme.colors.text }]}
                  >
                    Item .......... KES 250
                  </Text>
                </View>

                <View
                  style={[
                    styles.previewDivider,
                    { borderColor: theme.colors.border },
                  ]}
                />

                <Text
                  style={[styles.previewTotal, { color: theme.colors.text }]}
                >
                  TOTAL: KES 350
                </Text>

                <View
                  style={[
                    styles.previewDivider,
                    { borderColor: theme.colors.border },
                  ]}
                />

                <Text
                  style={[
                    styles.previewFooter,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {form.receiptFooter || 'Thank you!'}
                </Text>
              </View>
            </View>
          </Card>
        </>
      ) : null}

      {isOwner && tab === 'integrations' ? (
        <Card style={styles.section} header="Integrations">
          <ToggleRow
            icon="sparkles-outline"
            title="AI assistant"
            description="Enable AI chat, insights, and forecasts for your team."
            checked={form.aiEnabled}
            onChange={(v) => patch('aiEnabled', v)}
            disabled={saving}
          />
          <Divider style={styles.divider} />
          <ToggleRow
            icon="chatbubble-ellipses-outline"
            title="SMS notifications"
            description="Send SMS alerts to owners and patients (uses your plan quota)."
            checked={form.smsEnabled}
            onChange={(v) => patch('smsEnabled', v)}
            disabled={saving}
          />
        </Card>
      ) : null}

      {tab === 'updates' ? (
        <>
          <Card style={styles.section} header="App information">
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                Version
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                v{APP_VERSION}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                Build
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                PharmaSys
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                Platform
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                Android
              </Text>
            </View>
          </Card>

          <Card style={styles.section} header="Updates">
            <Text
              style={[styles.updateDesc, { color: theme.colors.textMuted }]}
            >
              PharmaSys updates are delivered as APK downloads from GitHub
              Releases. Tap below to check for the latest version.
            </Text>

            <Button
              title={checkingUpdate ? 'Checking…' : 'Check for updates'}
              onPress={handleCheckUpdate}
              loading={checkingUpdate}
              disabled={checkingUpdate}
              fullWidth
              size="lg"
              leftIcon={
                <Ionicons
                  name="cloud-download-outline"
                  size={16}
                  color="#ffffff"
                />
              }
            />

            <View style={styles.updateHintWrap}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={theme.colors.textSubtle}
              />
              <Text
                style={[
                  styles.updateHint,
                  { color: theme.colors.textSubtle },
                ]}
              >
                Update checks happen automatically at launch. This button
                triggers a manual check.
              </Text>
            </View>
          </Card>
        </>
      ) : null}

      {tab === 'logout' ? (
        <Card style={styles.section} header="Session">
          <View style={styles.logoutIntro}>
            <View
              style={[
                styles.logoutIcon,
                { backgroundColor: theme.colors.danger + '15' },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={28}
                color={theme.colors.danger}
              />
            </View>

            <Text
              style={[styles.logoutTitle, { color: theme.colors.text }]}
            >
              Sign out of PharmaSys
            </Text>
            <Text
              style={[styles.logoutDesc, { color: theme.colors.textMuted }]}
            >
              You'll need to enter your credentials again to access your
              pharmacy. Any unsaved cart items will be lost.
            </Text>
          </View>

          <Button
            title="Sign out"
            variant="danger"
            onPress={() => setConfirmLogout(true)}
            loading={loggingOut}
            disabled={loggingOut}
            fullWidth
            size="lg"
            leftIcon={
              <Ionicons
                name="log-out-outline"
                size={16}
                color="#ffffff"
              />
            }
          />

          <View style={styles.logoutAccount}>
            <Text
              style={[styles.logoutAccountLabel, { color: theme.colors.textSubtle }]}
            >
              Signed in as
            </Text>
            <Text
              style={[styles.logoutAccountValue, { color: theme.colors.text }]}
            >
              {user?.email ?? '—'}
            </Text>
          </View>
        </Card>
      ) : null}

      {showSave ? (
        <View style={styles.saveWrap}>
          <Button
            title={saving ? 'Saving…' : 'Save changes'}
            onPress={save}
            loading={saving}
            disabled={!dirty}
            fullWidth
            size="lg"
            leftIcon={
              <Ionicons name="save-outline" size={16} color="#ffffff" />
            }
          />
        </View>
      ) : null}

      <View style={styles.bottomPad} />

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Sign out?"
        description="You'll need to sign in again to access PharmaSys. Any unsaved cart items will be lost."
        confirmLabel="Sign out"
        variant="danger"
        loading={loggingOut}
      />
    </Screen>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <View
        style={[
          styles.toggleIcon,
          { backgroundColor: theme.colors.primary + '15' },
        ]}
      >
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
      </View>
      <View style={styles.toggleText}>
        <Text style={[styles.switchTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.switchDesc, { color: theme.colors.textMuted }]}>
          {description}
        </Text>
      </View>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginTop: 16, marginBottom: 16 },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  tabsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tabText: { fontSize: 12, fontWeight: '500' },
  section: { marginBottom: 16 },
  logoRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  logoPreview: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  logoActions: {
    flex: 1,
    gap: 8,
  },
  logoHint: { fontSize: 11, marginTop: 4, lineHeight: 15 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  switchText: { flex: 1 },
  switchTitle: { fontSize: 14, fontWeight: '500' },
  switchDesc: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  roleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600' },
  updateDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  updateHintWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 12,
  },
  updateHint: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  logoutIntro: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  logoutDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  logoutAccount: {
    marginTop: 24,
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.3)',
  },
  logoutAccountLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutAccountValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  preview: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  previewPaper: {
    width: '100%',
    maxWidth: 280,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewLogo: { width: 40, height: 40, marginBottom: 8 },
  previewName: { fontSize: 15, fontWeight: '700' },
  previewMeta: { fontSize: 10, marginTop: 2 },
  previewDivider: {
    width: '100%',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  previewLine: { width: '100%', alignItems: 'flex-start' },
  previewItem: { fontSize: 10 },
  previewTotal: { fontSize: 12, fontWeight: '700' },
  previewFooter: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  divider: { marginVertical: 12 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { flex: 1 },
  saveWrap: { marginTop: 8, marginBottom: 16 },
  bottomPad: { height: 24 },
});