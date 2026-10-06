import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import Toast from 'react-native-toast-message';

import { ENV } from '@/utils/env';
import { navigationRef } from '@/navigation/navigationRef';
import {
  ApiError,
  ApiErrorShape,
  AuthSession,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AcceptInvitePayload,
  MeResponse,
  PublicInvoice,
  StkPushResponse,
  BillingStatus,
  Branch,
  BranchPayload,
  Customer,
  CustomerPayload,
  Drug,
  DrugPayload,
  Batch,
  BatchPayload,
  StockMovement,
  StockAdjustPayload,
  Sale,
  SalePayload,
  RefundPayload,
  Patient,
  PatientPayload,
  Prescription,
  PrescriptionPayload,
  Supplier,
  SupplierPayload,
  PurchaseOrder,
  PurchaseOrderPayload,
  ReceivePayload,
  User,
  InviteUserPayload,
  TenantSettings,
  UpdateSettingsPayload,
  UploadSignature,
  AppNotification,
  UnreadCountResponse,
  DashboardSummary,
  AiInsight,
  AiChatResponse,
  AiQuota,
  SalesSummary,
  SalesRangePoint,
  TopDrug,
  ExpiryLoss,
  TaxReport,
  Brand,
  PublicSettings,
  PublicPlan,
  AiInfo,
  LegalDoc,
  LegalSummary,
  PublicDownload,
  ChatInfo,
  ChatReply,
} from '@/types';

declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean;
    skipAuth?: boolean;
    skipRefresh?: boolean;
    skipRenewRedirect?: boolean;
  }
}

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

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENV.API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let accessTokenGetter: () => string | null = () => null;
let branchIdGetter: () => string | null = () => null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let onAuthFail: (() => void) | null = null;
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

export function setBranchId(id: string | null) {
  branchIdOverride = id;
}

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
    return new ApiError(
      error.response.status,
      e.code,
      e.message,
      e.details,
      e.requestId
    );
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

axiosInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!config.skipAuth) {
    let token = accessTokenGetter();
    if (!token && refreshHandler) {
      const fresh = await refreshHandler().catch(() => null);
      if (fresh) token = fresh;
    }
    if (token) setHeader(config, 'Authorization', `Bearer ${token}`);
  }

  const branchId = branchIdGetter() ?? branchIdOverride;
  if (branchId) setHeader(config, 'X-Branch-Id', branchId);

  return config;
});

let refreshing = false;
let queue: Array<(token: string | null) => void> = [];

function enqueue(cb: (token: string | null) => void) {
  queue.push(cb);
}

function flush(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

function redirectToRenew() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Renewal' as never);
  }
}

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

    if (
      status === 402 &&
      !original.skipRenewRedirect &&
      ['SUBSCRIPTION_EXPIRED', 'PAYMENT_REQUIRED'].includes(code || '')
    ) {
      redirectToRenew();
      return Promise.reject(normalizeError(error));
    }

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

    if (
      status === 401 &&
      ['NO_TOKEN', 'INVALID_TOKEN', 'ADMIN_NOT_FOUND', 'USER_NOT_FOUND'].includes(
        code || ''
      )
    ) {
      onAuthFail?.();
    }

    const normalized = normalizeError(error);

    if (!original.silent) {
      Toast.show({
        type: 'error',
        text1: normalized.message,
        position: 'top',
        visibilityTime: 4000,
      });
    }

    return Promise.reject(normalized);
  }
);

export default axiosInstance;

/* ══════════════════════════════════════════════════════════════
   ENDPOINTS
   ══════════════════════════════════════════════════════════════ */

