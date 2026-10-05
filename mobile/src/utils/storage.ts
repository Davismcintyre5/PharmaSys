import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SECURE_KEYS = new Set(['token', 'pharmasys_refresh', 'user', 'invoice', 'scope']);

function useSecure(key: string): boolean {
  return Platform.OS !== 'web' && SECURE_KEYS.has(key);
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return useSecure(key)
        ? await SecureStore.getItemAsync(key)
        : await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (useSecure(key)) await SecureStore.setItemAsync(key, value);
      else await AsyncStorage.setItem(key, value);
    } catch {}
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (useSecure(key)) await SecureStore.deleteItemAsync(key);
      else await AsyncStorage.removeItem(key);
    } catch {}
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await storage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setJSON(key: string, value: unknown): Promise<void> {
    await storage.setItem(key, JSON.stringify(value));
  },
};