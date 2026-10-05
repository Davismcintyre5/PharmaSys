import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { STORAGE_KEYS } from '@/utils/constants';
import { storage } from '@/utils/storage';

interface Consent {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  version: number;
  acceptedAt: string;
}

const CURRENT_VERSION = 1;

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const saved = storage.get<Consent>(STORAGE_KEYS.cookieConsent);
    if (!saved || saved.version !== CURRENT_VERSION) {
      const t = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  function persist(partial: Partial<Consent>) {
    const value: Consent = {
      essential: true,
      analytics,
      marketing,
      version: CURRENT_VERSION,
      acceptedAt: new Date().toISOString(),
      ...partial,
    };
    storage.set(STORAGE_KEYS.cookieConsent, value);
    setVisible(false);
    setCustomizing(false);
  }

  if (!visible) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface px-4 py-4 shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-muted">
            We use cookies to keep you signed in and to improve the product.
            Essential cookies are always on. See our{' '}
            <span className="text-primary">Privacy Policy</span> for details.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCustomizing(true)}>
              Customize
            </Button>
            <Button variant="outline" size="sm" onClick={() => persist({ analytics: false, marketing: false })}>
              Essential only
            </Button>
            <Button size="sm" onClick={() => persist({ analytics: true, marketing: true })}>
              Accept all
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={customizing}
        onClose={() => setCustomizing(false)}
        title="Cookie preferences"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCustomizing(false)}>Cancel</Button>
            <Button onClick={() => persist({ analytics, marketing })}>Save preferences</Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-text">Essential</p>
              <p className="text-xs text-text-muted">Required for login, security, and core features.</p>
            </div>
            <span className="text-xs text-text-muted">Always on</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-text">Analytics</p>
              <p className="text-xs text-text-muted">Helps us understand how the app is used.</p>
            </div>
            <Switch checked={analytics} onChange={setAnalytics} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-text">Marketing</p>
              <p className="text-xs text-text-muted">Used to show relevant product updates.</p>
            </div>
            <Switch checked={marketing} onChange={setMarketing} />
          </div>
        </div>
      </Modal>
    </>
  );
}