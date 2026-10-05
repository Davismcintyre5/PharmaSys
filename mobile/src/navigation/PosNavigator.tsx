import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import PosScreen from '@/screens/pos/Pos';
import SaleDetailScreen from '@/screens/sales/SaleDetail';

import { CartProvider } from '@/context/CartProvider';
import { useTheme } from '@/context/ThemeProvider';
import type { PosStackParamList } from './types';

const Stack = createStackNavigator<PosStackParamList>();

export default function PosNavigator() {
  const { theme } = useTheme();

  return (
    <CartProvider>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="PosHome"
          component={PosScreen}
          options={{ title: 'Point of Sale' }}
        />
        <Stack.Screen
          name="SaleDetail"
          component={SaleDetailScreen}
          options={{ title: 'Sale' }}
        />
      </Stack.Navigator>
    </CartProvider>
  );
}