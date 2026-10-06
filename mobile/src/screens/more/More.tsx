import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Screen, Card, Divider } from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { hasPermission, type Permission } from '@/utils/permissions';
import { roleLabel } from '@/utils/enums';

interface MoreItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
  params?: Record<string, unknown>;
  permission?: Permission;
  ownerOnly?: boolean;
}

interface MoreGroup {
  key: string;
  title: string;
  items: MoreItem[];
}

const GROUPS: MoreGroup[] = [
  {
    key: 'operations',
    title: 'Operations',
    items: [
      {
        key: 'sales',
        label: 'Sales',
        icon: 'receipt-outline',
        screen: 'Sales',
      },
      {
        key: 'patients',
        label: 'Patients',
        icon: 'medkit-outline',
        screen: 'Patients',
      },
      {
        key: 'customers',
        label: 'Customers',
        icon: 'people-outline',
        screen: 'Customers',
      },
    ],
  },
  {
    key: 'supply',
    title: 'Supply chain',
    items: [
      {
        key: 'suppliers',
        label: 'Suppliers',
        icon: 'car-outline',
        screen: 'Suppliers',
        permission: 'suppliers.view',
      },
      {
        key: 'purchaseOrders',
        label: 'Purchase orders',
        icon: 'document-text-outline',
        screen: 'PurchaseOrders',
        permission: 'purchase_orders.view',
      },
    ],
  },
  {
    key: 'insights',
    title: 'Insights',
    items: [
      {
        key: 'reports',
        label: 'Reports',
        icon: 'stats-chart-outline',
        screen: 'Reports',
        permission: 'reports.branch',
      },
      {
        key: 'aiInsights',
        label: 'AI insights',
        icon: 'sparkles-outline',
        screen: 'AiInsights',
        permission: 'ai.use',
      },
      {
        key: 'aiForecast',
        label: 'Stock forecast',
        icon: 'trending-up-outline',
        screen: 'AiForecast',
        permission: 'ai.use',
      },
    ],
  },
  {
    key: 'admin',
    title: 'Administration',
    items: [
      {
        key: 'branches',
        label: 'Branches',
        icon: 'business-outline',
        screen: 'Branches',
        ownerOnly: true,
      },
      {
        key: 'users',
        label: 'Staff',
        icon: 'person-add-outline',
        screen: 'Users',
        permission: 'users.view',
      },
      {
        key: 'billing',
        label: 'Billing',
        icon: 'card-outline',
        screen: 'Billing',
        ownerOnly: true,
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: 'settings-outline',
        screen: 'Settings',
      },
    ],
  },
];

export default function More() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user, tenant } = useAuth();

  function canSee(item: MoreItem): boolean {
    if (item.ownerOnly && user?.role !== 'owner') return false;
    if (item.permission && !hasPermission(user?.role, item.permission)) {
      return false;
    }
    return true;
  }

  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(canSee),
  })).filter((g) => g.items.length > 0);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View
          style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
        </View>

        <Text style={[styles.name, { color: theme.colors.text }]}>
          {user?.fullName ?? '—'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {roleLabel(user?.role ?? '')}
          {tenant?.name ? ` · ${tenant.name}` : ''}
        </Text>
      </View>

      {visibleGroups.map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={[styles.groupTitle, { color: theme.colors.textMuted }]}>
            {group.title.toUpperCase()}
          </Text>

          <Card style={styles.groupCard} plain>
            {group.items.map((item, idx) => (
              <React.Fragment key={item.key}>
                <Pressable
                  onPress={() =>
                    navigation.navigate(item.screen, item.params as any)
                  }
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: pressed
                        ? theme.colors.surface2
                        : 'transparent',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.rowIcon,
                      { backgroundColor: theme.colors.primary + '15' },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text
                    style={[styles.rowLabel, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.textSubtle}
                  />
                </Pressable>

                {idx < group.items.length - 1 ? (
                  <Divider style={{ marginLeft: 60 }} />
                ) : null}
              </React.Fragment>
            ))}
          </Card>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSubtle }]}>
          PharmaSys
        </Text>
      </View>

      <View style={styles.bottomPad} />
    </Screen>
  );
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupCard: {
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bottomPad: {
    height: 24,
  },
});