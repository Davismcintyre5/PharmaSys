import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi, configureAxios } from '@/api/axios';
import { storage } from '@/utils/storage';
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  PublicInvoice,
} from '@/types';

interface AuthContextValue {
  user: AuthSession['user'] | null;
  tenant: AuthSession['tenant'] | null;
  plan: AuthSession['plan'] | null;
  scope: AuthSession['scope'] | null;
  accessToken: string | null;
  refreshToken: string | null;
  invoice: PublicInvoice | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  register: (payload: RegisterPayload) => Promise<AuthSession>;
  logout: () => void;
  refresh: () => Promise<void>;
  setSession: (s: AuthSession) => void;
  reload: () => Promise<void>;
  setInvoice: (inv: PublicInvoice | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_KEY = 'pharmasys_refresh';
const INVOICE_KEY = 'invoice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [invoice, setInvoiceState] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  async function persist(next: AuthSession | null) {
    setSessionState(next);
    if (next?.refreshToken) {
      await storage.setItem(REFRESH_KEY, next.refreshToken);
    } else {
      await storage.removeItem(REFRESH_KEY);
    }
  }

  async function persistInvoice(inv: PublicInvoice | null) {
    setInvoiceState(inv);
    if (inv) await storage.setJSON(INVOICE_KEY, inv);
    else await storage.removeItem(INVOICE_KEY);
  }

  async function hydrate() {
    try {
      const rt = await storage.getItem(REFRESH_KEY);
      if (!rt) {
        setLoading(false);
        return;
      }

      const res = await authApi.refresh(rt);
      const me = await authApi.me();

      await persist({
        user: me.user,
        tenant: me.tenant,
        plan: me.plan,
        scope: me.scope,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });

      if (me.scope === 'active') await persistInvoice(null);
    } catch {
      await persist(null);
    } finally {
      setLoading(false);
    }
  }

  async function reload() {
    if (!session?.accessToken) return;
    try {
      const me = await authApi.me();
      await persist({
        ...session,
        user: me.user,
        tenant: me.tenant,
        plan: me.plan,
        scope: me.scope,
      });
      if (me.scope === 'active') await persistInvoice(null);
    } catch {}
  }

  useEffect(() => {
    (async () => {
      const cached = await storage.getJSON<PublicInvoice>(INVOICE_KEY);
      if (cached) setInvoiceState(cached);
      await hydrate();
    })();
  }, []);

  useEffect(() => {
    configureAxios({
      getAccessToken: () => session?.accessToken ?? null,
      refresh: async () => {
        const rt = await storage.getItem(REFRESH_KEY);
        if (!rt) return null;
        try {
          const res = await authApi.refresh(rt);
          setSessionState((prev) => (prev ? { ...prev, ...res } : null));
          return res.accessToken;
        } catch {
          await persist(null);
          return null;
        }
      },
      onAuthFail: () => {
        persist(null);
      },
    });
  }, [session]);

  const login = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    await persist(res);
    if (res.scope !== 'pending') await persistInvoice(null);
    return res;
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    await persist(res);

    const maybeInvoice = (res as unknown as { invoice?: PublicInvoice }).invoice;
    if (maybeInvoice) await persistInvoice(maybeInvoice);

    return res;
  };

  const logout = async () => {
    await persist(null);
    await persistInvoice(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      tenant: session?.tenant ?? null,
      plan: session?.plan ?? null,
      scope: session?.scope ?? null,
      accessToken: session?.accessToken ?? null,
      refreshToken: session?.refreshToken ?? null,
      invoice,
      loading,
      isAuthenticated: Boolean(session?.accessToken && session?.user),
      login,
      register,
      logout,
      refresh: hydrate,
      setSession: persist,
      reload,
      setInvoice: persistInvoice,
    }),
    [session, invoice, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}