import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Badge,
  Alert,
  Spinner,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { billingApi, publicApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { formatMoney, formatDate } from '@/utils/format';
import type { BillingStatus, PublicInvoice, PublicPlan } from '@/types';

function statusColor(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'active':
    case 'perpetual':
      return 'success';
    case 'past_due':
      return 'warning';
    case 'expired':
    case 'cancelled':
      return 'danger';
    default:
      return 'info';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'perpetual':
      return 'Perpetual';
    case 'past_due':
      return 'Past due';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export default function Billing() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, reload } = useAuth();

  const isOwner = user?.role === 'owner';
  const canManage = isOwner;

  const statusQuery = useQuery({
    queryKey: queryKeys.billing.status,
    queryFn: () => billingApi.status(),
  });

  const plansQuery = useQuery({
    queryKey: queryKeys.public.plans,
    queryFn: () => publicApi.site.getPlans(),
  });

  const invoiceQuery = useQuery({
    queryKey: queryKeys.billing.invoice,
    queryFn: () => billingApi.invoice(),
  });

  const status: BillingStatus | null = statusQuery.data ?? null;
  const plans: PublicPlan[] = (plansQuery.data ?? []) as PublicPlan[];
  const invoice: PublicInvoice | null = invoiceQuery.data ?? null;

  const currentPlan = useMemo(
    () => (status ? plans.find((p) => p.code === status.planCode) ?? null : null),
    [plans, status]
  );

  const pendingInvoice = useMemo(() => {
    if (!invoice) return null;
    if (invoice.purpose !== 'renewal' && invoice.purpose !== 'upgrade') return null;
    if (
      invoice.status === 'sent' ||
      invoice.status === 'overdue' ||
      invoice.status === 'paid'
    ) {
      return invoice;
    }
    return null;
  }, [invoice]);

  const hasPending = pendingInvoice !== null;
  const daysLeft = status?.daysLeft ?? null;

  const isLoading =
    statusQuery.isLoading || plansQuery.isLoading || invoiceQuery.isLoading;

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  const sc = status ? statusColor(status.status) : 'info';

  const pendingKind =
    pendingInvoice?.purpose === 'upgrade'
      ? 'upgrade'
      : pendingInvoice?.purpose === 'renewal'
      ? 'renewal'
      : 'plan change';

  const pendingIsPaid = pendingInvoice?.status === 'paid';

  async function handleUpgradeOrRenew(plan: PublicPlan) {
    if (!canManage) {
      toast.error('Only the owner can change the plan');
      return;
    }
    if (hasPending) {
      toast.error('You already have a pending plan change');
      return;
    }

    const isCurrent = status?.planCode === plan.code;
    const isDowngrade =
      currentPlan &&
      plan.price.amount < (currentPlan.price.amount || 0) &&
      plan.code !== currentPlan.code;

    if (isCurrent) return;

    if (isDowngrade) {
      toast.error('Contact support to downgrade');
      return;
    }

    if (!plan.price.amount) {
      try {
        await billingApi.renew(plan.code);
        toast.success('Plan activated');
        await queryClient.invalidateQueries({ queryKey: queryKeys.billing.status });
        await queryClient.invalidateQueries({ queryKey: queryKeys.billing.invoice });
        await reload();
      } catch (e: any) {
        toast.error(e?.message || 'Could not activate plan');
      }
      return;
    }

    try {
      await billingApi.renew(plan.code);
      toast.success('Invoice created');
      await queryClient.invalidateQueries({ queryKey: queryKeys.billing.invoice });
      await queryClient.invalidateQueries({ queryKey: queryKeys.billing.status });
      await reload();
    } catch (e: any) {
      toast.error(e?.message || 'Could not create invoice');
    }
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Billing</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Manage your subscription and plan
          </Text>
        </View>
      </View>

      {status &&
        status.status === 'active' &&
        daysLeft !== null &&
        daysLeft <= 7 &&
        !hasPending && (
          <Alert variant="warning" style={styles.alert}>
            Your subscription expires in {daysLeft} day
            {daysLeft === 1 ? '' : 's'}. Renew now to avoid interruption.
          </Alert>
        )}

      {status &&
        (status.status === 'expired' || status.status === 'past_due') &&
        !hasPending && (
          <Alert variant="danger" style={styles.alert}>
            Your subscription is {statusLabel(status.status).toLowerCase()}. Renew
            to restore full access.
          </Alert>
        )}

      {hasPending && pendingInvoice && (
        <Pressable
          onPress={() => navigation.navigate('BillingPending')}
          style={[
            styles.pendingCard,
            {
              borderColor: theme.colors.primary + '60',
              backgroundColor: theme.colors.primary + '08',
            },
          ]}
        >
          <View style={styles.pendingRow}>
            <View
              style={[
                styles.pendingIcon,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.pendingText}>
              <Text style={[styles.pendingTitle, { color: theme.colors.text }]}>
                {pendingKind === 'upgrade'
                  ? 'Upgrade'
                  : pendingKind === 'renewal'
                  ? 'Renewal'
                  : 'Plan change'}{' '}
                in progress
              </Text>
              <Text
                style={[styles.pendingDesc, { color: theme.colors.textMuted }]}
                numberOfLines={2}
              >
                Invoice {pendingInvoice.invoiceNumber}
                {pendingIsPaid
                  ? ' · Payment received, waiting for approval'
                  : ` · ${formatMoney(pendingInvoice.amountDue, pendingInvoice.currency)} due`}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.primary}
            />
          </View>
        </Pressable>
      )}

      <Card style={styles.currentCard}>
        <View style={styles.currentHeader}>
          <View style={styles.currentTitleRow}>
            <Ionicons
              name="card-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={[styles.currentTitle, { color: theme.colors.text }]}>
              Current plan
            </Text>
          </View>
          {status && <Badge variant={sc}>{statusLabel(status.status)}</Badge>}
        </View>

        {status ? (
          <>
            <Text style={[styles.planName, { color: theme.colors.text }]}>
              {status.planName}
              {status.amountMinor > 0 && (
                <Text
                  style={[styles.planPrice, { color: theme.colors.textMuted }]}
                >
                  {'  '}
                  {formatMoney(status.amountMinor / 100, status.currency)}
                </Text>
              )}
            </Text>

            {status.periodEnd && (
              <Text
                style={[styles.periodText, { color: theme.colors.textMuted }]}
              >
                {status.status === 'expired' ? 'Expired' : 'Renews'} on{' '}
                {formatDate(status.periodEnd)}
                {daysLeft !== null && daysLeft > 0
                  ? ` (${daysLeft} day${daysLeft === 1 ? '' : 's'} left)`
                  : ''}
              </Text>
            )}

            <Text style={[styles.autoRenew, { color: theme.colors.textSubtle }]}>
              Auto-renew: {status.autoRenew ? 'on' : 'off'}
            </Text>
          </>
        ) : (
          <Text style={[styles.noPlan, { color: theme.colors.textMuted }]}>
            No active subscription
          </Text>
        )}

        {status?.limits && (
          <View
            style={[
              styles.limitsGrid,
              { borderTopColor: theme.colors.border },
            ]}
          >
            <LimitStat label="Branches" value={status.limits.maxBranches} />
            <LimitStat label="Products" value={status.limits.maxProducts} />
            <LimitStat
              label="Tx / month"
              value={status.limits.maxTransactionsPerMonth}
            />
            <LimitStat
              label="AI calls / day"
              value={status.limits.maxAiCallsPerDay}
            />
          </View>
        )}
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {hasPending
            ? 'Available plans'
            : status
            ? 'Change plan'
            : 'Choose a plan'}
        </Text>
        {!canManage && (
          <Text style={[styles.sectionHint, { color: theme.colors.textMuted }]}>
            Only the owner can change
          </Text>
        )}
      </View>

      {plans.length === 0 ? (
        <Card>
          <Text style={[styles.noPlan, { color: theme.colors.textMuted }]}>
            No plans available.
          </Text>
        </Card>
      ) : (
        <View style={styles.plansList}>
          {plans.map((plan) => {
            const isCurrent = status?.planCode === plan.code;
            const isDowngrade =
              currentPlan &&
              plan.price.amount < (currentPlan.price.amount || 0) &&
              plan.code !== currentPlan.code;

            return (
              <Card
                key={plan.code}
                style={{
                  ...styles.planCard,
                  ...(isCurrent
                    ? {
                        borderColor: theme.colors.primary,
                        borderWidth: 2,
                      }
                    : {}),
                  ...(hasPending ? { opacity: 0.6 } : {}),
                }}
              >
                {isCurrent && (
                  <View style={styles.currentTag}>
                    <Badge variant="accent">Current</Badge>
                  </View>
                )}

                <Text style={[styles.planTitle, { color: theme.colors.text }]}>
                  {plan.name}
                </Text>
                <Text
                  style={[styles.planDesc, { color: theme.colors.textMuted }]}
                >
                  {plan.description}
                </Text>

                <View style={styles.planPriceRow}>
                  <Text style={[styles.planAmount, { color: theme.colors.text }]}>
                    {plan.price.amount
                      ? formatMoney(plan.price.amount, plan.price.currency)
                      : 'Free'}
                  </Text>
                  {plan.price.amount > 0 && (
                    <Text
                      style={[
                        styles.planInterval,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      /{plan.price.interval}
                    </Text>
                  )}
                </View>

                <View style={styles.planFeatures}>
                  <PlanLine>{plan.limits.maxBranches} branch(es)</PlanLine>
                  <PlanLine>
                    {plan.limits.maxProducts.toLocaleString()} products
                  </PlanLine>
                  <PlanLine>
                    {plan.limits.maxTransactionsPerMonth.toLocaleString()} tx /
                    month
                  </PlanLine>
                  {plan.features.aiInsights && <PlanLine>AI insights</PlanLine>}
                  {plan.features.prioritySupport && (
                    <PlanLine>Priority support</PlanLine>
                  )}
                </View>

                <View style={styles.planButton}>
                  {hasPending ? (
                    <Button title="Locked" variant="outline" disabled fullWidth />
                  ) : isCurrent ? (
                    <Button
                      title="Current plan"
                      variant="outline"
                      disabled
                      fullWidth
                    />
                  ) : isDowngrade ? (
                    <Button
                      title="Contact support"
                      variant="ghost"
                      disabled
                      fullWidth
                    />
                  ) : (
                    <Button
                      title={
                        currentPlan &&
                        plan.price.amount > (currentPlan.price.amount || 0)
                          ? 'Upgrade'
                          : 'Choose plan'
                      }
                      onPress={() => handleUpgradeOrRenew(plan)}
                      fullWidth
                      disabled={!canManage}
                    />
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {status?.status === 'expired' && !hasPending && (
        <Alert variant="info" style={styles.alert}>
          Some features are locked while your subscription is expired. Renewing
          restores everything instantly.
        </Alert>
      )}

      <View style={styles.bottomPad} />
    </Screen>
  );
}

function LimitStat({ label, value }: { label: string; value: number }) {
  const { theme } = useTheme();
  return (
    <View style={styles.limitStat}>
      <Text style={[styles.limitLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.limitValue, { color: theme.colors.text }]}>
        {value.toLocaleString()}
      </Text>
    </View>
  );
}

function PlanLine({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.planLineRow}>
      <Ionicons
        name="checkmark"
        size={12}
        color={theme.colors.success}
        style={styles.planCheck}
      />
      <Text style={[styles.planLineText, { color: theme.colors.textMuted }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginTop: 16, marginBottom: 20 },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  alert: { marginBottom: 12 },
  pendingCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingText: { flex: 1 },
  pendingTitle: { fontSize: 14, fontWeight: '600' },
  pendingDesc: { fontSize: 12, marginTop: 3 },
  currentCard: { marginBottom: 20 },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  currentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentTitle: { fontSize: 15, fontWeight: '600' },
  planName: { fontSize: 18, fontWeight: '700' },
  planPrice: { fontSize: 14, fontWeight: '400' },
  periodText: { fontSize: 13, marginTop: 6 },
  autoRenew: { fontSize: 11, marginTop: 4 },
  noPlan: { fontSize: 13 },
  limitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  limitStat: { flexBasis: '47%' },
  limitLabel: { fontSize: 11 },
  limitValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  sectionHint: { fontSize: 11 },
  plansList: { gap: 12 },
  planCard: { position: 'relative', marginBottom: 0 },
  currentTag: { position: 'absolute', top: -10, left: 14, zIndex: 1 },
  planTitle: { fontSize: 16, fontWeight: '600' },
  planDesc: { fontSize: 12, marginTop: 4 },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    gap: 4,
  },
  planAmount: { fontSize: 22, fontWeight: '700' },
  planInterval: { fontSize: 12 },
  planFeatures: { marginTop: 12, gap: 6 },
  planLineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planCheck: { marginTop: 1 },
  planLineText: { fontSize: 12, flex: 1 },
  planButton: { marginTop: 16 },
  bottomPad: { height: 24 },
});