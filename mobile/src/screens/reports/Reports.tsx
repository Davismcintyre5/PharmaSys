import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Screen, Card } from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';

interface ReportLink {
  to: string;
  category: string;
  slug: string;
  title: string;
  description: string;
}

interface ReportGroup {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'accent';
  items: ReportLink[];
}

const GROUPS: ReportGroup[] = [
  {
    key: 'inventory',
    title: 'Inventory',
    icon: 'cube-outline',
    accent: 'primary',
    items: [
      {
        to: 'inventory/stock',
        category: 'inventory',
        slug: 'stock',
        title: 'Stock on hand',
        description: 'Every drug and its current stock',
      },
      {
        to: 'inventory/valuation',
        category: 'inventory',
        slug: 'valuation',
        title: 'Stock valuation',
        description: 'Cost and retail value of current stock',
      },
      {
        to: 'inventory/low-stock',
        category: 'inventory',
        slug: 'low-stock',
        title: 'Low stock',
        description: 'Drugs at or below reorder level',
      },
      {
        to: 'inventory/expiring',
        category: 'inventory',
        slug: 'expiring',
        title: 'Expiring soon',
        description: 'Batches approaching expiry',
      },
    ],
  },
  {
    key: 'sales',
    title: 'Sales',
    icon: 'receipt-outline',
    accent: 'success',
    items: [
      {
        to: 'sales/daily',
        category: 'sales',
        slug: 'daily',
        title: 'Daily summary',
        description: "Today's sales and transactions",
      },
      {
        to: 'sales/range',
        category: 'sales',
        slug: 'range',
        title: 'Sales range',
        description: 'Sales over a chosen date range',
      },
      {
        to: 'sales/top-drugs',
        category: 'sales',
        slug: 'top-drugs',
        title: 'Top drugs',
        description: 'Best sellers by units and revenue',
      },
      {
        to: 'sales/by-method',
        category: 'sales',
        slug: 'by-method',
        title: 'Payment methods',
        description: 'Sales grouped by payment type',
      },
    ],
  },
  {
    key: 'customers',
    title: 'Customers',
    icon: 'people-outline',
    accent: 'info',
    items: [
      {
        to: 'customers/list',
        category: 'customers',
        slug: 'list',
        title: 'Customer list',
        description: 'All active customers',
      },
      {
        to: 'customers/top',
        category: 'customers',
        slug: 'top',
        title: 'Top spenders',
        description: 'Customers ranked by lifetime spend',
      },
      {
        to: 'customers/history',
        category: 'customers',
        slug: 'history',
        title: 'Purchase history',
        description: 'Recent purchases per customer',
      },
    ],
  },
  {
    key: 'patients',
    title: 'Patients',
    icon: 'medkit-outline',
    accent: 'warning',
    items: [
      {
        to: 'patients/list',
        category: 'patients',
        slug: 'list',
        title: 'Patient list',
        description: 'All active patient records',
      },
      {
        to: 'patients/demographics',
        category: 'patients',
        slug: 'demographics',
        title: 'Demographics',
        description: 'Age and gender breakdown',
      },
      {
        to: 'patients/visits',
        category: 'patients',
        slug: 'visits',
        title: 'Visit history',
        description: 'Most frequent visitors',
      },
    ],
  },
  {
    key: 'staff',
    title: 'Staff',
    icon: 'person-outline',
    accent: 'accent',
    items: [
      {
        to: 'staff/list',
        category: 'staff',
        slug: 'list',
        title: 'Staff list',
        description: 'Every team member and role',
      },
      {
        to: 'staff/by-role',
        category: 'staff',
        slug: 'by-role',
        title: 'By role',
        description: 'Headcount grouped by role',
      },
      {
        to: 'staff/activity',
        category: 'staff',
        slug: 'activity',
        title: 'Activity',
        description: 'Logins and sales per cashier',
      },
    ],
  },
  {
    key: 'general',
    title: 'General',
    icon: 'stats-chart-outline',
    accent: 'danger',
    items: [
      {
        to: 'general/summary',
        category: 'general',
        slug: 'summary',
        title: 'Business summary',
        description: 'High-level pharmacy overview',
      },
      {
        to: 'general/tax',
        category: 'general',
        slug: 'tax',
        title: 'Tax report',
        description: 'Tax collected over a period',
      },
      {
        to: 'general/expiry-loss',
        category: 'general',
        slug: 'expiry-loss',
        title: 'Expiry loss',
        description: 'Value lost to expiring stock',
      },
    ],
  },
];

function accentColor(
  tint: ReportGroup['accent'],
  colors: {
    primary: string;
    success: string;
    info: string;
    warning: string;
    danger: string;
    accent: string;
  }
): string {
  return colors[tint];
}

export default function Reports() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Reports
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          View, filter, and print any report
        </Text>
      </View>

      {GROUPS.map((group) => {
        const color = accentColor(group.accent, theme.colors);
        return (
          <View key={group.key} style={styles.group}>
            <View style={styles.groupHeader}>
              <View
                style={[
                  styles.groupIcon,
                  { backgroundColor: color + '15' },
                ]}
              >
                <Ionicons name={group.icon} size={16} color={color} />
              </View>
              <View style={styles.groupText}>
                <Text style={[styles.groupTitle, { color: theme.colors.text }]}>
                  {group.title}
                </Text>
                <Text
                  style={[
                    styles.groupSubtitle,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {group.items.length} report
                  {group.items.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            <View style={styles.groupItems}>
              {group.items.map((item) => (
                <Pressable
                  key={item.to}
                  onPress={() =>
                    navigation.navigate('ReportView', {
                      category: item.category,
                      slug: item.slug,
                    })
                  }
                  style={({ pressed }) => [
                    styles.reportCard,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: pressed
                        ? theme.colors.surface2
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.reportIcon,
                      { backgroundColor: theme.colors.surface2 },
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color={theme.colors.textMuted}
                    />
                  </View>
                  <View style={styles.reportText}>
                    <Text
                      style={[
                        styles.reportTitle,
                        { color: theme.colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.reportDesc,
                        { color: theme.colors.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.textSubtle}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.bottomPad} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 16, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  group: { marginBottom: 24 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  groupIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupText: { flex: 1 },
  groupTitle: { fontSize: 15, fontWeight: '600' },
  groupSubtitle: { fontSize: 11, marginTop: 2 },
  groupItems: { gap: 8 },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  reportIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportText: { flex: 1, minWidth: 0 },
  reportTitle: { fontSize: 13, fontWeight: '600' },
  reportDesc: { fontSize: 11, marginTop: 2 },
  bottomPad: { height: 24 },
});