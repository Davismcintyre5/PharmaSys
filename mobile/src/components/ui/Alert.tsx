import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeProvider';

type Variant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: Variant;
  title?: string;
  children?: React.ReactNode;
  style?: any;
}

export function Alert({ variant = 'info', title, children, style }: AlertProps) {
  const { theme } = useTheme();

  const map: Record<Variant, { fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    info: { fg: theme.colors.info, icon: 'information-circle' },
    success: { fg: theme.colors.success, icon: 'checkmark-circle' },
    warning: { fg: theme.colors.warning, icon: 'warning' },
    danger: { fg: theme.colors.danger, icon: 'alert-circle' },
  };

  const { fg, icon } = map[variant];

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: fg + '15', borderColor: fg + '40' },
        style,
      ]}
    >
      <Ionicons name={icon} size={18} color={fg} style={styles.icon} />
      <View style={styles.content}>
        {title && <Text style={[styles.title, { color: fg }]}>{title}</Text>}
        {children && (
          <Text style={[styles.body, { color: theme.colors.text }]}>
            {children}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  icon: {
    marginRight: 10,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
});