import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

interface CardProps {
  header?: string;
  footer?: React.ReactNode;
  plain?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

export function Card({ header, footer, plain, style, children }: CardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: plain ? 0 : 1,
        },
        style,
      ]}
    >
      {header && (
        <View
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            {header}
          </Text>
        </View>
      )}

      <View style={styles.body}>{children}</View>

      {footer && (
        <View
          style={[styles.footer, { borderTopColor: theme.colors.border }]}
        >
          {footer}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    padding: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});