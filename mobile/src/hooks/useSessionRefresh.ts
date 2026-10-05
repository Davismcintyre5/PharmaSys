import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/context/AuthProvider';

const INTERVAL_MS = 60_000;

export function useSessionRefresh() {
  const { isAuthenticated, reload } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      reload().catch(() => null);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isAuthenticated, reload]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const cameToForeground =
        appState.current.match(/inactive|background/) && next === 'active';

      appState.current = next;

      if (cameToForeground && isAuthenticated) {
        reload().catch(() => null);
      }
    });

    return () => sub.remove();
  }, [isAuthenticated, reload]);
}