export const authApi = {
  register: (payload: RegisterPayload) =>
    axiosInstance.post<AuthSession>('/auth/register', payload, { skipAuth: true }),

  login: (payload: LoginPayload) =>
    axiosInstance.post<AuthSession>('/auth/login', payload, { skipAuth: true }),

  refresh: (refreshToken: string) =>
    axiosInstance.post<AuthSession>(
      '/auth/refresh',
      { refreshToken },
      { skipAuth: true, skipRefresh: true }
    ),

  logout: () => axiosInstance.post<{ loggedOut: boolean }>('/auth/logout'),

  me: () => axiosInstance.get<MeResponse>('/auth/me'),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    axiosInstance.post<{ sent: boolean }>('/auth/forgot-password', payload, {
      skipAuth: true,
    }),

  resetPassword: (payload: ResetPasswordPayload) =>
    axiosInstance.post<{ reset: boolean }>('/auth/reset-password', payload, {
      skipAuth: true,
    }),

  acceptInvite: (payload: AcceptInvitePayload) =>
    axiosInstance.post<AuthSession>('/auth/accept-invite', payload, { skipAuth: true }),

  impersonateExchange: (impToken: string) =>
    axiosInstance.post<AuthSession>(
      '/auth/impersonate-exchange',
      { impToken },
      { skipAuth: true }
    ),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    axiosInstance.post<{ changed: boolean }>('/auth/change-password', payload),
};

export const billingApi = {
  status: () => axiosInstance.get<BillingStatus>('/app/billing/status'),

  renew: (planCode: string) =>
    axiosInstance.post<{ invoiceNumber: string }>('/app/billing/renew', { planCode }),

  invoice: () => axiosInstance.get<PublicInvoice | null>('/app/billing/invoice'),

  stkPush: (phone: string, invoiceNumber?: string) =>
    axiosInstance.post<StkPushResponse>('/app/billing/mpesa/stk', {
      phone,
      ...(invoiceNumber ? { invoiceNumber } : {}),
    }),
};

export const branchApi = {
  list: () => axiosInstance.get<Branch[]>('/app/branches'),
  create: (payload: BranchPayload) => axiosInstance.post<Branch>('/app/branches', payload),
  get: (id: string) => axiosInstance.get<Branch>(`/app/branches/${id}`),
  update: (id: string, payload: Partial<BranchPayload>) =>
    axiosInstance.patch<Branch>(`/app/branches/${id}`, payload),
  deactivate: (id: string) =>
    axiosInstance.post<{ deactivated: boolean }>(`/app/branches/${id}/deactivate`),
};

export const customerApi = {
  list: (params?: Record<string, unknown>) =>
    axiosInstance.get<Customer[]>('/app/customers', { params }),
  create: (payload: CustomerPayload) =>
    axiosInstance.post<Customer>('/app/customers', payload),
  get: (id: string) => axiosInstance.get<Customer>(`/app/customers/${id}`),
  update: (id: string, payload: Partial<CustomerPayload>) =>
    axiosInstance.patch<Customer>(`/app/customers/${id}`, payload),
  remove: (id: string) => axiosInstance.delete<void>(`/app/customers/${id}`),
  hardRemove: (id: string) =>
    axiosInstance.delete<void>(`/app/customers/${id}`, { params: { hard: 'true' } }),
  purchases: (id: string) => axiosInstance.get<Sale[]>(`/app/customers/${id}/purchases`),
};

export const dashboardApi = {
  getSummary: () => axiosInstance.get<DashboardSummary>('/app/dashboard/summary'),
  getInsights: () => axiosInstance.get<AiInsight>('/app/dashboard/insights'),
};

