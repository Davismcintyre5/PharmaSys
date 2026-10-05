import { useTheme } from '@/context/ThemeProvider';

export function useUi() {
  return useTheme();
}