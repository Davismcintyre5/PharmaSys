import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const state = await Network.getNetworkStateAsync();
        if (active) setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
      } catch {
        if (active) setIsOnline(true);
      }
    }

    check();
    const timer = setInterval(check, 15_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return { isOnline };
}