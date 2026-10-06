import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  ConfirmDialog,
  Divider,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { prescriptionApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { hasPermission } from '@/utils/permissions';
import { prescriptionStatusLabel } from '@/utils/enums';
import { formatDateTime, formatRelativeTime } from '@/utils/format';
import type { Prescription } from '@/types';

interface Props {
  navigation: any;
  route: { params: { prescriptionId: string } };
}

type Danger = { kind: 'cancel' } | { kind: 'hard-delete' } | null;

function statusVariant(
  status: string
): 'success' | 'warning' | 'info' | 'danger' | 'neutral' {
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

export default function PrescriptionDetail({ navigation, route }: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prescriptionId = route.params?.prescriptionId ?? '';

  const canDispense = hasPermission(user?.role, 'prescriptions.dispense');
  const isOwner = user?.role === 'owner';

  const [busy, setBusy] = useState(false);
  const [danger, setDanger] = useState<Danger>(null);

  const rxQuery = useQuery({
    queryKey: queryKeys.prescriptions.detail(prescriptionId),
    queryFn: () => prescriptionApi.get(prescriptionId),
    enabled: Boolean(prescriptionId),
  });

  const rx: Prescription | null = rxQuery.data ?? null;

  async function dispense() {
    if (!rx) return;
    setBusy(true);
    try {
      await prescriptionApi.dispense(rx._id);
      toast.success('Prescription dispensed');
      await queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    } catch (e: any) {
      toast.error(e?.message || 'Dispense failed');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDanger() {
    if (!rx || !danger) return;
    try {
      if (danger.kind === 'cancel') {
        await prescriptionApi.cancel(rx._id);
        toast.success('Prescription cancelled');
        await queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      } else {
        await prescriptionApi.hardRemove(rx._id);
        toast.success('Prescription permanently deleted');
        navigation.goBack();
        return;
      }
      setDanger(null);
    } catch (e: any) {
      toast.error(e?.message || 'Action failed');
    }
  }

  if (rxQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  if (!rx) {
    return (
      <Screen>
        <Alert variant="danger">Prescription not found.</Alert>
      </Screen>
    );
  }

  const patient = rx.patientId as any;
  const doctor = rx.doctorId as any;
  const patientName = typeof patient === 'object' ? patient?.name : null;
  const patientPhone = typeof patient === 'object' ? patient?.phone : null;
  const patientId = typeof patient === 'object' ? patient?._id : null;
  const doctorName = typeof doctor === 'object' ? doctor?.name : null;

  const ref = rx.refNo ?? String(rx._id).slice(-6).toUpperCase();

  const canCancel =
    canDispense && rx.status !== 'dispensed' && rx.status !== 'cancelled';
  const canHardDelete = isOwner && rx.status !== 'dispensed';

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.ref, { color: theme.colors.text }]}>
          Prescription {ref}
        </Text>
        <View style={styles.headerStatus}>
          <Badge variant={statusVariant(rx.status)}>
            {prescriptionStatusLabel(rx.status)}
          </Badge>
        </View>
      </View>

      {rx.status === 'dispensed' ? (
        <Alert variant="success" style={styles.alert}>
          Dispensed
          {rx.dispensedAt ? ` ${formatRelativeTime(rx.dispensedAt)}` : ''}.
        </Alert>
      ) : null}

      {rx.status === 'cancelled' ? (
        <Alert variant="danger" style={styles.alert}>
          This prescription was cancelled. No stock was deducted.
        </Alert>
      ) : null}

      {rx.status === 'pending' && canDispense ? (
        <Button
          title="Dispense prescription"
          onPress={dispense}
          loading={busy}
          fullWidth
          size="lg"
          style={styles.dispenseBtn}
          leftIcon={
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#ffffff"
            />
          }
        />
      ) : null}

      <Card style={styles.section}>
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <View style={styles.colHeader}>
              <View
                style={[
                  styles.colIcon,
                  { backgroundColor: theme.colors.primary + '15' },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                style={[styles.colLabel, { color: theme.colors.textMuted }]}
              >
                PATIENT
              </Text>
            </View>

            {patientName ? (
              <>
                <Pressable
                  onPress={() =>
                    patientId
                      ? navigation.navigate('MoreTab', {
                          screen: 'PatientDetail',
                          params: { patientId },
                        })
                      : null
                  }
                >
                  <Text
                    style={[
                      styles.colValue,
                      { color: patientId ? theme.colors.primary : theme.colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {patientName}
                  </Text>
                </Pressable>
                {patientPhone ? (
                  <Text
                    style={[
                      styles.colMeta,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {patientPhone}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text
                style={[styles.colMeta, { color: theme.colors.textSubtle }]}
              >
                —
              </Text>
            )}
          </View>

          <View style={styles.col}>
            <View style={styles.colHeader}>
              <View
                style={[
                  styles.colIcon,
                  { backgroundColor: theme.colors.info + '15' },
                ]}
              >
                <Ionicons
                  name="medkit-outline"
                  size={16}
                  color={theme.colors.info}
                />
              </View>
              <Text
                style={[styles.colLabel, { color: theme.colors.textMuted }]}
              >
                PRESCRIBER
              </Text>
            </View>
            <Text
              style={[styles.colValue, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {doctorName ?? '—'}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={theme.colors.textSubtle}
            />
            <Text
              style={[styles.timelineText, { color: theme.colors.textMuted }]}
            >
              Created {formatDateTime(rx.createdAt)}
            </Text>
          </View>

          {rx.dispensedAt ? (
            <View style={styles.timelineItem}>
              <Ionicons
                name="checkmark-circle-outline"
                size={12}
                color={theme.colors.success}
              />
              <Text
                style={[styles.timelineText, { color: theme.colors.textMuted }]}
              >
                Dispensed {formatDateTime(rx.dispensedAt)}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Card style={styles.section} header="Medications">
        {!rx.items?.length ? (
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            No items.
          </Text>
        ) : (
          <View style={styles.itemList}>
            {rx.items.map((item, i) => (
              <View key={i} style={styles.item}>
                <View style={styles.itemLeft}>
                  <Text
                    style={[styles.itemTitle, { color: theme.colors.text }]}
                  >
                    {item.dosage ? `Dosage: ${item.dosage}` : `Item ${i + 1}`}
                  </Text>
                  {item.duration ? (
                    <Text
                      style={[
                        styles.itemMeta,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      Duration: {item.duration}
                    </Text>
                  ) : null}
                  {item.notes ? (
                    <Text
                      style={[
                        styles.itemNotes,
                        { color: theme.colors.textSubtle },
                      ]}
                    >
                      {item.notes}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.itemRight}>
                  <Text
                    style={[styles.itemQty, { color: theme.colors.text }]}
                  >
                    ×{item.qty}
                  </Text>
                  {item.refills > 0 ? (
                    <Text
                      style={[
                        styles.itemRefills,
                        { color: theme.colors.textSubtle },
                      ]}
                    >
                      {item.refills} refill{item.refills === 1 ? '' : 's'}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      {rx.notes ? (
        <Card style={styles.section} header="Notes">
          <Text style={[styles.notesText, { color: theme.colors.textMuted }]}>
            {rx.notes}
          </Text>
        </Card>
      ) : null}

      {(canCancel || canHardDelete) ? (
        <Card style={styles.section} header="Actions">
          <View style={styles.actionsRow}>
            {canCancel ? (
              <Button
                title="Cancel prescription"
                variant="outline"
                onPress={() => setDanger({ kind: 'cancel' })}
                leftIcon={
                  <Ionicons
                    name="close-circle-outline"
                    size={14}
                    color={theme.colors.text}
                  />
                }
              />
            ) : null}

            {canHardDelete ? (
              <Button
                title="Delete permanently"
                variant="danger"
                onPress={() => setDanger({ kind: 'hard-delete' })}
                leftIcon={
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color="#ffffff"
                  />
                }
              />
            ) : null}
          </View>

          {!canHardDelete && isOwner && rx.status === 'dispensed' ? (
            <Text
              style={[styles.hint, { color: theme.colors.textSubtle }]}
            >
              Dispensed prescriptions cannot be deleted — they're referenced by
              sales and stock history.
            </Text>
          ) : null}
        </Card>
      ) : null}

      <View style={styles.bottomPad} />

      <ConfirmDialog
        open={danger !== null}
        onClose={() => setDanger(null)}
        onConfirm={confirmDanger}
        title={
          danger?.kind === 'hard-delete'
            ? 'Permanently delete this prescription?'
            : 'Cancel this prescription?'
        }
        description={
          danger?.kind === 'hard-delete'
            ? 'This cannot be undone. The record is removed from the database.'
            : 'The prescription is marked cancelled. Stock is not affected.'
        }
        confirmLabel={
          danger?.kind === 'hard-delete'
            ? 'Delete permanently'
            : 'Cancel prescription'
        }
        variant="danger"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginTop: 16, marginBottom: 16 },
  ref: { fontSize: 22, fontWeight: '700' },
  headerStatus: { flexDirection: 'row', marginTop: 8 },
  alert: { marginBottom: 12 },
  dispenseBtn: { marginBottom: 16 },
  section: { marginBottom: 16 },
  twoCol: { flexDirection: 'row', gap: 16 },
  col: { flex: 1, minWidth: 0 },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  colIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  colValue: { fontSize: 14, fontWeight: '600' },
  colMeta: { fontSize: 12, marginTop: 3 },
  divider: { marginVertical: 16 },
  timeline: { gap: 6 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timelineText: { fontSize: 12 },
  itemList: { gap: 12 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemLeft: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 13, fontWeight: '500' },
  itemMeta: { fontSize: 12, marginTop: 3 },
  itemNotes: { fontSize: 11, marginTop: 4 },
  itemRight: { alignItems: 'flex-end' },
  itemQty: { fontSize: 14, fontWeight: '700' },
  itemRefills: { fontSize: 10, marginTop: 3 },
  emptyText: { fontSize: 13 },
  notesText: { fontSize: 13, lineHeight: 19 },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  hint: { fontSize: 11, marginTop: 10, lineHeight: 15 },
  bottomPad: { height: 24 },
});