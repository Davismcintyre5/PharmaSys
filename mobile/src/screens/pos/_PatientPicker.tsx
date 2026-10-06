import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Modal, Input, Badge, EmptyState, Spinner } from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { patientApi } from '@/api/axios';
import type { Patient } from '@/types';

interface Props {
  onPick: (p: Patient) => void;
  onClose: () => void;
}

export function PatientPicker({ onPick, onClose }: Props) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);

  const listQuery = useQuery({
    queryKey: ['patients', 'picker', debounced],
    queryFn: () => patientApi.list(debounced ? { search: debounced } : {}),
  });

  const results: Patient[] = useMemo(() => {
    const raw = listQuery.data;
    const arr = Array.isArray(raw) ? raw : ((raw as any)?.items ?? []);
    return arr.slice(0, 30);
  }, [listQuery.data]);

  return (
    <Modal
      open
      onClose={onClose}
      title="Attach patient"
      size="md"
      footer={null}
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search patients by name or phone…"
        leftIcon={
          <Ionicons
            name="search"
            size={14}
            color={theme.colors.textSubtle}
          />
        }
        autoFocus
      />

      <View style={styles.listWrap}>
        {listQuery.isLoading ? (
          <View style={styles.center}>
            <Spinner />
          </View>
        ) : !results.length ? (
          <EmptyState
            icon={
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.colors.textMuted}
              />
            }
            title={query ? 'No matches' : 'No patients'}
            description={
              query ? 'Try a different search.' : 'Add a patient first.'
            }
          />
        ) : (
          <View>
            {results.map((item) => (
              <Pressable
                key={item._id}
                onPress={() => onPick(item)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed
                      ? theme.colors.surface2
                      : 'transparent',
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.rowLeft}>
                  <Text
                    style={[styles.name, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.phone ? (
                    <Text
                      style={[styles.meta, { color: theme.colors.textMuted }]}
                    >
                      {item.phone}
                    </Text>
                  ) : null}
                </View>
                {item.allergies?.length ? (
                  <Badge variant="danger">
                    {item.allergies.length} allerg
                    {item.allergies.length === 1 ? 'y' : 'ies'}
                  </Badge>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  listWrap: { marginTop: 12 },
  center: { paddingVertical: 32, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '500' },
  meta: { fontSize: 12, marginTop: 2 },
});