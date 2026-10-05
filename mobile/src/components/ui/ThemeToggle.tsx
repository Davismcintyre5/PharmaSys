import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { IconButton } from './IconButton';
import { useTheme } from '@/context/ThemeProvider';

export function ThemeToggle() {
  const { isDark, toggle, theme } = useTheme();

  return (
    <IconButton
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onPress={toggle}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={20}
        color={theme.colors.text}
      />
    </IconButton>
  );
}