export const inventoryApi = {
  drugs: {
    list: (params?: Record<string, unknown>) =>
      axiosInstance.get<Drug[]>('/app/inventory/drugs', { params }),
    create: (payload: DrugPayload) =>
      axiosInstance.post<Drug>('/app/inventory/drugs', payload),
    get: (id: string) => axiosInstance.get<Drug>(`/app/inventory/drugs/${id}`),
    update: (id: string, payload: Partial<DrugPayload>) =>
      axiosInstance.patch<Drug>(`/app/inventory/drugs/${id}`, payload),
    remove: (id: string) => axiosInstance.delete<void>(`/app/inventory/drugs/${id}`),
    hardRemove: (id: string) =>
      axiosInstance.delete<void>(`/app/inventory/drugs/${id}`, {
        params: { hard: 'true' },
      }),
    addBatch: (id: string, payload: BatchPayload) =>
      axiosInstance.post<Batch>(`/app/inventory/drugs/${id}/batches`, payload),
    lowStock: () => axiosInstance.get<Drug[]>('/app/inventory/low-stock'),
    expiring: (params?: { days?: number }) =>
      axiosInstance.get<Batch[]>('/app/inventory/expiring', { params }),
  },

  batches: {
    list: (drugId: string) =>
      axiosInstance.get<Batch[]>('/app/inventory/batches', { params: { drugId } }),
    update: (id: string, payload: Partial<BatchPayload>) =>
      axiosInstance.patch<Batch>(`/app/inventory/batches/${id}`, payload),
    remove: (id: string) => axiosInstance.delete<void>(`/app/inventory/batches/${id}`),
    hardRemove: (id: string) =>
      axiosInstance.delete<void>(`/app/inventory/batches/${id}`, {
        params: { hard: 'true' },
      }),
  },

  movements: {
    list: (params?: { drugId?: string; page?: number; limit?: number }) =>
      axiosInstance.get<StockMovement[]>('/app/inventory/movements', { params }),
  },

  adjust: (payload: StockAdjustPayload) =>
    axiosInstance.post<StockMovement>('/app/inventory/adjust', payload),
};

export const notificationApi = {
  list: (params?: { page?: number; limit?: number; unread?: boolean }) =>
    axiosInstance.get<AppNotification[]>('/app/notifications', { params }),
  unread: () => axiosInstance.get<UnreadCountResponse>('/app/notifications/unread'),
  markRead: (id: string) =>
    axiosInstance.post<{ read: boolean }>(`/app/notifications/${id}/read`),
  markAllRead: () =>
    axiosInstance.post<{ modified: number }>('/app/notifications/read-all'),
  remove: (id: string) => axiosInstance.delete<void>(`/app/notifications/${id}`),
  clear: () =>
    axiosInstance.delete<{ deleted: number }>('/app/notifications/clear'),
};

export const patientApi = {
  list: (params?: Record<string, unknown>) =>
    axiosInstance.get<Patient[]>('/app/patients', { params }),
  create: (payload: PatientPayload) =>
    axiosInstance.post<Patient>('/app/patients', payload),
  get: (id: string) => axiosInstance.get<Patient>(`/app/patients/${id}`),
  update: (id: string, payload: Partial<PatientPayload>) =>
    axiosInstance.patch<Patient>(`/app/patients/${id}`, payload),
  remove: (id: string) => axiosInstance.delete<void>(`/app/patients/${id}`),
  hardRemove: (id: string) =>
    axiosInstance.delete<void>(`/app/patients/${id}`, { params: { hard: 'true' } }),
  sales: (id: string) => axiosInstance.get<Sale[]>(`/app/patients/${id}/sales`),
  prescriptions: (id: string) =>
    axiosInstance.get<Prescription[]>(`/app/patients/${id}/prescriptions`),
};

export const prescriptionApi = {
  list: (params?: Record<string, unknown>) =>
    axiosInstance.get<Prescription[]>('/app/prescriptions', { params }),
  create: (payload: PrescriptionPayload) =>
    axiosInstance.post<Prescription>('/app/prescriptions', payload),
  get: (id: string) => axiosInstance.get<Prescription>(`/app/prescriptions/${id}`),
  update: (id: string, payload: Partial<PrescriptionPayload>) =>
    axiosInstance.patch<Prescription>(`/app/prescriptions/${id}`, payload),
  dispense: (id: string) =>
    axiosInstance.post<Prescription>(`/app/prescriptions/${id}/dispense`),
  cancel: (id: string, reason?: string) =>
    axiosInstance.post<Prescription>(`/app/prescriptions/${id}/cancel`, { reason }),
  remove: (id: string) => axiosInstance.delete<void>(`/app/prescriptions/${id}`),
  hardRemove: (id: string) =>
    axiosInstance.delete<void>(`/app/prescriptions/${id}`, { params: { hard: 'true' } }),
};

