import React from 'react';
import Toast, {
  BaseToast,
  ErrorToast,
  InfoToast,
  type ToastConfig,
} from 'react-native-toast-message';
import { useTheme } from './ThemeProvider';

export function ToastProvider() {
  const { theme } = useTheme();

  const config: ToastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: theme.colors.success,
          backgroundColor: theme.colors.surface,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          color: theme.colors.text,
          fontSize: 14,
          fontWeight: '600',
        }}
        text2Style={{
          color: theme.colors.textMuted,
          fontSize: 12,
        }}
      />
    ),
    error: (props) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: theme.colors.danger,
          backgroundColor: theme.colors.surface,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          color: theme.colors.text,
          fontSize: 14,
          fontWeight: '600',
        }}
        text2Style={{
          color: theme.colors.textMuted,
          fontSize: 12,
        }}
      />
    ),
    info: (props) => (
      <InfoToast
        {...props}
        style={{
          borderLeftColor: theme.colors.info,
          backgroundColor: theme.colors.surface,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          color: theme.colors.text,
          fontSize: 14,
          fontWeight: '600',
        }}
        text2Style={{
          color: theme.colors.textMuted,
          fontSize: 12,
        }}
      />
    ),
  };

  return <Toast config={config} position="top" topOffset={60} />;
}