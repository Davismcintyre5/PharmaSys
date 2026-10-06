import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import MoreScreen from '@/screens/more/More';

import SalesScreen from '@/screens/sales/Sales';
import SaleDetailScreen from '@/screens/sales/SaleDetail';

import PatientsScreen from '@/screens/patients/Patients';
import PatientDetailScreen from '@/screens/patients/PatientDetail';

import CustomersScreen from '@/screens/customers/Customers';
import SuppliersScreen from '@/screens/suppliers/Suppliers';

import PurchaseOrdersScreen from '@/screens/purchaseOrders/PurchaseOrders';
import PurchaseOrderDetailScreen from '@/screens/purchaseOrders/PurchaseOrderDetail';
import NewPurchaseOrderScreen from '@/screens/purchaseOrders/NewPurchaseOrder';

import ReportsScreen from '@/screens/reports/Reports';
import ReportViewScreen from '@/screens/reports/ReportView';

import AiInsightsScreen from '@/screens/ai/AiInsights';
import AiForecastScreen from '@/screens/ai/AiForecast';

import BranchesScreen from '@/screens/branches/Branches';
import UsersScreen from '@/screens/users/Users';
import BillingScreen from '@/screens/billing/Billing';
import BillingPendingScreen from '@/screens/billing/BillingPending';
import SettingsScreen from '@/screens/settings/Settings';

import { useTheme } from '@/context/ThemeProvider';
import type { MoreStackParamList } from './types';

const Stack = createStackNavigator<MoreStackParamList>();

export default function MoreNavigator() {
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
        name="MoreHome"
        component={MoreScreen}
        options={{ title: 'More' }}
      />

      <Stack.Screen name="Sales" component={SalesScreen} />
      <Stack.Screen
        name="SaleDetail"
        component={SaleDetailScreen}
        options={{ title: 'Sale' }}
      />

      <Stack.Screen name="Patients" component={PatientsScreen} />
      <Stack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ title: 'Patient' }}
      />

      <Stack.Screen name="Customers" component={CustomersScreen} />
      <Stack.Screen name="Suppliers" component={SuppliersScreen} />

      <Stack.Screen
        name="PurchaseOrders"
        component={PurchaseOrdersScreen}
        options={{ title: 'Purchase Orders' }}
      />
      <Stack.Screen
        name="PurchaseOrderDetail"
        component={PurchaseOrderDetailScreen}
        options={{ title: 'Purchase Order' }}
      />
      <Stack.Screen
        name="NewPurchaseOrder"
        component={NewPurchaseOrderScreen}
        options={{ title: 'New Purchase Order' }}
      />

      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen
        name="ReportView"
        component={ReportViewScreen}
        options={{ title: 'Report' }}
      />

      <Stack.Screen
        name="AiInsights"
        component={AiInsightsScreen}
        options={{ title: 'AI Insights' }}
      />
      <Stack.Screen
        name="AiForecast"
        component={AiForecastScreen}
        options={{ title: 'Stock Forecast' }}
      />

      <Stack.Screen name="Branches" component={BranchesScreen} />
      <Stack.Screen
        name="Users"
        component={UsersScreen}
        options={{ title: 'Staff' }}
      />
      <Stack.Screen name="Billing" component={BillingScreen} />
      <Stack.Screen
        name="BillingPending"
        component={BillingPendingScreen}
        options={{ title: 'Pending Change' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}