import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeProvider';

interface ListItemProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  danger?: boolean;
}

export function ListItem({
  title,
  subtitle,
  left,
  right,
  showChevron,
  onPress,
  danger,
}: ListItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surface2 : 'transparent',
        },
      ]}
    >
      {left && <View style={styles.left}>{left}</View>}

      <View style={styles.middle}>
        <Text
          style={[
            styles.title,
            { color: danger ? theme.colors.danger : theme.colors.text },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: theme.colors.textMuted }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {right}

      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textSubtle}
          style={styles.chevron}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  left: {
    marginRight: 12,
  },
  middle: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
  },
});