import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { navigationRef } from '@/navigation/navigationRef';

export function useDeepLinks() {
  useEffect(() => {
    function handle(url: string | null) {
      if (!url) return;
      if (!navigationRef.isReady()) return;

      const parsed = Linking.parse(url);
      const path = parsed.path ?? '';

      if (path.startsWith('invoice/')) {
        const invoiceNumber = path.replace('invoice/', '');
        navigationRef.navigate('Invoice' as never, { invoiceNumber } as never);
      }
    }

    const sub = Linking.addEventListener('url', (event) => {
      handle(event.url);
    });

    Linking.getInitialURL().then(handle);

    return () => sub.remove();
  }, []);
}