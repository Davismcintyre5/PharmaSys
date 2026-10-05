import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '@/screens/auth/Login';
import RegisterScreen from '@/screens/auth/Register';
import ForgotPasswordScreen from '@/screens/auth/ForgotPassword';
import ResetPasswordScreen from '@/screens/auth/ResetPassword';
import AcceptInviteScreen from '@/screens/auth/AcceptInvite';

import type { AuthStackParamList } from './types';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="AcceptInvite" component={AcceptInviteScreen} />
    </Stack.Navigator>
  );
}