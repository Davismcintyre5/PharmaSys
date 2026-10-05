import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardNavigator from './DashboardNavigator';
import InventoryNavigator from './InventoryNavigator';
import PosNavigator from './PosNavigator';
import PrescriptionsNavigator from './PrescriptionsNavigator';
import MoreNavigator from './MoreNavigator';

import { useTheme } from '@/context/ThemeProvider';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';

          switch (route.name) {
            case 'DashboardTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'InventoryTab':
              iconName = focused ? 'cube' : 'cube-outline';
              break;
            case 'PosTab':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'PrescriptionsTab':
              iconName = focused ? 'medkit' : 'medkit-outline';
              break;
            case 'MoreTab':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryNavigator}
        options={{ title: 'Inventory' }}
      />
      <Tab.Screen
        name="PosTab"
        component={PosNavigator}
        options={{ title: 'POS' }}
      />
      <Tab.Screen
        name="PrescriptionsTab"
        component={PrescriptionsNavigator}
        options={{ title: 'Rx' }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreNavigator}
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
  );
}