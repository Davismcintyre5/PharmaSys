import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import PrescriptionsScreen from '@/screens/prescriptions/Prescriptions';
import PrescriptionDetailScreen from '@/screens/prescriptions/PrescriptionDetail';
import NewPrescriptionScreen from '@/screens/prescriptions/NewPrescription';

import { useTheme } from '@/context/ThemeProvider';
import type { PrescriptionsStackParamList } from './types';

const Stack = createStackNavigator<PrescriptionsStackParamList>();

export default function PrescriptionsNavigator() {
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
        name="PrescriptionsHome"
        component={PrescriptionsScreen}
        options={{ title: 'Prescriptions' }}
      />
      <Stack.Screen
        name="PrescriptionDetail"
        component={PrescriptionDetailScreen}
        options={{ title: 'Prescription' }}
      />
      <Stack.Screen
        name="NewPrescription"
        component={NewPrescriptionScreen}
        options={{ title: 'New Prescription' }}
      />
    </Stack.Navigator>
  );
}