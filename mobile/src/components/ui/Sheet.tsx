import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeProvider';
import { IconButton } from './IconButton';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: `${number}%`;
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  maxHeight = '80%',
}: SheetProps) {
  const { theme } = useTheme();

  if (!open) return null;

  return (
    <RNModal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.surface, maxHeight },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          {title && (
            <View
              style={[styles.header, { borderBottomColor: theme.colors.border }]}
            >
              <Text style={[styles.headerText, { color: theme.colors.text }]}>
                {title}
              </Text>
              <IconButton
                accessibilityLabel="Close"
                size="sm"
                onPress={onClose}
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
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footer && (
            <View
              style={[styles.footer, { borderTopColor: theme.colors.border }]}
            >
              {footer}
            </View>
          )}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.5)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    padding: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});