export const publicApi = {
  site: {
    getBrand: () => axiosInstance.get<Brand>('/public/site/brand'),
    getSettings: () => axiosInstance.get<PublicSettings>('/public/site/settings'),
    getPlans: () => axiosInstance.get<PublicPlan[]>('/public/site/plans'),
    getAi: () => axiosInstance.get<AiInfo>('/public/site/ai'),
    getLegal: () => axiosInstance.get<LegalSummary[]>('/public/site/legal'),
    getLegalByType: (type: string) =>
      axiosInstance.get<LegalDoc>(`/public/site/legal/${type}`),
    getDownloads: () =>
      axiosInstance.get<PublicDownload[]>('/public/site/downloads'),
  },

  plans: {
    list: () => axiosInstance.get<PublicPlan[]>('/public/plans'),
  },

  invoices: {
    getByNumber: (number: string) =>
      axiosInstance.get<PublicInvoice>(`/public/invoices/${number}`),
  },

  chat: {
    getInfo: () => axiosInstance.get<ChatInfo>('/public/chat/info'),
    send: (message: string) =>
      axiosInstance.post<ChatReply>('/public/chat/chat', { message }),
  },
};

export const purchaseOrderApi = {
  list: (params?: Record<string, unknown>) =>
    axiosInstance.get<PurchaseOrder[]>('/app/purchase-orders', { params }),
  create: (payload: PurchaseOrderPayload) =>
    axiosInstance.post<PurchaseOrder>('/app/purchase-orders', payload),
  get: (id: string) =>
    axiosInstance.get<PurchaseOrder>(`/app/purchase-orders/${id}`),
  send: (id: string) =>
    axiosInstance.post<PurchaseOrder>(`/app/purchase-orders/${id}/send`),
  receive: (id: string, payload: ReceivePayload) =>
    axiosInstance.post<PurchaseOrder>(`/app/purchase-orders/${id}/receive`, payload),
  cancel: (id: string, reason?: string) =>
    axiosInstance.post<PurchaseOrder>(`/app/purchase-orders/${id}/cancel`, { reason }),
  remove: (id: string) =>
    axiosInstance.delete<void>(`/app/purchase-orders/${id}`),
  hardRemove: (id: string) =>
    axiosInstance.delete<void>(`/app/purchase-orders/${id}`, {
      params: { hard: 'true' },
    }),
};

export const reportApi = {
  salesDaily: (params?: { date?: string }) =>
    axiosInstance.get<SalesSummary>('/app/reports/sales-daily', { params }),

  salesRange: (params: {
    from: string;
    to: string;
    groupBy?: 'day' | 'week' | 'month';
  }) => axiosInstance.get<SalesRangePoint[]>('/app/reports/sales-range', { params }),

  topDrugs: (params?: { from?: string; to?: string; limit?: number }) =>
    axiosInstance.get<TopDrug[]>('/app/reports/top-drugs', { params }),

  inventoryStock: () =>
    axiosInstance.get<{
      items: Array<{
        _id: string;
        name: string;
        generic: string | null;
        form: string;
        strength: string | null;
        unit: string;
        category: string | null;
        reorderLevel: number;
        qty: number;
        valueCost: number;
        valueSell: number;
        batches: number;
      }>;
      summary: {
        drugs: number;
        totalQty: number;
        totalValue: number;
        totalValueSell: number;
        outOfStock: number;
        lowStock: number;
      };
    }>('/app/reports/inventory-stock'),

  customersTop: (params?: { limit?: number }) =>
    axiosInstance.get<{
      items: Array<{
        _id: string;
        name: string;
        phone: string | null;
        email: string | null;
        loyaltyPoints: number;
        totalSpent: number;
        lastPurchaseAt: string | null;
        createdAt: string;
      }>;
      summary: {
        count: number;
        totalSpent: number;
        totalLoyaltyPoints: number;
        avgSpent: number;
      };
    }>('/app/reports/customers-top', { params }),

  patientsDemographics: () =>
    axiosInstance.get<{
      total: number;
      byGender: Record<string, number>;
      ageBands: Record<string, number>;
      withAllergies: number;
      withChronic: number;
      topVisits: Array<{
        patient: { _id: string; name: string; phone: string | null } | null;
        visits: number;
        total: number;
      }>;
      patients: Array<{
        _id: string;
        name: string;
        phone: string | null;
        gender: string | null;
        dob: string | null;
        allergies: string[];
        chronicConditions: string[];
        createdAt: string;
      }>;
    }>('/app/reports/patients-demographics'),

  staffSummary: () =>
    axiosInstance.get<{
      items: Array<{
        _id: string;
        fullName: string;
        email: string;
        phone: string | null;
        role: 'owner' | 'branch_manager' | 'cashier';
        status: string;
        branchIds: string[];
        lastLoginAt: string | null;
        createdAt: string;
        salesCount30d: number;
        salesTotal30d: number;
      }>;
      summary: {
        total: number;
        byRole: Record<string, number>;
        byStatus: Record<string, number>;
        activeLast7d: number;
      };
    }>('/app/reports/staff-summary'),

  expiryLoss: (params?: { from?: string; to?: string; days?: number }) =>
    axiosInstance.get<ExpiryLoss>('/app/reports/expiry-loss', { params }),

  tax: (params: { from: string; to: string }) =>
    axiosInstance.get<TaxReport>('/app/reports/tax', { params }),
};

