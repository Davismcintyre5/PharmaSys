import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  style?: any;
}

export function Badge({ children, variant = 'neutral', style }: BadgeProps) {
  const { theme } = useTheme();

  const map: Record<Variant, { bg: string; fg: string; border: string }> = {
    neutral: {
      bg: theme.colors.surface2,
      fg: theme.colors.textMuted,
      border: theme.colors.border,
    },
    success: {
      bg: theme.colors.success + '20',
      fg: theme.colors.success,
      border: theme.colors.success + '60',
    },
    warning: {
      bg: theme.colors.warning + '20',
      fg: theme.colors.warning,
      border: theme.colors.warning + '60',
    },
    danger: {
      bg: theme.colors.danger + '20',
      fg: theme.colors.danger,
      border: theme.colors.danger + '60',
    },
    info: {
      bg: theme.colors.info + '20',
      fg: theme.colors.info,
      border: theme.colors.info + '60',
    },
    accent: {
      bg: theme.colors.accent + '20',
      fg: theme.colors.accent,
      border: theme.colors.accent + '60',
    },
  };

  const c = map[variant];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border },
        style,
      ]}
    >
      <Text style={[styles.text, { color: c.fg }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});