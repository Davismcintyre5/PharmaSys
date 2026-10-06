import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Screen, Card, Button, Spinner, EmptyState } from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { aiApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { formatRelativeTime } from '@/utils/format';
import type { AiInsight } from '@/types';

export default function AiInsights() {
  const { theme } = useTheme();
  const toast = useToast();

  const insightsQuery = useQuery({
    queryKey: queryKeys.ai.insights,
    queryFn: () => aiApi.insights(false),
  });

  const insight: AiInsight | null = insightsQuery.data ?? null;

  async function regenerate() {
    try {
      await aiApi.insights(true);
      await insightsQuery.refetch();
      toast.success('Insight regenerated');
    } catch (e: any) {
      toast.error(e?.message || 'Could not regenerate');
    }
  }

  if (insightsQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  const text = insight?.payload?.text;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: theme.colors.primary + '15' },
          ]}
        >
          <Ionicons name="sparkles" size={24} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Weekly insight
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Performance summary for your pharmacy
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Regenerate"
          variant="outline"
          onPress={regenerate}
          loading={insightsQuery.isFetching}
          leftIcon={
            <Ionicons
              name="refresh"
              size={16}
              color={theme.colors.text}
            />
          }
        />
      </View>

      {!text ? (
        <Card>
          <EmptyState
            icon={
              <Ionicons
                name="sparkles-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title="No insight yet"
            description="Generate your first weekly insight to see how the pharmacy is doing."
            action={
              <Button
                title="Generate insight"
                onPress={regenerate}
                loading={insightsQuery.isFetching}
              />
            }
          />
        </Card>
      ) : (
        <Card>
          <View
            style={[
              styles.metaRow,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.metaLeft}>
              <Ionicons
                name="time-outline"
                size={12}
                color={theme.colors.textSubtle}
              />
              <Text style={[styles.metaText, { color: theme.colors.textSubtle }]}>
                Generated {formatRelativeTime(insight!.generatedAt)}
              </Text>
            </View>
            {insight?.model ? (
              <Text style={[styles.model, { color: theme.colors.textSubtle }]}>
                {insight.model}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.body, { color: theme.colors.text }]}>
            {text}
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginTop: 16, marginBottom: 16 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  actions: { alignItems: 'center', marginBottom: 16 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 11 },
  model: { fontSize: 10 },
  body: { fontSize: 14, lineHeight: 21 },
});