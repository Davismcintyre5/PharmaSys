import React, { forwardRef, useState } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

interface TextareaProps extends TextInputProps {
  invalid?: boolean;
}

export const Textarea = forwardRef<TextInput, TextareaProps>(
  ({ invalid, style, ...rest }, ref) => {
    const { theme } = useTheme();
    const [focused, setFocused] = useState(false);

    const borderColor = invalid
      ? theme.colors.danger
      : focused
      ? theme.colors.primary
      : theme.colors.border;

    return (
      <TextInput
        ref={ref}
        multiline
        textAlignVertical="top"
        placeholderTextColor={theme.colors.textSubtle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.textarea,
          {
            borderColor,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
          },
          style,
        ]}
        {...rest}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

const styles = StyleSheet.create({
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 90,
  },
});