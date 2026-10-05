import { useCallback, useState } from 'react';

export function useRefreshControl(onRefresh: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return { refreshing, onRefresh: refresh };
}