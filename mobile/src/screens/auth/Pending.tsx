import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Input, FormField, Alert, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { authApi, billingApi } from '@/api/axios';
import { formatMoney, formatDate } from '@/utils/format';
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  formatKenyanPhoneDisplay,
} from '@/utils/phone';
import type { PublicInvoice } from '@/types';

export default function Pending() {
  const { theme } = useTheme();
  const toast = useToast();
  const {
    user,
    tenant,
    isAuthenticated,
    scope,
    logout,
    setInvoice,
    reload,
  } = useAuth();

  const [invoice, setLocalInvoice] = useState<PublicInvoice | null>(null);
  const [invoiceLoaded, setInvoiceLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [pollingFast, setPollingFast] = useState(false);

  const fastPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadInvoice() {
    try {
      const fresh = await billingApi.invoice();

      console.log('[Pending] invoice fetch:', {
        got: Boolean(fresh),
        number: fresh?.invoiceNumber,
        status: fresh?.status,
        purpose: fresh?.purpose,
        amountDue: fresh?.amountDue,
      });

      setLocalInvoice(fresh ?? null);
      setInvoice(fresh ?? null);
      return fresh;
    } catch (e) {
      console.log('[Pending] invoice fetch error:', e);
      setLocalInvoice(null);
      setInvoice(null);
      return null;
    } finally {
      setInvoiceLoaded(true);
    }
  }

  async function checkTenant(): Promise<boolean> {
    try {
      const me = await authApi.me();
      if (me.tenant.status === 'active') {
        await reload();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated || scope !== 'pending') return;

    const interval = setInterval(async () => {
      const done = await checkTenant();
      if (done) return;
      await loadInvoice();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, scope]);

  function startFastPoll() {
    stopFastPoll();
    setPollingFast(true);

    let attempts = 0;
    fastPollRef.current = setInterval(async () => {
      attempts++;
      const fresh = await loadInvoice();

      if (fresh?.status === 'paid') {
        stopFastPoll();
        toast.success('Payment received!');
        return;
      }

      if (attempts >= 20) {
        stopFastPoll();
        toast.info('Payment still pending. We will update when confirmed.');
      }
    }, 3000);
  }

  function stopFastPoll() {
    if (fastPollRef.current !== null) {
      clearInterval(fastPollRef.current);
      fastPollRef.current = null;
    }
    setPollingFast(false);
  }

  useEffect(() => {
    return () => stopFastPoll();
  }, []);

  async function checkStatus() {
    setRefreshing(true);
    try {
      const done = await checkTenant();
      if (done) return;
      await loadInvoice();
      toast.info('Status refreshed');
    } finally {
      setRefreshing(false);
    }
  }

  async function payWithMpesa() {
    const normalized = normalizeKenyanPhone(phone);
    if (!normalized) {
      toast.error('Enter a valid Kenyan phone number');
      return;
    }
    if (!invoice) {
      toast.error('No invoice loaded. Pull to refresh and try again.');
      return;
    }

    console.log('[Pending] stk push attempt:', {
      phone: normalized,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      amountDue: invoice.amountDue,
    });

    setPaying(true);
    try {
      await billingApi.stkPush(normalized, invoice.invoiceNumber);
      toast.success(
        `Payment prompt sent to ${formatKenyanPhoneDisplay(normalized)}.`
      );
      startFastPoll();
    } catch (err: any) {
      console.log('[Pending] stk push error:', err);
      toast.error(err?.message || 'Failed to send payment prompt');
    } finally {
      setPaying(false);
    }
  }

  const isPaid = invoice?.status === 'paid';
  const canPay = Boolean(
    invoiceLoaded && invoice && !isPaid && invoice.amountDue > 0
  );
  const instructions = invoice?.paymentInstructions ?? [];
  const phoneValid = isValidKenyanPhone(phone);

  return (
    <Screen scroll onRefresh={checkStatus} refreshing={refreshing}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: theme.colors.primary + '15' },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={32}
            color={theme.colors.primary}
          />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Waiting for approval
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Thanks for registering {tenant?.name ?? ''}
        </Text>
      </View>

      <Alert variant="info">
        We've received your registration and our team is reviewing it. You'll get
        an email once your account is live.
      </Alert>

      {invoiceLoaded && invoice ? (
        <Card style={styles.invoiceCard}>
          <View
            style={[
              styles.statusRow,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Ionicons
              name={isPaid ? 'checkmark-circle' : 'hourglass-outline'}
              size={18}
              color={isPaid ? theme.colors.success : theme.colors.warning}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: isPaid ? theme.colors.success : theme.colors.warning,
                },
              ]}
            >
              {isPaid ? 'Payment received' : 'Awaiting payment'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              Invoice
            </Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {invoice.invoiceNumber}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              Amount due
            </Text>
            <Text style={[styles.valueBold, { color: theme.colors.text }]}>
              {formatMoney(invoice.amountDue, invoice.currency)}
            </Text>
          </View>

          {invoice.dueDate ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>
                Due
              </Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {formatDate(invoice.dueDate)}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {invoiceLoaded && !invoice ? (
        <Alert variant="info">
          No invoice on file yet. Our team is still setting up your account.
        </Alert>
      ) : null}

      {canPay && instructions.length > 0 ? (
        <View style={styles.payments}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Payment methods
          </Text>

          {instructions.map((inst) => {
            const isStk = inst.code === 'mpesa_stk';
            const steps = inst.steps ?? [];
            const recipientEntries = inst.recipient
              ? Object.entries(inst.recipient).filter(
                  ([, v]) => v !== null && v !== undefined && v !== ''
                )
              : [];

            return (
              <Card key={inst.code} style={styles.payCard}>
                <Text style={[styles.payTitle, { color: theme.colors.text }]}>
                  {inst.title}
                </Text>
                {inst.description ? (
                  <Text
                    style={[
                      styles.payDesc,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {inst.description}
                  </Text>
                ) : null}

                {isStk ? (
                  <View style={styles.stkForm}>
                    <FormField label="Phone number">
                      <Input
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+254 712 345 678"
                        keyboardType="phone-pad"
                        invalid={Boolean(phone) && !phoneValid}
                        editable={!paying && !pollingFast}
                      />
                    </FormField>

                    <Button
                      title={
                        pollingFast
                          ? 'Waiting for confirmation…'
                          : inst.action?.label ?? 'Send STK push'
                      }
                      onPress={payWithMpesa}
                      loading={paying || pollingFast}
                      disabled={!phoneValid || pollingFast}
                      fullWidth
                    />

                    {pollingFast ? (
                      <Text
                        style={[
                          styles.pollHint,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        Confirm the prompt on your phone. This updates
                        automatically.
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {!isStk && recipientEntries.length > 0 ? (
                  <View style={styles.recipient}>
                    {recipientEntries.map(([k, v]) => (
                      <Text
                        key={k}
                        style={[
                          styles.recipientLine,
                          { color: theme.colors.text },
                        ]}
                      >
                        <Text style={{ color: theme.colors.textMuted }}>
                          {k}:{' '}
                        </Text>
                        {String(v)}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {!isStk && steps.length > 0 ? (
                  <View style={styles.steps}>
                    {steps.map((s, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.stepLine,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        {i + 1}. {s}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      ) : null}

      {isPaid ? (
        <Alert variant="success" title="Payment received">
          We're processing your account now. You'll be redirected once approved.
        </Alert>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Check status"
          variant="outline"
          onPress={checkStatus}
          loading={refreshing}
          fullWidth
          leftIcon={
            <Ionicons name="refresh" size={16} color={theme.colors.text} />
          }
        />
        <Button
          title="Sign out"
          variant="ghost"
          onPress={logout}
          fullWidth
          leftIcon={
            <Ionicons
              name="log-out-outline"
              size={16}
              color={theme.colors.textMuted}
            />
          }
        />
      </View>

      <View style={styles.footer}>
        <Ionicons
          name="time-outline"
          size={12}
          color={theme.colors.textSubtle}
        />
        <Text style={[styles.footerText, { color: theme.colors.textSubtle }]}>
          Usually takes less than 24 hours
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: 32, marginBottom: 24 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  invoiceCard: { marginTop: 16 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  statusText: { fontSize: 14, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: { fontSize: 13 },
  value: { fontSize: 13, fontWeight: '500' },
  valueBold: { fontSize: 15, fontWeight: '700' },
  payments: { marginTop: 24, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  payCard: { marginBottom: 0 },
  payTitle: { fontSize: 14, fontWeight: '600' },
  payDesc: { fontSize: 12, marginTop: 4 },
  stkForm: { marginTop: 12, gap: 12 },
  pollHint: { fontSize: 11, textAlign: 'center' },
  recipient: { marginTop: 8, gap: 4 },
  recipientLine: { fontSize: 12 },
  steps: { marginTop: 8, gap: 4 },
  stepLine: { fontSize: 12 },
  actions: { marginTop: 24, gap: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    marginBottom: 32,
  },
  footerText: { fontSize: 12 },
});