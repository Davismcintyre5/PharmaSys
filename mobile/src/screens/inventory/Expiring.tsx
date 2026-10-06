import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  EmptyState,
  Spinner,
} from '@/components/ui';
import { ExpiryBadge } from '@/components/app/ExpiryBadge';
import { useTheme } from '@/context/ThemeProvider';
import { inventoryApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { formatMoney, formatDate } from '@/utils/format';
import { EXPIRY_THRESHOLDS } from '@/utils/constants';
import type { Batch } from '@/types';

const WINDOWS = [7, 14, 30, 60, 90] as const;
type WindowKey = (typeof WINDOWS)[number];

export default function Expiring() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  const [days, setDays] = useState<WindowKey>(30);

  const listQuery = useQuery({
    queryKey: queryKeys.inventory.expiring(days),
    queryFn: () => inventoryApi.drugs.expiring({ days }),
  });

  const batches: Batch[] = useMemo(
    () => (Array.isArray(listQuery.data) ? listQuery.data : []),
    [listQuery.data]
  );

  const summary = useMemo(() => {
    const now = Date.now();
    let totalValue = 0;
    let critical = 0;
    let warning = 0;
    for (const b of batches) {
      totalValue += (b.qty || 0) * (b.costPrice || 0);
      const d = new Date(b.expiryDate).getTime();
      const daysLeft = Math.ceil((d - now) / 86_400_000);
      if (daysLeft <= EXPIRY_THRESHOLDS.critical) critical++;
      else if (daysLeft <= EXPIRY_THRESHOLDS.warning) warning++;
    }
    return { totalValue, critical, warning };
  }, [batches]);

  const renderItem = ({ item }: { item: Batch }) => {
    const drug = item.drugId as any;
    const drugName = typeof drug === 'object' ? drug?.name : null;
    const drugId = typeof drug === 'object' ? drug?._id : null;
    const value = (item.qty || 0) * (item.costPrice || 0);

    return (
      <Pressable
        onPress={() =>
          drugId ? navigation.navigate('DrugDetail', { drugId }) : null
        }
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text
              style={[styles.name, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {drugName ?? 'Unknown drug'}
            </Text>
            <Text
              style={[styles.meta, { color: theme.colors.textMuted }]}
            >
              Lot {item.lotNo ?? '—'} · {item.qty} units
            </Text>
            <Text
              style={[styles.meta, { color: theme.colors.textSubtle }]}
            >
              Value {formatMoney(value, 'KES')}
            </Text>
          </View>

          <View style={styles.cardRight}>
            <ExpiryBadge expiryDate={item.expiryDate} />
            <Text
              style={[styles.expiry, { color: theme.colors.textMuted }]}
            >
              {formatDate(item.expiryDate)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Expiring soon
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {batches.length} batch{batches.length === 1 ? '' : 'es'} expiring in{' '}
          {days} days
        </Text>
      </View>

      <View style={styles.windowWrap}>
        {WINDOWS.map((w) => {
          const active = days === w;
          return (
            <Pressable
              key={w}
              onPress={() => setDays(w)}
              style={[
                styles.windowPill,
                {
                  backgroundColor: active
                    ? theme.colors.primary
                    : theme.colors.surface2,
                },
              ]}
            >
              <Text
                style={[
                  styles.windowText,
                  { color: active ? '#ffffff' : theme.colors.textMuted },
                ]}
              >
                {w}d
              </Text>
            </Pressable>
          );
        })}
      </View>

      {batches.length > 0 ? (
        <View style={styles.kpiGrid}>
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[styles.kpiLabel, { color: theme.colors.textMuted }]}
            >
              Value at risk
            </Text>
            <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
              {formatMoney(summary.totalValue, 'KES')}
            </Text>
          </View>
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[styles.kpiLabel, { color: theme.colors.danger }]}
            >
              Critical (≤{EXPIRY_THRESHOLDS.critical}d)
            </Text>
            <Text
              style={[styles.kpiValue, { color: theme.colors.text }]}
            >
              {summary.critical}
            </Text>
          </View>
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[styles.kpiLabel, { color: theme.colors.warning }]}
            >
              Warning (≤{EXPIRY_THRESHOLDS.warning}d)
            </Text>
            <Text
              style={[styles.kpiValue, { color: theme.colors.text }]}
            >
              {summary.warning}
            </Text>
          </View>
        </View>
      ) : null}

      {listQuery.isLoading ? (
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      ) : !batches.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <Ionicons
                name="calendar-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title="Nothing expiring"
            description={`No batches expire within the next ${days} days. Try a wider window.`}
          />
        </View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.bottomPad} />}
        />
      )}

      {batches.length > 0 ? (
        <Card style={styles.tips}>
          <View style={styles.tipsHeader}>
            <Ionicons
              name="bulb-outline"
              size={16}
              color={theme.colors.warning}
            />
            <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
              What to do
            </Text>
          </View>
          <View style={styles.tipsList}>
            <Tip text="Discount near-expiry stock to move it faster" />
            <Tip text="Transfer to a busier branch if you have multiple locations" />
            <Tip text="Return to supplier if the batch is unopened and within policy" />
            <Tip text="Write off expired stock from the drug detail page" />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

function Tip({ text }: { text: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.tipRow}>
      <Text style={[styles.tipBullet, { color: theme.colors.textSubtle }]}>
        •
      </Text>
      <Text style={[styles.tipText, { color: theme.colors.textMuted }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginTop: 16, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  windowWrap: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  windowPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  windowText: { fontSize: 12, fontWeight: '600' },
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
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kpiValue: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  list: { gap: 10 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardLeft: { flex: 1, minWidth: 0 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  name: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 4 },
  expiry: { fontSize: 11 },
  tips: { marginTop: 16, marginBottom: 16 },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: { fontSize: 14, fontWeight: '600' },
  tipsList: { gap: 6 },
  tipRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tipBullet: { fontSize: 14, lineHeight: 18 },
  tipText: { fontSize: 12, lineHeight: 18, flex: 1 },
  bottomPad: { height: 24 },
});