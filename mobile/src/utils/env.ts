import Constants from 'expo-constants';

type Extra = {
  apiUrl?: string;
  socketUrl?: string;
  appName?: string;
  appEnv?: 'development' | 'staging' | 'production';
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const FALLBACK_API_URL = 'https://pharmasysapi.hdm.co.ke/api';
const FALLBACK_SOCKET_URL = 'https://pharmasysapi.hdm.co.ke';
const FALLBACK_APP_NAME = 'PharmaSys';

export const ENV = {
  API_URL: extra.apiUrl?.trim() || FALLBACK_API_URL,
  SOCKET_URL: extra.socketUrl?.trim() || FALLBACK_SOCKET_URL,
  APP_NAME: extra.appName?.trim() || FALLBACK_APP_NAME,
  APP_ENV: extra.appEnv ?? (__DEV__ ? 'development' : 'production'),
  APP_VERSION: Constants.expoConfig?.version ?? '1.0.0',
  BUILD_NUMBER:
    Constants.expoConfig?.ios?.buildNumber ??
    String(Constants.expoConfig?.android?.versionCode ?? 1),
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
} as const;

export type Env = typeof ENV;