import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

interface InputProps extends TextInputProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  invalid?: boolean;
  containerStyle?: ViewStyle;
  error?: string | null;
  label?: string;
  hint?: string;
  required?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      leftIcon,
      rightIcon,
      invalid,
      containerStyle,
      error,
      label,
      hint,
      required,
      style,
      ...rest
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [focused, setFocused] = useState(false);

    const borderColor = invalid
      ? theme.colors.danger
      : focused
      ? theme.colors.primary
      : theme.colors.border;

    return (
      <View style={containerStyle}>
        {label && (
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {label}
            {required && <Text style={{ color: theme.colors.danger }}> *</Text>}
          </Text>
        )}

        <View
          style={[
            styles.wrapper,
            {
              borderColor,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            placeholderTextColor={theme.colors.textSubtle}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                paddingLeft: leftIcon ? 36 : 12,
                paddingRight: rightIcon ? 36 : 12,
              },
              style,
            ]}
            {...rest}
          />

          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>

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
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  iconLeft: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  iconRight: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  helper: {
    fontSize: 12,
    marginTop: 4,
  },
});