import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTheme } from '@/context/ThemeProvider';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading,
}: ConfirmDialogProps) {
  const { theme } = useTheme();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      busy={loading}
      footer={
        <>
          <Button
            variant="ghost"
            title={cancelLabel}
            onPress={onClose}
            disabled={loading}
          />
          <Button
            variant={variant}
            title={confirmLabel}
            onPress={onConfirm}
            loading={loading}
          />
        </>
      }
    >
      {description && (
        <Text style={[styles.desc, { color: theme.colors.textMuted }]}>
          {description}
        </Text>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  desc: {
    fontSize: 14,
    lineHeight: 20,
  },
});