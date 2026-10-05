import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import DashboardScreen from '@/screens/dashboard/Dashboard';
import NotificationsScreen from '@/screens/notifications/Notifications';
import AiChatScreen from '@/screens/ai/AiChat';

import { useTheme } from '@/context/ThemeProvider';
import type { DashboardStackParamList } from './types';

const Stack = createStackNavigator<DashboardStackParamList>();

export default function DashboardNavigator() {
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
        name="DashboardHome"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="AiChat"
        component={AiChatScreen}
        options={{ title: 'AI Assistant' }}
      />
    </Stack.Navigator>
  );
}