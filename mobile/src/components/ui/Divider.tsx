import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

interface DividerProps {
  style?: any;
}

export function Divider({ style }: DividerProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[styles.divider, { backgroundColor: theme.colors.border }, style]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});