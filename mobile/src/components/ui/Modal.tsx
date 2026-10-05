import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeProvider';
import { IconButton } from './IconButton';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlay?: boolean;
  busy?: boolean;
}

const MAX_WIDTH: Record<string, number> = {
  sm: 340,
  md: 420,
  lg: 520,
  xl: 680,
};

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  closeOnOverlay = true,
  busy = false,
}: ModalProps) {
  const { theme } = useTheme();

  useEffect(() => {
    if (busy) return;
    return undefined;
  }, [busy]);

  if (!open) return null;

  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={busy ? undefined : onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Pressable
          style={styles.overlay}
          onPress={closeOnOverlay && !busy ? onClose : undefined}
        >
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                maxWidth: MAX_WIDTH[size],
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {title && (
              <View
                style={[
                  styles.header,
                  { borderBottomColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[styles.headerText, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                <IconButton
                  accessibilityLabel="Close"
                  size="sm"
                  onPress={onClose}
                  disabled={busy}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </IconButton>
              </View>
            )}

            <ScrollView
              style={styles.bodyScroll}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            {footer && (
              <View
                style={[
                  styles.footer,
                  { borderTopColor: theme.colors.border },
                ]}
              >
                {footer}
              </View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  bodyScroll: {
    flexGrow: 0,
  },
  body: {
    padding: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});