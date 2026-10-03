import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { ApiError, ApiErrorShape } from '@/types';

declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean;
    skipAuth?: boolean;
    skipRefresh?: boolean;
  }
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

let accessTokenGetter: () => string | null = () => null;
let branchIdGetter: () => string | null = () => null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let onAuthFail: (() => void) | null = null;

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

/* ─── request interceptor ─── */
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.skipAuth) {
    const token = accessTokenGetter();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  const branchId = branchIdGetter();
  if (branchId) config.headers['X-Branch-Id'] = branchId;

  return config;
});

/* ─── refresh queue ─── */
let refreshing = false;
let queue: Array<(token: string | null) => void> = [];

function enqueue(cb: (token: string | null) => void) {
  queue.push(cb);
}

function flush(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

/* ─── response interceptor ─── */
axiosInstance.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
      return payload.data;
    }
    return payload;
  },
  async (error: AxiosError<ApiErrorShape>) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;

    // Attempt token refresh once on TOKEN_EXPIRED
    if (
      status === 401 &&
      code === 'TOKEN_EXPIRED' &&
      !original?.skipRefresh &&
      !original?._retry &&
      refreshHandler
    ) {
      original._retry = true;

      if (refreshing) {
        return new Promise((resolve, reject) => {
          enqueue((token) => {
            if (!token) return reject(normalizeError(error));
            original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
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
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
        return axiosInstance.request(original);
      } catch (e) {
        flush(null);
        onAuthFail?.();
        throw normalizeError(error);
      } finally {
        refreshing = false;
      }
    }

    // Hard auth failures — force logout
    if (
      status === 401 &&
      ['NO_TOKEN', 'INVALID_TOKEN', 'ADMIN_NOT_FOUND', 'USER_NOT_FOUND'].includes(code || '')
    ) {
      onAuthFail?.();
    }

    const normalized = normalizeError(error);

    if (!original?.silent && typeof window !== 'undefined') {
      // Lazy import to avoid cyclic dependency with toasts
      import('react-hot-toast')
        .then(({ default: toast }) => toast.error(normalized.message))
        .catch(() => {});
    }

    return Promise.reject(normalized);
  }
);

function normalizeError(error: AxiosError<ApiErrorShape>): ApiError {
  if (error.response?.data?.error) {
    const e = error.response.data.error;
    return new ApiError(
      error.response.status,
      e.code,
      e.message,
      e.details,
      e.requestId
    );
  }
  if (error.request) {
    return new ApiError(0, 'NETWORK_ERROR', 'Network error — check your connection');
  }
  return new ApiError(0, 'UNKNOWN_ERROR', error.message || 'Unknown error');
}

export default axiosInstance;