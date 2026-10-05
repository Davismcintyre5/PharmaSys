import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'ghost' | 'solid' | 'outline';

interface IconButtonProps {
  onPress?: () => void;
  size?: Size;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
  accessibilityLabel?: string;
}

export function IconButton({
  onPress,
  size = 'md',
  variant = 'ghost',
  disabled,
  style,
  children,
  accessibilityLabel,
}: IconButtonProps) {
  const { theme } = useTheme();

  const dim = size === 'sm' ? 32 : size === 'lg' ? 44 : 38;

  const bg =
    variant === 'solid'
      ? theme.colors.primary
      : variant === 'outline'
      ? 'transparent'
      : 'transparent';

  const borderWidth = variant === 'outline' ? 1 : 0;
  const borderColor = theme.colors.border;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: bg,
          borderWidth,
          borderColor,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});