import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import InventoryScreen from '@/screens/inventory/Inventory';
import DrugDetailScreen from '@/screens/inventory/DrugDetail';
import DrugFormScreen from '@/screens/inventory/DrugForm';
import LowStockScreen from '@/screens/inventory/LowStock';
import ExpiringScreen from '@/screens/inventory/Expiring';

import { useTheme } from '@/context/ThemeProvider';
import type { InventoryStackParamList } from './types';

const Stack = createStackNavigator<InventoryStackParamList>();

export default function InventoryNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="InventoryHome"
        component={InventoryScreen}
        options={{ title: 'Inventory' }}
      />
      <Stack.Screen
        name="DrugDetail"
        component={DrugDetailScreen}
        options={{ title: 'Drug' }}
      />
      <Stack.Screen
        name="DrugForm"
        component={DrugFormScreen}
        options={({ route }) => ({
          title: route.params?.drugId ? 'Edit Drug' : 'New Drug',
        })}
      />
      <Stack.Screen
        name="LowStock"
        component={LowStockScreen}
        options={{ title: 'Low Stock' }}
      />
      <Stack.Screen
        name="Expiring"
        component={ExpiringScreen}
        options={{ title: 'Expiring Soon' }}
      />
    </Stack.Navigator>
  );
}