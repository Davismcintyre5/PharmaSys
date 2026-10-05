import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: any;
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 6,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const opacity = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.surface2,
          opacity,
        },
        style,
      ]}
    />
  );
}