import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, ApiErrorShape } from '@/types';

/* ─────────── request config extensions ─────────── */

declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean;
    skipAuth?: boolean;
    skipRefresh?: boolean;
    skipRenewRedirect?: boolean;
  }
}

/**
 * Our response interceptor unwraps `response.data.data` before returning,
 * so the effective runtime return type of axios methods is `T`, not
 * `AxiosResponse<T>`. These overrides teach TypeScript that.
 */
declare module 'axios' {
  export interface AxiosInstance {
    request<T = any>(config: AxiosRequestConfig): Promise<T>;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    head<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    options<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  }
}

/* ─────────── instance ─────────── */

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

/* ─────────── wiring ─────────── */

let accessTokenGetter: () => string | null = () => null;
let branchIdGetter: () => string | null = () => null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let onAuthFail: (() => void) | null = null;

/**
 * Explicit branch override — set by BranchProvider.
 * Wins only when `branchIdGetter` returns null (i.e., AuthProvider didn't
 * provide one, which is the current setup).
 */
let branchIdOverride: string | null = null;

export function configureAxios(opts: {
  getAccessToken: () => string | null;
  getBranchId?: () => string | null;
  refresh: () => Promise<string | null>;
  onAuthFail: () => void;
}) {
  accessTokenGetter = opts.getAccessToken;
  branchIdGetter = opts.getBranchId ?? (() => null);
  refreshHandler = opts.refresh;
  onAuthFail = opts.onAuthFail;
}

/**
 * Set the branch that subsequent requests should be scoped to.
 * Pass `null` to clear (requests will then send no X-Branch-Id header,
 * meaning "all branches" on the server for owners).
 */
export function setBranchId(id: string | null) {
  branchIdOverride = id;
}

/* ─────────── helpers ─────────── */

function setHeader(
  config: InternalAxiosRequestConfig | AxiosRequestConfig,
  key: string,
  value: string
) {
  const headers: any = config.headers || {};
  if (typeof headers.set === 'function') headers.set(key, value);
  else headers[key] = value;
  config.headers = headers;
}

function normalizeError(error: AxiosError<ApiErrorShape>): ApiError {
  if (error.response?.data?.error) {
    const e = error.response.data.error;
    return new ApiError(error.response.status, e.code, e.message, e.details, e.requestId);
  }
  if (error.response) {
    return new ApiError(
      error.response.status,
      'HTTP_ERROR',
      `Request failed (${error.response.status})`
    );
  }
  if (error.request) {
    return new ApiError(0, 'NETWORK_ERROR', 'Network error — check your connection');
  }
  return new ApiError(0, 'UNKNOWN_ERROR', error.message || 'Unknown error');
}

/* ─────────── request interceptor ─────────── */

axiosInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!config.skipAuth) {
    let token = accessTokenGetter();
    if (!token && refreshHandler) {
      const fresh = await refreshHandler().catch(() => null);
      if (fresh) token = fresh;
    }
    if (token) setHeader(config, 'Authorization', `Bearer ${token}`);
  }

  // Branch: prefer the getter (AuthProvider may set one in the future),
  // fall back to the explicit override from BranchProvider.
  const branchId = branchIdGetter() ?? branchIdOverride;
  if (branchId) setHeader(config, 'X-Branch-Id', branchId);

  return config;
});

/* ─────────── refresh queue ─────────── */

let refreshing = false;
let queue: Array<(token: string | null) => void> = [];

function enqueue(cb: (token: string | null) => void) {
  queue.push(cb);
}

function flush(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

/* ─────────── 402 → /renew ─────────── */

function redirectToRenew() {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path.startsWith('/renew') || path.startsWith('/login')) return;
  window.location.href = '/renew';
}

/* ─────────── response interceptor ─────────── */

axiosInstance.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (
      payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      'data' in payload
    ) {
      return payload.data;
    }
    return payload;
  },
  async (error: AxiosError<ApiErrorShape>) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!original) return Promise.reject(normalizeError(error));

    const status = error.response?.status;
    const code = error.response?.data?.error?.code;

    /* ── 402: subscription expired — redirect to renew ── */
    if (
      status === 402 &&
      !original.skipRenewRedirect &&
      ['SUBSCRIPTION_EXPIRED', 'PAYMENT_REQUIRED'].includes(code || '')
    ) {
      redirectToRenew();
      return Promise.reject(normalizeError(error));
    }

    /* ── 401: refresh once, retry ── */
    if (
      status === 401 &&
      !original.skipRefresh &&
      !original._retry &&
      refreshHandler
    ) {
      original._retry = true;

      if (refreshing) {
        return new Promise((resolve, reject) => {
          enqueue((token) => {
            if (!token) return reject(normalizeError(error));
            setHeader(original, 'Authorization', `Bearer ${token}`);
            resolve(axiosInstance.request(original));
          });
        });
      }

      refreshing = true;
      try {
        const token = await refreshHandler();
        flush(token);

        if (!token) {
          onAuthFail?.();
          throw normalizeError(error);
        }

        setHeader(original, 'Authorization', `Bearer ${token}`);
        return axiosInstance.request(original);
      } catch {
        flush(null);
        onAuthFail?.();
        throw normalizeError(error);
      } finally {
        refreshing = false;
      }
    }

    /* ── hard auth failures ── */
    if (
      status === 401 &&
      ['NO_TOKEN', 'INVALID_TOKEN', 'ADMIN_NOT_FOUND', 'USER_NOT_FOUND'].includes(
        code || ''
      )
    ) {
      onAuthFail?.();
    }

    const normalized = normalizeError(error);

    if (!original.silent && typeof window !== 'undefined') {
      import('react-hot-toast')
        .then(({ default: toast }) => toast.error(normalized.message))
        .catch(() => {});
    }

    return Promise.reject(normalized);
  }
);

export default axiosInstance;