export const saleApi = {
  create: (payload: SalePayload) => axiosInstance.post<Sale>('/app/sales', payload),
  list: (params?: Record<string, unknown>) =>
    axiosInstance.get<Sale[]>('/app/sales', { params }),
  get: (id: string) => axiosInstance.get<Sale>(`/app/sales/${id}`),
  refund: (id: string, payload: RefundPayload) =>
    axiosInstance.post<Sale>(`/app/sales/${id}/refund`, payload),
  receipt: (id: string) =>
    axiosInstance.get<{ url: string }>(`/app/sales/${id}/receipt.pdf`),
};

export const settingsApi = {
  get: () => axiosInstance.get<TenantSettings>('/app/settings'),
  update: (payload: UpdateSettingsPayload) =>
    axiosInstance.patch<TenantSettings>('/app/settings', payload),
  signUpload: (payload: { folder: string; publicId?: string }) =>
    axiosInstance.post<UploadSignature>('/app/uploads/sign', payload),
};

export const supplierApi = {
  list: (params?: Record<string, unknown>) =>
    axiosInstance.get<Supplier[]>('/app/suppliers', { params }),
  create: (payload: SupplierPayload) =>
    axiosInstance.post<Supplier>('/app/suppliers', payload),
  get: (id: string) => axiosInstance.get<Supplier>(`/app/suppliers/${id}`),
  update: (id: string, payload: Partial<SupplierPayload>) =>
    axiosInstance.patch<Supplier>(`/app/suppliers/${id}`, payload),
  remove: (id: string) => axiosInstance.delete<void>(`/app/suppliers/${id}`),
  hardRemove: (id: string) =>
    axiosInstance.delete<void>(`/app/suppliers/${id}`, { params: { hard: 'true' } }),
};

export const userApi = {
  list: (params?: Record<string, unknown>) =>
    axiosInstance.get<User[]>('/app/users', { params }),
  invite: (payload: InviteUserPayload) =>
    axiosInstance.post<{ invited: boolean; user: User }>('/app/users/invite', payload),
  update: (id: string, payload: Partial<User>) =>
    axiosInstance.patch<User>(`/app/users/${id}`, payload),
  remove: (id: string) => axiosInstance.delete<void>(`/app/users/${id}`),
  hardRemove: (id: string) =>
    axiosInstance.delete<void>(`/app/users/${id}`, { params: { hard: 'true' } }),
};

export const aiApi = {
  chat: (message: string) =>
    axiosInstance.post<AiChatResponse>('/app/ai/chat', { message }),
  insights: (refresh = false) =>
    axiosInstance.get<AiInsight>('/app/ai/insights', {
      params: refresh ? { refresh: 'true' } : {},
    }),
  forecast: (refresh = false) =>
    axiosInstance.get<AiInsight>('/app/ai/forecast', {
      params: refresh ? { refresh: 'true' } : {},
    }),
  expiryRisk: (refresh = false) =>
    axiosInstance.get<AiInsight>('/app/ai/expiry-risk', {
      params: refresh ? { refresh: 'true' } : {},
    }),
  quota: () => axiosInstance.get<AiQuota>('/app/ai/quota'),
};