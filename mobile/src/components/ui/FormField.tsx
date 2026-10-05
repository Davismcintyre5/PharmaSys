import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

export function FormField({
  label,
  hint,
  error,
  required,
  style,
  children,
}: FormFieldProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
          {required && <Text style={{ color: theme.colors.danger }}> *</Text>}
        </Text>
      )}
      {children}
      {error ? (
        <Text style={[styles.helper, { color: theme.colors.danger }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  helper: {
    fontSize: 12,
    marginTop: 4,
  },
});