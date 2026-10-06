import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { navigationRef } from '@/navigation/navigationRef';

export function useDeepLinks() {
  useEffect(() => {
    function handle(url: string | null) {
      if (!url || !navigationRef.isReady()) return;

      const parsed = Linking.parse(url);
      const path = parsed.path ?? '';
      const params = parsed.queryParams ?? {};

      if (path.startsWith('reset-password')) {
        const token = String(params.token ?? '');
        if (token) {
          navigationRef.navigate('ResetPassword' as never, { token } as never);
        }
        return;
      }

      if (path.startsWith('accept-invite')) {
        const token = String(params.token ?? '');
        if (token) {
          navigationRef.navigate('AcceptInvite' as never, { token } as never);
        }
        return;
      }

      if (path.startsWith('invoice/')) {
        const invoiceNumber = path.replace('invoice/', '');
        if (invoiceNumber) {
          navigationRef.navigate('Invoice' as never, { invoiceNumber } as never);
        }
        return;
      }
    }

    const sub = Linking.addEventListener('url', (e) => handle(e.url));
    Linking.getInitialURL().then(handle);

    return () => sub.remove();
  }, []);
}