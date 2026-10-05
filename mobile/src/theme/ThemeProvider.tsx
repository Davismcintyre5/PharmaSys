import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, type AppTheme } from './index';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: AppTheme;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw === 'light' || raw === 'dark' || raw === 'system') {
          setModeState(raw);
        }
      })
      .catch(() => null)
      .finally(() => setHydrated(true));
  }, []);

  const resolved: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => null);
  };

  const toggle = () => {
    setMode(resolved === 'dark' ? 'light' : 'dark');
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolved === 'dark' ? darkTheme : lightTheme,
      mode,
      isDark: resolved === 'dark',
      setMode,
      toggle,
    }),
    [resolved, mode]
  );

  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}