import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/api/auth';
import { configureAxios } from '@/api/axios';
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
const INVOICE_KEY = 'pharmasys_pending_invoice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [invoice, setInvoiceState] = useState<PublicInvoice | null>(() => {
    try {
      const raw = localStorage.getItem(INVOICE_KEY);
      return raw ? (JSON.parse(raw) as PublicInvoice) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  function persist(s: AuthSession | null) {
    setSessionState(s);
    try {
      if (s?.refreshToken) localStorage.setItem(REFRESH_KEY, s.refreshToken);
      else localStorage.removeItem(REFRESH_KEY);
    } catch {}
  }

  function persistInvoice(inv: PublicInvoice | null) {
    setInvoiceState(inv);
    try {
      if (inv) localStorage.setItem(INVOICE_KEY, JSON.stringify(inv));
      else localStorage.removeItem(INVOICE_KEY);
    } catch {}
  }

  async function hydrate() {
    try {
      const rt = localStorage.getItem(REFRESH_KEY);
      if (!rt) {
        setLoading(false);
        return;
      }

      const res = await authApi.refresh(rt);
      const me = await authApi.me();

      persist({
        user: me.user,
        tenant: me.tenant,
        plan: me.plan,
        scope: me.scope,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });

      if (me.scope === 'active') persistInvoice(null);
    } catch {
      persist(null);
    } finally {
      setLoading(false);
    }
  }

  async function reload() {
    if (!session?.accessToken) return;
    try {
      const me = await authApi.me();
      persist({
        ...session,
        user: me.user,
        tenant: me.tenant,
        plan: me.plan,
        scope: me.scope,
      });
      if (me.scope === 'active') persistInvoice(null);
    } catch {
      // caller decides
    }
  }

  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    configureAxios({
      getAccessToken: () => session?.accessToken ?? null,
      refresh: async () => {
        const rt = localStorage.getItem(REFRESH_KEY);
        if (!rt) return null;
        try {
          const res = await authApi.refresh(rt);
          setSessionState((prev) => (prev ? { ...prev, ...res } : null));
          return res.accessToken;
        } catch {
          persist(null);
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
    persist(res);
    if (res.scope !== 'pending') persistInvoice(null);
    return res;
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    persist(res);

    const maybeInvoice = (res as unknown as { invoice?: PublicInvoice }).invoice;
    if (maybeInvoice) persistInvoice(maybeInvoice);

    return res;
  };

  const logout = () => {
    persist(null);
    persistInvoice(null);
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