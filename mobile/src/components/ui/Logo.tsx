import React from 'react';
import { Image, StyleSheet, ImageStyle } from 'react-native';
import { useSite } from '@/context/SiteProvider';

interface LogoProps {
  size?: number;
  style?: ImageStyle;
}

export function Logo({ size = 32, style }: LogoProps) {
  const { brand } = useSite();

  const source = brand?.logoUrl
    ? { uri: brand.logoUrl }
    : require('../../../assets/splash-icon.png');

  return (
    <Image
      source={source}
      style={[styles.logo, { width: size, height: size, borderRadius: size / 2 }, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: 'transparent',
  },
});