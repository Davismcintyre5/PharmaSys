import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { queryClient } from '@/config/queryClient';
import { ThemeProvider, useTheme } from '@/context/ThemeProvider';
import { SiteProvider } from '@/context/SiteProvider';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { BranchProvider } from '@/context/BranchProvider';
import { SocketProvider } from '@/context/SocketProvider';
import { CartProvider } from '@/context/CartProvider';
import { ToastProvider } from '@/context/ToastProvider';

import { RootNavigator } from '@/navigation';
import { navigationRef } from '@/navigation/navigationRef';

import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { useDeepLinks } from '@/hooks/useDeepLinks';

import { checkForUpdate } from '@/utils/updateChecker';

function AppInner() {
  const { theme, isDark } = useTheme();
  const { isLoading } = useAuth();

  useSessionRefresh();
  useDeepLinks();

  React.useEffect(() => {
    const t = setTimeout(() => {
      checkForUpdate(false);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: isDark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.danger,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!isLoading && <RootNavigator />}
      <ToastProvider />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <SiteProvider>
              <AuthProvider>
                <BranchProvider>
                  <SocketProvider>
                    <CartProvider>
                      <AppInner />
                    </CartProvider>
                  </SocketProvider>
                </BranchProvider>
              </AuthProvider>
            </SiteProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}