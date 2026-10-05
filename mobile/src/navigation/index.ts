export { default as RootNavigator } from './RootNavigator';
export { default as AuthNavigator } from './AuthNavigator';
export { default as MainTabNavigator } from './MainTabNavigator';
export { default as DashboardNavigator } from './DashboardNavigator';
export { default as InventoryNavigator } from './InventoryNavigator';
export { default as PosNavigator } from './PosNavigator';
export { default as PrescriptionsNavigator } from './PrescriptionsNavigator';
export { default as MoreNavigator } from './MoreNavigator';
export { navigationRef, navigate, resetRoot } from './navigationRef';
export type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  DashboardStackParamList,
  InventoryStackParamList,
  PosStackParamList,
  PrescriptionsStackParamList,
  MoreStackParamList,
} from './types';