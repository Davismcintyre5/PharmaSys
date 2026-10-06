import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Spinner,
  EmptyState,
  Badge,
  Alert,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { dashboardApi } from '@/api/axios';
import { hasPermission } from '@/utils/permissions';
import { formatMoney, formatRelativeTime } from '@/utils/format';
import { queryKeys } from '@/config/queryKeys';
import type { DashboardSummary, AiInsight } from '@/types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user, tenant, plan } = useAuth();

  const canUseAi = hasPermission(user?.role, 'ai.use');
  const planHasAi = plan?.features?.aiInsights === true;
  const aiEnabled = canUseAi && planHasAi;

  const summaryQuery = useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: () => dashboardApi.getSummary(),
  });

  const insightsQuery = useQuery({
    queryKey: queryKeys.dashboard.insights,
    queryFn: () => dashboardApi.getInsights(),
    enabled: canUseAi,
  });

  const summary: DashboardSummary | null = summaryQuery.data ?? null;
  const insight: AiInsight | null = insightsQuery.data ?? null;

  const refresh = useCallback(async () => {
    await Promise.all([
      summaryQuery.refetch(),
      canUseAi ? insightsQuery.refetch() : Promise.resolve(),
    ]);
  }, [summaryQuery, insightsQuery, canUseAi]);

  const { refreshing, onRefresh } = useRefreshControl(refresh);

  const currency = summary?.currency ?? 'KES';
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const insightText = insight?.payload?.text ?? null;

  if (summaryQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll onRefresh={onRefresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text style={[styles.welcome, { color: theme.colors.text }]}>
          {greeting()}, {firstName}
        </Text>
        {tenant?.name ? (
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Here's what's happening at {tenant.name} today
          </Text>
        ) : null}
      </View>

      <View style={styles.kpiGrid}>
        <KpiCard
          icon="receipt-outline"
          label="Sales today"
          value={summary ? formatMoney(summary.salesToday, currency) : '—'}
          sub={
            summary
              ? `${summary.salesTodayCount} transaction${summary.salesTodayCount === 1 ? '' : 's'}`
              : ''
          }
          tint="primary"
          onPress={() => navigation.navigate('MoreTab', { screen: 'Sales' })}
        />
        <KpiCard
          icon="warning-outline"
          label="Low stock"
          value={summary ? String(summary.lowStockCount) : '—'}
          sub={summary?.lowStockCount ? 'Need restocking' : 'All good'}
          tint={summary?.lowStockCount ? 'warning' : 'success'}
          onPress={() =>
            navigation.navigate('InventoryTab', { screen: 'LowStock' })
          }
        />
        <KpiCard
          icon="time-outline"
          label="Expiring soon"
          value={summary ? String(summary.expiringSoonCount) : '—'}
          sub="Next 30 days"
          tint={summary?.expiringSoonCount ? 'danger' : 'success'}
          onPress={() =>
            navigation.navigate('InventoryTab', { screen: 'Expiring' })
          }
        />
        <KpiCard
          icon="people-outline"
          label="New patients"
          value={summary ? String(summary.newPatientsToday) : '—'}
          sub="Registered today"
          tint="info"
          onPress={() => navigation.navigate('MoreTab', { screen: 'Patients' })}
        />
      </View>

      <Card style={styles.section} header="Quick actions">
        <View style={styles.quickGrid}>
          <QuickAction
            icon="cart-outline"
            label="New sale"
            description="Ring up a customer"
            onPress={() => navigation.navigate('PosTab')}
          />
          <QuickAction
            icon="cube-outline"
            label="Inventory"
            description="Browse drugs & stock"
            onPress={() => navigation.navigate('InventoryTab')}
          />
          <QuickAction
            icon="medkit-outline"
            label="Prescriptions"
            description="Dispense & track"
            onPress={() => navigation.navigate('PrescriptionsTab')}
          />
          {aiEnabled ? (
            <QuickAction
              icon="sparkles-outline"
              label="AI assistant"
              description="Ask anything"
              onPress={() => navigation.navigate('AiChat')}
            />
          ) : null}
        </View>
      </Card>

      <Card style={styles.section} header="AI insight">
        {!canUseAi ? (
          <Alert variant="info">
            AI insights are only available to owners and managers.
          </Alert>
        ) : !planHasAi ? (
          <Alert variant="info">
            AI insights aren't available on your plan. Upgrade to enable.
          </Alert>
        ) : insightsQuery.isLoading ? (
          <View style={styles.loading}>
            <Spinner />
          </View>
        ) : !insightText ? (
          <EmptyState
            icon={
              <Ionicons
                name="sparkles-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title="No insights yet"
            description="Generate your first AI insight to see weekly performance."
            action={
              <Button
                title="Generate"
                size="sm"
                onPress={() =>
                  navigation.navigate('MoreTab', { screen: 'AiInsights' })
                }
              />
            }
          />
        ) : (
          <>
            <Text
              style={[styles.insightText, { color: theme.colors.textMuted }]}
            >
              {insightText.length > 420
                ? `${insightText.slice(0, 420)}…`
                : insightText}
            </Text>
            <View style={styles.insightFooter}>
              <Pressable
                onPress={() =>
                  navigation.navigate('MoreTab', { screen: 'AiInsights' })
                }
                style={styles.insightLink}
              >
                <Text
                  style={[styles.linkText, { color: theme.colors.primary }]}
                >
                  Full insights
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color={theme.colors.primary}
                />
              </Pressable>
              {insight?.model ? (
                <Text
                  style={[styles.modelText, { color: theme.colors.textSubtle }]}
                >
                  {insight.model}
                </Text>
              ) : null}
            </View>
          </>
        )}
      </Card>

      <Card
        style={styles.section}
        header="Recent sales"
        footer={
          summary?.recentSales?.length ? (
            <Pressable
              onPress={() =>
                navigation.navigate('MoreTab', { screen: 'Sales' })
              }
              style={styles.cardFooter}
            >
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                View all
              </Text>
              <Ionicons
                name="arrow-forward"
                size={12}
                color={theme.colors.primary}
              />
            </Pressable>
          ) : null
        }
      >
        {!summary?.recentSales?.length ? (
          <EmptyState
            icon={
              <Ionicons
                name="receipt-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title="No sales yet"
            description="Once you ring up your first sale, it'll show up here."
            action={
              <Button
                title="Open POS"
                size="sm"
                onPress={() => navigation.navigate('PosTab')}
              />
            }
          />
        ) : (
          <View style={styles.salesList}>
            {summary.recentSales.slice(0, 5).map((sale) => {
              const variant =
                sale.status === 'completed'
                  ? 'success'
                  : sale.status === 'partially_refunded'
                  ? 'warning'
                  : sale.status === 'refunded'
                  ? 'info'
                  : 'neutral';
              const label =
                sale.status === 'completed'
                  ? 'Paid'
                  : sale.status.replace(/_/g, ' ');

              return (
                <Pressable
                  key={sale._id}
                  onPress={() =>
                    navigation.navigate('MoreTab', {
                      screen: 'SaleDetail',
                      params: { saleId: sale._id },
                    })
                  }
                  style={styles.saleRow}
                >
                  <View style={styles.saleLeft}>
                    <Text
                      style={[styles.saleInvoice, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {sale.invoiceNo}
                    </Text>
                    <Text
                      style={[
                        styles.saleMeta,
                        { color: theme.colors.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {sale.items?.length ?? 0} item
                      {sale.items?.length === 1 ? '' : 's'} ·{' '}
                      {formatRelativeTime(sale.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.saleRight}>
                    <Badge variant={variant as any}>{label}</Badge>
                    <Text
                      style={[styles.saleTotal, { color: theme.colors.text }]}
                    >
                      {formatMoney(sale.grandTotal, currency)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </Card>

      {summary &&
        (summary.lowStockCount > 0 || summary.expiringSoonCount > 0) && (
          <Card style={styles.section} header="Needs attention">
            <View style={styles.alertsList}>
              {summary.lowStockCount > 0 && (
                <Pressable
                  onPress={() =>
                    navigation.navigate('InventoryTab', {
                      screen: 'LowStock',
                    })
                  }
                  style={[
                    styles.alertRow,
                    {
                      borderColor: theme.colors.warning + '40',
                      backgroundColor: theme.colors.warning + '10',
                    },
                  ]}
                >
                  <Text
                    style={[styles.alertText, { color: theme.colors.text }]}
                  >
                    <Text style={{ fontWeight: '700' }}>
                      {summary.lowStockCount}
                    </Text>{' '}
                    item{summary.lowStockCount === 1 ? '' : 's'} low on stock
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={theme.colors.warning}
                  />
                </Pressable>
              )}
              {summary.expiringSoonCount > 0 && (
                <Pressable
                  onPress={() =>
                    navigation.navigate('InventoryTab', {
                      screen: 'Expiring',
                    })
                  }
                  style={[
                    styles.alertRow,
                    {
                      borderColor: theme.colors.danger + '40',
                      backgroundColor: theme.colors.danger + '10',
                    },
                  ]}
                >
                  <Text
                    style={[styles.alertText, { color: theme.colors.text }]}
                  >
                    <Text style={{ fontWeight: '700' }}>
                      {summary.expiringSoonCount}
                    </Text>{' '}
                    batch{summary.expiringSoonCount === 1 ? '' : 'es'} expiring
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={theme.colors.danger}
                  />
                </Pressable>
              )}
            </View>
          </Card>
        )}

      <View style={styles.bottomPad} />
    </Screen>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub: string;
  tint: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onPress?: () => void;
}) {
  const { theme } = useTheme();

  const tintMap = {
    primary: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
  };

  const color = tintMap[tint];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.kpiCard,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.kpiIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      {sub ? (
        <Text
          style={[styles.kpiSub, { color: theme.colors.textSubtle }]}
          numberOfLines={1}
        >
          {sub}
        </Text>
      ) : null}
    </Pressable>
  );
}

function QuickAction({
  icon,
  label,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickItem,
        {
          borderColor: theme.colors.border,
          backgroundColor: pressed
            ? theme.colors.surface2
            : theme.colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.quickIcon,
          { backgroundColor: theme.colors.primary + '15' },
        ]}
      >
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
      </View>
      <View style={styles.quickText}>
        <Text style={[styles.quickLabel, { color: theme.colors.text }]}>
          {label}
        </Text>
        <Text
          style={[styles.quickDesc, { color: theme.colors.textMuted }]}
          numberOfLines={1}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { paddingVertical: 16, alignItems: 'center' },
  header: { marginTop: 16, marginBottom: 20 },
  welcome: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: '47%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  kpiLabel: { fontSize: 12 },
  kpiValue: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  kpiSub: { fontSize: 11, marginTop: 4 },
  section: { marginTop: 16 },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickItem: {
    flexGrow: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: { flex: 1 },
  quickLabel: { fontSize: 13, fontWeight: '600' },
  quickDesc: { fontSize: 11, marginTop: 2 },
  insightText: { fontSize: 13, lineHeight: 19 },
  insightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  insightLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { fontSize: 12, fontWeight: '600' },
  modelText: { fontSize: 10 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  salesList: { gap: 4 },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  saleLeft: { flex: 1, minWidth: 0 },
  saleInvoice: { fontSize: 13, fontWeight: '600' },
  saleMeta: { fontSize: 11, marginTop: 3 },
  saleRight: { alignItems: 'flex-end', gap: 4 },
  saleTotal: { fontSize: 13, fontWeight: '700' },
  alertsList: { gap: 8 },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  alertText: { fontSize: 12, flex: 1 },
  bottomPad: { height: 24 },
});