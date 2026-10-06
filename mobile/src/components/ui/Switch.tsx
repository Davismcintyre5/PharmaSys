import React from 'react';
import { Switch as RNSwitch, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Switch({ checked, onChange, disabled, label }: SwitchProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      ) : null}
      <RNSwitch
        value={checked}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.primary,
        }}
        thumbColor={theme.colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 14, flex: 1 },
});