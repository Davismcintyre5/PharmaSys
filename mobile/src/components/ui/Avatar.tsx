import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

interface AvatarProps {
  name?: string | null;
  uri?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const DIMS = { sm: 28, md: 36, lg: 48 };
const FONTS = { sm: 12, md: 14, lg: 18 };

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export function Avatar({ name, uri, size = 'md' }: AvatarProps) {
  const { theme } = useTheme();
  const dim = DIMS[size];
  const fontSize = FONTS[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: dim, height: dim, borderRadius: dim / 2 }}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: theme.colors.primary,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
  },
});