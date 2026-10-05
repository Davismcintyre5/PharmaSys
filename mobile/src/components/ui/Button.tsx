import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'link';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const height = size === 'sm' ? 36 : size === 'lg' ? 48 : 42;
  const paddingH = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  const bg =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
      ? theme.colors.danger
      : variant === 'secondary'
      ? theme.colors.surface2
      : 'transparent';

  const fg =
    variant === 'primary' || variant === 'danger'
      ? '#ffffff'
      : variant === 'link'
      ? theme.colors.primary
      : theme.colors.text;

  const borderColor =
    variant === 'outline' || variant === 'secondary'
      ? theme.colors.border
      : 'transparent';

  const borderWidth = variant === 'outline' || variant === 'secondary' ? 1 : 0;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          paddingHorizontal: paddingH,
          backgroundColor: bg,
          borderColor,
          borderWidth,
          borderRadius: 8,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          {(title || children) && (
            <Text
              style={[
                {
                  color: fg,
                  fontSize,
                  fontWeight: '600',
                  textDecorationLine: variant === 'link' ? 'underline' : 'none',
                },
                textStyle,
              ]}
              numberOfLines={1}
            >
              {title ?? children}
            </Text>
          )}
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});