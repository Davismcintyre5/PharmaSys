import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/api/auth';
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/public';

interface AuthContextValue {
  user: AuthSession['user'] | null;
  tenant: AuthSession['tenant'] | null;
  plan: AuthSession['plan'] | null;
  scope: AuthSession['scope'] | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  register: (payload: RegisterPayload) => Promise<AuthSession>;
  logout: () => void;
  refresh: () => Promise<void>;
  setSession: (s: AuthSession) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_KEY = 'pharmasys_refresh';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  function persist(s: AuthSession | null) {
    setSessionState(s);
    try {
      if (s?.refreshToken) localStorage.setItem(REFRESH_KEY, s.refreshToken);
      else localStorage.removeItem(REFRESH_KEY);
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
      const me = await authApi.me(res.accessToken);
      persist({
        ...res,
        user: me.user,
        tenant: me.tenant,
        plan: me.plan,
        scope: me.scope,
      });
    } catch {
      persist(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    hydrate();
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    persist(res);
    return res;
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    persist(res);
    return res;
  };

  const logout = () => {
    persist(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      tenant: session?.tenant ?? null,
      plan: session?.plan ?? null,
      scope: session?.scope ?? null,
      accessToken: session?.accessToken ?? null,
      loading,
      isAuthenticated: Boolean(session?.accessToken && session?.user),
      login,
      register,
      logout,
      refresh: hydrate,
      setSession: persist,
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}