import React from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export function Spinner({ size = 'small', color }: SpinnerProps) {
  const { theme } = useTheme();
  return <ActivityIndicator size={size} color={color ?? theme.colors.textMuted} />;
}