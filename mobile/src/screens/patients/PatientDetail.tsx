import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  EmptyState,
} from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { patientApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import {
  formatMoney,
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from '@/utils/format';
import { prescriptionStatusLabel, genderLabel } from '@/utils/enums';
import type { Patient, Prescription, Sale } from '@/types';

interface Props {
  navigation: any;
  route: { params: { patientId: string } };
}

type TabKey = 'overview' | 'prescriptions' | 'purchases';

function prescriptionVariant(
  status: string
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'dispensed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'partial':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default function PatientDetail({ navigation, route }: Props) {
  const { theme } = useTheme();
  const patientId = route.params?.patientId ?? '';

  const [tab, setTab] = useState<TabKey>('overview');

  const patientQuery = useQuery({
    queryKey: queryKeys.patients.detail(patientId),
    queryFn: () => patientApi.get(patientId),
    enabled: Boolean(patientId),
  });

  const prescriptionsQuery = useQuery({
    queryKey: queryKeys.patients.prescriptions(patientId),
    queryFn: () => patientApi.prescriptions(patientId),
    enabled: Boolean(patientId),
  });

  const salesQuery = useQuery({
    queryKey: queryKeys.patients.sales(patientId),
    queryFn: () => patientApi.sales(patientId),
    enabled: Boolean(patientId),
  });

  const patient: Patient | null = patientQuery.data ?? null;
  const prescriptions: Prescription[] = useMemo(
    () =>
      Array.isArray(prescriptionsQuery.data) ? prescriptionsQuery.data : [],
    [prescriptionsQuery.data]
  );
  const sales: Sale[] = useMemo(
    () => (Array.isArray(salesQuery.data) ? salesQuery.data : []),
    [salesQuery.data]
  );

  const age = useMemo(() => {
    if (!patient?.dob) return null;
    const diff = Date.now() - new Date(patient.dob).getTime();
    return Math.floor(diff / (365.25 * 86_400_000));
  }, [patient?.dob]);

  const totalSpent = useMemo(
    () => sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0),
    [sales]
  );

  const lastVisit = useMemo(() => {
    if (!sales.length) return null;
    const sorted = [...sales].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0].createdAt;
  }, [sales]);

  const pendingRxCount = useMemo(
    () => prescriptions.filter((r) => r.status === 'pending').length,
    [prescriptions]
  );

  const isLoading =
    patientQuery.isLoading ||
    prescriptionsQuery.isLoading ||
    salesQuery.isLoading;

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  if (!patient) {
    return (
      <Screen>
        <Alert variant="danger">Patient not found.</Alert>
      </Screen>
    );
  }

  const hasAlerts =
    (patient.allergies?.length ?? 0) > 0 ||
    (patient.chronicConditions?.length ?? 0) > 0;

  const tabs: { value: TabKey; label: string; count?: number }[] = [
    { value: 'overview', label: 'Overview' },
    {
      value: 'prescriptions',
      label: 'Prescriptions',
      count: prescriptions.length,
    },
    { value: 'purchases', label: 'Purchases', count: sales.length },
  ];

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {patient.name}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {[
            age !== null ? `${age} years` : null,
            patient.gender ? genderLabel(patient.gender) : null,
            patient.phone,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <View style={styles.headerActions}>
          <Button
            title="New sale"
            size="sm"
            variant="outline"
            onPress={() => navigation.navigate('PosTab')}
            leftIcon={
              <Ionicons
                name="cart-outline"
                size={14}
                color={theme.colors.text}
              />
            }
          />
        </View>
      </View>

      {hasAlerts && (
        <View
          style={[
            styles.alertsCard,
            {
              backgroundColor: theme.colors.danger + '08',
              borderColor: theme.colors.danger + '40',
            },
          ]}
        >
          <Ionicons
            name="warning"
            size={18}
            color={theme.colors.danger}
            style={styles.alertsIcon}
          />
          <View style={styles.alertsBody}>
            <Text style={[styles.alertsTitle, { color: theme.colors.text }]}>
              Medical alerts
            </Text>
            {patient.allergies?.length ? (
              <Text style={[styles.alertsLine, { color: theme.colors.text }]}>
                <Text style={{ fontWeight: '700', color: theme.colors.danger }}>
                  Allergies:{' '}
                </Text>
                {patient.allergies.join(', ')}
              </Text>
            ) : null}
            {patient.chronicConditions?.length ? (
              <Text style={[styles.alertsLine, { color: theme.colors.text }]}>
                <Text
                  style={{ fontWeight: '700', color: theme.colors.warning }}
                >
                  Chronic:{' '}
                </Text>
                {patient.chronicConditions.join(', ')}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      <View style={styles.kpiGrid}>
        <View
          style={[
            styles.kpiCard,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <View
            style={[
              styles.kpiIcon,
              { backgroundColor: theme.colors.primary + '15' },
            ]}
          >
            <Ionicons
              name="medkit-outline"
              size={16}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>
            Prescriptions
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {prescriptions.length}
          </Text>
          {pendingRxCount > 0 ? (
            <Text style={[styles.kpiHint, { color: theme.colors.warning }]}>
              {pendingRxCount} pending
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.kpiCard,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <View
            style={[
              styles.kpiIcon,
              { backgroundColor: theme.colors.success + '15' },
            ]}
          >
            <Ionicons
              name="bag-handle-outline"
              size={16}
              color={theme.colors.success}
            />
          </View>
          <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>
            Total spent
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {formatMoney(totalSpent, 'KES')}
          </Text>
          <Text style={[styles.kpiHint, { color: theme.colors.textSubtle }]}>
            across {sales.length} sale{sales.length === 1 ? '' : 's'}
          </Text>
        </View>

        <View
          style={[
            styles.kpiCard,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <View
            style={[
              styles.kpiIcon,
              { backgroundColor: theme.colors.info + '15' },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={theme.colors.info}
            />
          </View>
          <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>
            Last visit
          </Text>
          <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
            {lastVisit ? formatRelativeTime(lastVisit) : 'Never'}
          </Text>
          <Text style={[styles.kpiHint, { color: theme.colors.textSubtle }]}>
            Registered {patient.createdAt ? formatDate(patient.createdAt) : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        {tabs.map((t) => {
          const active = tab === t.value;
          return (
            <Pressable
              key={t.value}
              onPress={() => setTab(t.value)}
              style={[
                styles.tab,
                {
                  backgroundColor: active
                    ? theme.colors.primary
                    : theme.colors.surface2,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: active ? '#ffffff' : theme.colors.textMuted,
                  },
                ]}
              >
                {t.label}
                {typeof t.count === 'number' ? ` (${t.count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'overview' && (
        <>
          <Card style={styles.section} header="Contact">
            <MetaRow
              icon="person-outline"
              label="Full name"
              value={patient.name}
            />
            <MetaRow
              icon="call-outline"
              label="Phone"
              value={patient.phone ?? '—'}
            />
            <MetaRow
              icon="mail-outline"
              label="Email"
              value={patient.email ?? '—'}
            />
            <MetaRow
              icon="calendar-outline"
              label="Date of birth"
              value={patient.dob ? formatDate(patient.dob) : '—'}
            />
          </Card>

          {patient.notes ? (
            <Card style={styles.section} header="Notes">
              <Text style={[styles.notes, { color: theme.colors.textMuted }]}>
                {patient.notes}
              </Text>
            </Card>
          ) : null}
        </>
      )}

      {tab === 'prescriptions' && (
        <>
          {!prescriptions.length ? (
            <Card>
              <EmptyState
                icon={
                  <Ionicons
                    name="medkit-outline"
                    size={22}
                    color={theme.colors.textMuted}
                  />
                }
                title="No prescriptions yet"
                description="Prescriptions for this patient will appear here."
              />
            </Card>
          ) : (
            <View style={styles.rxList}>
              {prescriptions.map((rx) => {
                const ref =
                  rx.refNo ?? String(rx._id).slice(-6).toUpperCase();
                const variant = prescriptionVariant(rx.status);
                return (
                  <Pressable
                    key={rx._id}
                    onPress={() =>
                      navigation.navigate('PrescriptionsTab', {
                        screen: 'PrescriptionDetail',
                        params: { prescriptionId: rx._id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.rxCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    <View style={styles.rxRow}>
                      <View style={styles.rxLeft}>
                        <Text
                          style={[styles.rxRef, { color: theme.colors.primary }]}
                        >
                          {ref}
                        </Text>
                        <Text
                          style={[
                            styles.rxMeta,
                            { color: theme.colors.textMuted },
                          ]}
                        >
                          {rx.items?.length ?? 0} item
                          {rx.items?.length === 1 ? '' : 's'} ·{' '}
                          {formatRelativeTime(rx.createdAt)}
                        </Text>
                      </View>
                      <Badge variant={variant}>
                        {prescriptionStatusLabel(rx.status)}
                      </Badge>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}

      {tab === 'purchases' && (
        <>
          {!sales.length ? (
            <Card>
              <EmptyState
                icon={
                  <Ionicons
                    name="bag-handle-outline"
                    size={22}
                    color={theme.colors.textMuted}
                  />
                }
                title="No purchases yet"
                description="Sales linked to this patient will appear here."
              />
            </Card>
          ) : (
            <View style={styles.saleList}>
              {sales.map((s) => (
                <Pressable
                  key={s._id}
                  onPress={() =>
                    navigation.navigate('MoreTab', {
                      screen: 'SaleDetail',
                      params: { saleId: s._id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.saleCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={styles.saleRow}>
                    <View style={styles.saleLeft}>
                      <Text
                        style={[
                          styles.saleInvoice,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {s.invoiceNo}
                      </Text>
                      <Text
                        style={[
                          styles.saleMeta,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        {formatDateTime(s.createdAt)}
                      </Text>
                      <Text
                        style={[
                          styles.saleMeta,
                          { color: theme.colors.textSubtle },
                        ]}
                      >
                        {s.paymentMethod}
                      </Text>
                    </View>
                    <Text
                      style={[styles.saleTotal, { color: theme.colors.text }]}
                    >
                      {formatMoney(s.grandTotal, 'KES')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      <View style={styles.bottomPad} />
    </Screen>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.metaRow}>
      <View style={styles.metaRowLeft}>
        <Ionicons name={icon} size={14} color={theme.colors.textMuted} />
        <Text style={[styles.metaRowLabel, { color: theme.colors.textMuted }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[styles.metaRowValue, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginTop: 16, marginBottom: 16 },
  name: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 6 },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  alertsCard: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  alertsIcon: { marginTop: 1 },
  alertsBody: { flex: 1 },
  alertsTitle: { fontSize: 14, fontWeight: '600' },
  alertsLine: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: '30%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minWidth: 100,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiLabel: { fontSize: 11 },
  kpiValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  kpiHint: { fontSize: 10, marginTop: 3 },
  tabsWrap: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tabText: { fontSize: 12, fontWeight: '500' },
  section: { marginBottom: 16 },
  notes: { fontSize: 13, lineHeight: 19 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  metaRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaRowLabel: { fontSize: 13 },
  metaRowValue: { fontSize: 13, fontWeight: '500', flexShrink: 1 },
  rxList: { gap: 10 },
  rxCard: { borderWidth: 1, borderRadius: 12, padding: 14 },
  rxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rxLeft: { flex: 1, minWidth: 0 },
  rxRef: { fontSize: 13, fontWeight: '600', fontFamily: 'Courier' },
  rxMeta: { fontSize: 11, marginTop: 4 },
  saleList: { gap: 10 },
  saleCard: { borderWidth: 1, borderRadius: 12, padding: 14 },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  saleLeft: { flex: 1, minWidth: 0 },
  saleInvoice: { fontSize: 13, fontWeight: '600', fontFamily: 'Courier' },
  saleMeta: { fontSize: 11, marginTop: 4 },
  saleTotal: { fontSize: 14, fontWeight: '700' },
  bottomPad: { height: 24 },
});