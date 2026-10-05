import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeProvider';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
}

export function Select({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  invalid,
  disabled,
  label,
  required,
  error,
  hint,
}: SelectProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const displayText = selected?.label ?? placeholder;

  return (
    <View>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
          {required && <Text style={{ color: theme.colors.danger }}> *</Text>}
        </Text>
      )}

      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={[
          styles.trigger,
          {
            borderColor: invalid ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.surface,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color: selected ? theme.colors.text : theme.colors.textSubtle,
            },
          ]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={theme.colors.textSubtle}
        />
      </Pressable>

      {error ? (
        <Text style={[styles.helper, { color: theme.colors.danger }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>
          {hint}
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.sheet,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => {
                    const active = item.value === value;
                    return (
                      <Pressable
                        onPress={() => {
                          if (item.disabled) return;
                          onChange(item.value);
                          setOpen(false);
                        }}
                        style={[
                          styles.option,
                          active && { backgroundColor: theme.colors.surface2 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            {
                              color: item.disabled
                                ? theme.colors.textSubtle
                                : active
                                ? theme.colors.primary
                                : theme.colors.text,
                              fontWeight: active ? '600' : '400',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        {active && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={theme.colors.primary}
                          />
                        )}
                      </Pressable>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  trigger: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  helper: {
    fontSize: 12,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingVertical: 8,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 15,
  },
});