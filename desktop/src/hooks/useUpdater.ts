import { useEffect, useState } from 'react';
import {
  getAppVersion,
  getUpdateState,
  subscribeToUpdates,
  isElectron,
  type UpdateState,
} from '@/utils/updater';

export function useUpdater() {
  const [version, setVersion] = useState<string | null>(null);
  const [state, setState] = useState<UpdateState>(getUpdateState);
  const [inElectron, setInElectron] = useState(false);

  useEffect(() => {
    const electron = isElectron();
    setInElectron(electron);
    if (!electron) return;

    let alive = true;
    getAppVersion().then((v) => {
      if (alive) setVersion(v);
    });

    const unsubscribe = subscribeToUpdates(setState);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return { version, state, isElectron: inElectron };
}