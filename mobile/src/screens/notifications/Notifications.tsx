import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Screen,
  Card,
  Button,
  ConfirmDialog,
  EmptyState,
  Spinner,
  Badge,
} from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { useSocket } from '@/context/SocketProvider';
import { notificationApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import { formatRelativeTime } from '@/utils/format';
import type { AppNotification, NotificationType } from '@/types';

type TabKey = 'all' | 'unread' | NotificationType;

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  warning: 'warning-outline',
  error: 'alert-circle-outline',
  sale: 'bag-handle-outline',
  inventory: 'cube-outline',
  prescription: 'medkit-outline',
  subscription: 'card-outline',
  system: 'settings-outline',
};

const TINT_MAP: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'danger',
  sale: 'success',
  inventory: 'warning',
  prescription: 'info',
  subscription: 'accent',
  system: 'neutral',
};

export default function Notifications() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { setNotifications: setSocketNotifications, markAllRead: socketMarkAllRead } =
    useSocket();

  const [tab, setTab] = useState<TabKey>('all');
  const [clearing, setClearing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: queryKeys.notifications.list({
      unread: tab === 'unread' ? true : undefined,
    }),
    queryFn: () =>
      notificationApi.list(tab === 'unread' ? { unread: true } : {}),
  });

  const items: AppNotification[] = useMemo(
    () => (Array.isArray(listQuery.data) ? listQuery.data : []),
    [listQuery.data]
  );

  useEffect(() => {
    if (items.length) {
      setSocketNotifications(items);
    }
  }, [items, setSocketNotifications]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      unread: items.filter((n) => !n.readAt).length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    if (tab === 'all' || tab === 'unread') return items;
    return items.filter((n) => n.type === tab);
  }, [items, tab]);

  async function markRead(n: AppNotification) {
    if (n.readAt) return;
    setBusyId(n._id);
    try {
      await notificationApi.markRead(n._id);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (e: any) {
      toast.error(e?.message || 'Failed to mark read');
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    try {
      await notificationApi.markAllRead();
      socketMarkAllRead();
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked read');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to mark all read');
    }
  }

  async function removeOne(n: AppNotification) {
    setBusyId(n._id);
    try {
      await notificationApi.remove(n._id);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  }

  async function clearRead() {
    try {
      await notificationApi.clear();
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Cleared read notifications');
      setClearing(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to clear');
    }
  }

  async function handleTap(n: AppNotification) {
    await markRead(n);
    if (n.link) {
      const parts = n.link.split('/');
      const last = parts[parts.length - 1];
      const second = parts[parts.length - 2];

      if (second === 'sales' && last) {
        navigation.navigate('MoreTab', {
          screen: 'SaleDetail',
          params: { saleId: last },
        });
        return;
      }
      if (second === 'patients' && last) {
        navigation.navigate('MoreTab', {
          screen: 'PatientDetail',
          params: { patientId: last },
        });
        return;
      }
      if (second === 'prescriptions' && last) {
        navigation.navigate('MoreTab', {
          screen: 'PrescriptionsTab',
        });
        return;
      }
      if (second === 'inventory' && last) {
        navigation.navigate('InventoryTab', {
          screen: 'DrugDetail',
          params: { drugId: last },
        });
        return;
      }
      if (second === 'purchase-orders' && last) {
        navigation.navigate('MoreTab', {
          screen: 'PurchaseOrderDetail',
          params: { purchaseOrderId: last },
        });
        return;
      }
    }
  }

  const tabs: { value: TabKey; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'unread', label: 'Unread', count: counts.unread },
    { value: 'sale', label: 'Sales' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'prescription', label: 'Rx' },
    { value: 'subscription', label: 'Billing' },
    { value: 'system', label: 'System' },
  ];

  const renderItem = ({ item }: { item: AppNotification }) => {
    const unread = !item.readAt;
    const isBusy = busyId === item._id;
    const icon = ICON_MAP[item.type] ?? ICON_MAP.info;
    const tint = TINT_MAP[item.type] ?? 'neutral';

    const tintColor =
      tint === 'success'
        ? theme.colors.success
        : tint === 'warning'
        ? theme.colors.warning
        : tint === 'danger'
        ? theme.colors.danger
        : tint === 'info'
        ? theme.colors.info
        : tint === 'accent'
        ? theme.colors.accent
        : theme.colors.textMuted;

    return (
      <Pressable
        onPress={() => handleTap(item)}
        style={({ pressed }) => [
          styles.notif,
          {
            backgroundColor: unread
              ? theme.colors.primary + '08'
              : theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: isBusy ? 0.6 : pressed ? 0.9 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.notifIcon,
            { backgroundColor: tintColor + '15' },
          ]}
        >
          <Ionicons name={icon} size={18} color={tintColor} />
        </View>

        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text
              style={[
                styles.notifTitle,
                {
                  color: unread ? theme.colors.text : theme.colors.textMuted,
                  fontWeight: unread ? '600' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {unread && (
              <View
                style={[
                  styles.unreadDot,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            )}
          </View>

          {item.body ? (
            <Text
              style={[styles.notifBody, { color: theme.colors.textMuted }]}
              numberOfLines={2}
            >
              {item.body}
            </Text>
          ) : null}

          <View style={styles.notifFooter}>
            <Text
              style={[styles.notifTime, { color: theme.colors.textSubtle }]}
            >
              {formatRelativeTime(item.createdAt)}
            </Text>
            <Badge variant="neutral">{item.type}</Badge>
          </View>
        </View>

        <Pressable
          onPress={() => removeOne(item)}
          style={styles.notifDelete}
          hitSlop={8}
        >
          <Ionicons
            name="trash-outline"
            size={14}
            color={theme.colors.textSubtle}
          />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Notifications
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {counts.all} total · {counts.unread} unread
          </Text>
        </View>
      </View>

      <View style={styles.headerActions}>
        {counts.unread > 0 && (
          <Button
            title="Mark all read"
            size="sm"
            variant="outline"
            onPress={markAllRead}
            leftIcon={
              <Ionicons
                name="checkmark-done"
                size={14}
                color={theme.colors.text}
              />
            }
          />
        )}
        <Button
          title="Clear read"
          size="sm"
          variant="ghost"
          onPress={() => setClearing(true)}
          disabled={counts.all === 0}
          leftIcon={
            <Ionicons
              name="trash-outline"
              size={14}
              color={theme.colors.textMuted}
            />
          }
        />
      </View>

      <View style={styles.tabsScroll}>
        <View style={styles.tabs}>
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
      </View>

      {listQuery.isLoading ? (
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      ) : !filtered.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              <Ionicons
                name="notifications-outline"
                size={22}
                color={theme.colors.textMuted}
              />
            }
            title={
              tab === 'unread'
                ? 'All caught up'
                : tab === 'all'
                ? 'No notifications yet'
                : 'Nothing here'
            }
            description={
              tab === 'unread'
                ? "You've read everything."
                : 'Notifications from sales, inventory, and your account appear here.'
            }
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.bottomPad} />}
        />
      )}

      <ConfirmDialog
        open={clearing}
        onClose={() => setClearing(false)}
        onConfirm={clearRead}
        title="Clear read notifications?"
        description="This removes all read notifications. Unread notifications stay."
        confirmLabel="Clear read"
        variant="danger"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginTop: 16, marginBottom: 8 },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  tabsScroll: { marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabText: { fontSize: 12, fontWeight: '500' },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  list: { gap: 8 },
  notif: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1, minWidth: 0 },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifTitle: { fontSize: 13, flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  notifBody: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  notifTime: { fontSize: 10 },
  notifDelete: { padding: 4, flexShrink: 0 },
  bottomPad: { height: 24 },
});