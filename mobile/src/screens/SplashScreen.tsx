import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.center}>
        <Image
          source={require('../../assets/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>PharmaSys</Text>
        <Text style={styles.tagline}>Manage your pharmacy</Text>
      </View>

      <ActivityIndicator
        color="#ffffff"
        size="small"
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  spinner: {
    position: 'absolute',
    bottom: 64,
  },
});