import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { publicApi } from '@/api/axios';
import { ENV } from '@/utils/env';
import type { Brand, PublicSettings } from '@/types';

interface SiteContextValue {
  brand: Brand | null;
  settings: PublicSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue | null>(null);

const FALLBACK_BRAND: Brand = {
  name: ENV.APP_NAME,
  logoUrl: null,
  website: null,
  supportEmail: null,
  supportPhone: null,
  supportWhatsapp: null,
};

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [b, s] = await Promise.all([
        publicApi.site.getBrand().catch(() => FALLBACK_BRAND),
        publicApi.site.getSettings().catch(() => null),
      ]);
      setBrand(b);
      setSettings(s);
      setError(null);
    } catch (e) {
      setBrand(FALLBACK_BRAND);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const value = useMemo(
    () => ({ brand, settings, loading, error, refresh: load }),
    [brand, settings, loading, error]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}