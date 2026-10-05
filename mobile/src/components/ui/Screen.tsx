import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeProvider';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboardAvoid?: boolean;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  contentStyle,
  refreshing,
  onRefresh,
  keyboardAvoid = false,
  edges = ['top'],
}: ScreenProps) {
  const { theme } = useTheme();

  const padding = padded ? { paddingHorizontal: 16 } : undefined;

  const inner = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[padding, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentStyle]}>{children}</View>
  );

  const wrapped = keyboardAvoid ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, { backgroundColor: theme.colors.background }, style]}
    >
      {wrapped}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});