export const colors = {
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  orange: {
    100: '#ffedd5',
    500: '#f97316',
    700: '#c2410c',
  },
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const },
  h2: { fontSize: 24, fontWeight: '700' as const },
  h3: { fontSize: 20, fontWeight: '700' as const },
  h4: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  tiny: { fontSize: 10, fontWeight: '400' as const },
};

export const lightTheme = {
  dark: false,
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    surface2: '#f1f5f9',
    border: '#e2e8f0',

    text: '#0f172a',
    textMuted: '#475569',
    textSubtle: '#94a3b8',

    primary: '#0ea5a4',
    primaryFg: '#ffffff',

    accent: '#22d3ee',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    info: '#3b82f6',

    tabBar: '#ffffff',
    tabBarBorder: '#e2e8f0',
    tabBarActive: '#0ea5a4',
    tabBarInactive: '#94a3b8',
  },
};

export const darkTheme = {
  dark: true,
  colors: {
    background: '#020617',
    surface: '#0f172a',
    surface2: '#1e293b',
    border: '#334155',

    text: '#f1f5f9',
    textMuted: '#94a3b8',
    textSubtle: '#64748b',

    primary: '#14b8a6',
    primaryFg: '#ffffff',

    accent: '#22d3ee',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#f87171',
    info: '#60a5fa',

    tabBar: '#0f172a',
    tabBarBorder: '#1e293b',
    tabBarActive: '#14b8a6',
    tabBarInactive: '#64748b',
  },
};

export type AppTheme = typeof lightTheme;

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  lightTheme,
  darkTheme,
};