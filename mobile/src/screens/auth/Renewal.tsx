import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Button,
  Input,
  FormField,
  Alert,
  Card,
  Spinner,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { billingApi, publicApi } from '@/api/axios';
import { formatMoney, formatDate } from '@/utils/format';
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  formatKenyanPhoneDisplay,
} from '@/utils/phone';
import type { BillingStatus, PublicInvoice, PublicPlan } from '@/types';

export default function Renewal() {
  const { theme } = useTheme();
  const toast = useToast();
  const { logout, user, reload } = useAuth();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [invoiceLoaded, setInvoiceLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [pollingFast, setPollingFast] = useState(false);

  const fastPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([
      billingApi.status().catch(() => null),
      publicApi.site.getPlans().catch(() => []),
      billingApi.invoice().catch(() => null),
    ])
      .then(([s, p, inv]) => {
        setStatus(s);
        setPlans(p);
        setInvoice(inv ?? null);
      })
      .finally(() => {
        setLoading(false);
        setInvoiceLoaded(true);
      });
  }, []);

  useEffect(() => () => stopFastPoll(), []);

  function stopFastPoll() {
    if (fastPollRef.current !== null) {
      clearInterval(fastPollRef.current);
      fastPollRef.current = null;
    }
    setPollingFast(false);
  }

  async function loadInvoice() {
    try {
      const fresh = await billingApi.invoice();
      setInvoice(fresh ?? null);
      return fresh;
    } catch {
      return null;
    }
  }

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
        await reload();
        return;
      }
      if (attempts >= 20) {
        stopFastPoll();
        toast.info('Payment still pending. We will update when confirmed.');
      }
    }, 3000);
  }

  async function createRenewal() {
    const currentPlan = plans.find((p) => p.code === status?.planCode);
    if (!currentPlan) {
      toast.error('Current plan not found');
      return;
    }
    setCreating(true);
    try {
      const res = await billingApi.renew(currentPlan.code);
      if ('activated' in res && (res as any).activated) {
        toast.success('Plan activated');
        await reload();
        return;
      }
      await loadInvoice();
    } catch (e: any) {
      toast.error(e?.message || 'Could not create renewal invoice');
    } finally {
      setCreating(false);
    }
  }

  async function payWithMpesa() {
    const normalized = normalizeKenyanPhone(phone);
    if (!normalized) {
      toast.error('Enter a valid Kenyan phone number');
      return;
    }
    if (!invoice) {
      toast.error('No invoice loaded. Refresh and try again.');
      return;
    }
    setPaying(true);
    try {
      await billingApi.stkPush(normalized, invoice.invoiceNumber);
      toast.success(`Prompt sent to ${formatKenyanPhoneDisplay(normalized)}.`);
      startFastPoll();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send payment prompt');
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  const isPaid = invoice?.status === 'paid';
  const canPay = Boolean(
    invoiceLoaded && invoice && !isPaid && invoice.amountDue > 0
  );
  const phoneValid = isValidKenyanPhone(phone);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: theme.colors.danger + '15' },
          ]}
        >
          <Ionicons
            name="warning-outline"
            size={32}
            color={theme.colors.danger}
          />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Subscription expired
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Renew your plan to restore full access
        </Text>
      </View>

      {status ? (
        <Card style={styles.statusCard}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              Plan
            </Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {status.planName}
            </Text>
          </View>
          {status.periodEnd ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>
                Expired
              </Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {formatDate(status.periodEnd)}
              </Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              Amount
            </Text>
            <Text style={[styles.valueBold, { color: theme.colors.text }]}>
              {formatMoney(status.amountMinor / 100, status.currency)}
            </Text>
          </View>
        </Card>
      ) : null}

      {!invoice && invoiceLoaded ? (
        <Button
          title="Generate renewal invoice"
          onPress={createRenewal}
          loading={creating}
          fullWidth
          size="lg"
          style={styles.generateBtn}
        />
      ) : null}

      {invoice ? (
        <>
          <Card style={styles.invoiceCard}>
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
          </Card>

          {isPaid ? (
            <Alert variant="success" title="Payment received">
              Your subscription is being renewed.
            </Alert>
          ) : canPay ? (
            <>
              <FormField label="M-Pesa phone number">
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
                    : 'Pay with M-Pesa'
                }
                onPress={payWithMpesa}
                loading={paying || pollingFast}
                disabled={!phoneValid || pollingFast}
                fullWidth
                size="lg"
              />

              {pollingFast ? (
                <Text
                  style={[styles.pollHint, { color: theme.colors.textMuted }]}
                >
                  Confirm the prompt on your phone. This updates
                  automatically.
                </Text>
              ) : null}
            </>
          ) : (
            <Alert variant="info">
              Nothing left to pay on this invoice.
            </Alert>
          )}
        </>
      ) : null}

      <View style={styles.footer}>
        <Button title="Sign out" variant="ghost" onPress={logout} fullWidth />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  statusCard: { marginTop: 8 },
  invoiceCard: { marginTop: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: { fontSize: 13 },
  value: { fontSize: 13, fontWeight: '500' },
  valueBold: { fontSize: 15, fontWeight: '700' },
  generateBtn: { marginTop: 16 },
  pollHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: { marginTop: 24, marginBottom: 32 },
});