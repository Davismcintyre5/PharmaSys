import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Input,
  FormField,
  Alert,
  Spinner,
  Badge,
  Divider,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { billingApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { formatMoney, formatDate } from '@/utils/format';
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  formatKenyanPhoneDisplay,
} from '@/utils/phone';
import type { PublicInvoice } from '@/types';

function kindLabel(purpose?: string): string {
  if (purpose === 'upgrade') return 'upgrade';
  if (purpose === 'renewal') return 'renewal';
  if (purpose === 'registration') return 'registration';
  return 'plan change';
}

export default function BillingPending() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { reload } = useAuth();

  const invoiceQuery = useQuery({
    queryKey: queryKeys.billing.invoice,
    queryFn: () => billingApi.invoice(),
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.billing.status,
    queryFn: () => billingApi.status(),
  });

  const invoice: PublicInvoice | null = invoiceQuery.data ?? null;
  const status = statusQuery.data ?? null;

  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pollingFast, setPollingFast] = useState(false);
  const [phone, setPhone] = useState('');

  const fastPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (invoiceQuery.isLoading) return;
    if (!invoice) {
      navigation.replace('Billing');
      return;
    }
    if (invoice.purpose !== 'renewal' && invoice.purpose !== 'upgrade') {
      navigation.replace('Billing');
      return;
    }
    if (invoice.status === 'cancelled' || invoice.status === 'draft') {
      navigation.replace('Billing');
    }
  }, [invoiceQuery.isLoading, invoice, navigation]);

  useEffect(() => () => stopFastPoll(), []);

  function stopFastPoll() {
    if (fastPollRef.current !== null) {
      clearInterval(fastPollRef.current);
      fastPollRef.current = null;
    }
    setPollingFast(false);
  }

  function startFastPoll() {
    stopFastPoll();
    setPollingFast(true);

    let attempts = 0;
    fastPollRef.current = setInterval(async () => {
      attempts++;
      const fresh = await billingApi.invoice().catch(() => null);

      if (fresh?.status === 'paid') {
        stopFastPoll();
        toast.success('Payment received! Waiting for approval.');
        await queryClient.invalidateQueries({
          queryKey: queryKeys.billing.invoice,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.billing.status,
        });
        await reload();
        return;
      }

      if (attempts >= 20) {
        stopFastPoll();
        toast.info('Payment still pending. We will update when confirmed.');
      }
    }, 3000);
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.billing.invoice }),
        queryClient.invalidateQueries({ queryKey: queryKeys.billing.status }),
      ]);
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
      toast.error('No invoice loaded. Refresh and try again.');
      return;
    }

    setPaying(true);
    try {
      await billingApi.stkPush(normalized, invoice.invoiceNumber);
      toast.success(
        `Payment prompt sent to ${formatKenyanPhoneDisplay(normalized)}.`
      );
      startFastPoll();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send payment prompt');
    } finally {
      setPaying(false);
    }
  }

  if (invoiceQuery.isLoading || !invoice) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  const kind = kindLabel(invoice.purpose);
  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';
  const canPay = !isPaid && invoice.amountDue > 0;
  const instructions = invoice.paymentInstructions ?? [];
  const phoneValid = isValidKenyanPhone(phone);

  const currentPlanName = status?.planName ?? null;
  const targetPlan = invoice.planCode ?? null;

  return (
    <Screen scroll onRefresh={refresh} refreshing={refreshing}>
      {isPaid ? (
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: theme.colors.success + '10',
              borderColor: theme.colors.success + '40',
            },
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: theme.colors.success + '20' },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.success}
            />
          </View>
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
              Payment received — awaiting approval
            </Text>
            <Text
              style={[styles.statusDesc, { color: theme.colors.textMuted }]}
            >
              Our team will approve your {kind} shortly. You'll get an email once
              it's live.
            </Text>
          </View>
        </View>
      ) : isOverdue ? (
        <Alert variant="danger" style={styles.alert}>
          This invoice is overdue. Pay now to avoid cancellation.
        </Alert>
      ) : (
        <Alert variant="info" style={styles.alert}>
          We've created your {kind} invoice. Pay to move forward.
        </Alert>
      )}

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text
              style={[styles.summaryLabel, { color: theme.colors.textMuted }]}
            >
              Invoice
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {invoice.invoiceNumber}
            </Text>
            <View style={styles.badgeRow}>
              <Badge
                variant={isPaid ? 'success' : isOverdue ? 'danger' : 'warning'}
              >
                {invoice.status}
              </Badge>
              <Badge variant="neutral">{kind}</Badge>
            </View>
          </View>

          <View style={styles.summaryRight}>
            <Text
              style={[styles.summaryLabel, { color: theme.colors.textMuted }]}
            >
              {isPaid ? 'Amount paid' : 'Amount due'}
            </Text>
            <Text style={[styles.amountValue, { color: theme.colors.text }]}>
              {formatMoney(
                isPaid ? invoice.amountPaid : invoice.amountDue,
                invoice.currency
              )}
            </Text>
            {invoice.dueDate && !isPaid ? (
              <View style={styles.dueRow}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={theme.colors.textMuted}
                />
                <Text
                  style={[styles.dueText, { color: theme.colors.textMuted }]}
                >
                  Due {formatDate(invoice.dueDate)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {invoice.purpose === 'upgrade' ? (
          <>
            <Divider style={styles.divider} />
            <Text
              style={[styles.planChangeLabel, { color: theme.colors.textMuted }]}
            >
              PLAN CHANGE
            </Text>
            <View style={styles.planChangeRow}>
              <Text
                style={[
                  styles.planChangeFrom,
                  { color: theme.colors.textMuted },
                ]}
              >
                {currentPlanName ?? '—'}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={theme.colors.textSubtle}
              />
              <Text
                style={[styles.planChangeTo, { color: theme.colors.text }]}
              >
                {targetPlan ?? '—'}
              </Text>
            </View>
          </>
        ) : null}

        {invoice.items?.length > 0 ? (
          <>
            <Divider style={styles.divider} />
            {invoice.items.map((it, i) => (
              <View key={i} style={styles.lineItem}>
                <View style={styles.lineLeft}>
                  <Text style={[styles.lineName, { color: theme.colors.text }]}>
                    {it.name}
                  </Text>
                  {it.description ? (
                    <Text
                      style={[
                        styles.lineDesc,
                        { color: theme.colors.textSubtle },
                      ]}
                    >
                      {it.description}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.lineAmount, { color: theme.colors.text }]}>
                  {formatMoney(it.subtotal, invoice.currency)}
                </Text>
              </View>
            ))}

            <Divider style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                {formatMoney(invoice.total, invoice.currency)}
              </Text>
            </View>
          </>
        ) : null}
      </Card>

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
                    style={[styles.payDesc, { color: theme.colors.textMuted }]}
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
        <Alert variant="success" title="No action needed">
          Once our team approves, your new plan activates and you'll get an email.
        </Alert>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Check status"
          variant="outline"
          onPress={refresh}
          loading={refreshing}
          fullWidth
          leftIcon={
            <Ionicons name="refresh" size={16} color={theme.colors.text} />
          }
        />
        <Button
          title="Back to billing"
          variant="ghost"
          onPress={() => navigation.navigate('Billing')}
          fullWidth
          leftIcon={
            <Ionicons
              name="arrow-back"
              size={16}
              color={theme.colors.textMuted}
            />
          }
        />
      </View>

      <View style={styles.bottomPad} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  alert: { marginBottom: 12 },
  statusBanner: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { flex: 1 },
  statusTitle: { fontSize: 14, fontWeight: '600' },
  statusDesc: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  summaryCard: { marginBottom: 16 },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  summaryRight: { alignItems: 'flex-end' },
  amountValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  dueText: { fontSize: 11 },
  divider: { marginVertical: 14 },
  planChangeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  planChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planChangeFrom: { fontSize: 13 },
  planChangeTo: { fontSize: 13, fontWeight: '600' },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 12,
  },
  lineLeft: { flex: 1 },
  lineName: { fontSize: 13 },
  lineDesc: { fontSize: 11, marginTop: 2 },
  lineAmount: { fontSize: 13, fontWeight: '500' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '700' },
  payments: { gap: 12, marginBottom: 16 },
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
  actions: { gap: 8, marginTop: 8 },
  bottomPad: { height: 24 },
});