export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
    insights: ['dashboard', 'insights'] as const,
  },
  inventory: {
    drugs: (params?: Record<string, unknown>) =>
      ['inventory', 'drugs', params ?? {}] as const,
    drug: (id: string) => ['inventory', 'drug', id] as const,
    lowStock: ['inventory', 'low-stock'] as const,
    expiring: (days?: number) => ['inventory', 'expiring', days ?? 30] as const,
    movements: (params?: Record<string, unknown>) =>
      ['inventory', 'movements', params ?? {}] as const,
    batches: (drugId: string) => ['inventory', 'batches', drugId] as const,
  },
  sales: {
    list: (params?: Record<string, unknown>) =>
      ['sales', 'list', params ?? {}] as const,
    detail: (id: string) => ['sales', 'detail', id] as const,
  },
  prescriptions: {
    list: (params?: Record<string, unknown>) =>
      ['prescriptions', 'list', params ?? {}] as const,
    detail: (id: string) => ['prescriptions', 'detail', id] as const,
  },
  patients: {
    list: (params?: Record<string, unknown>) =>
      ['patients', 'list', params ?? {}] as const,
    detail: (id: string) => ['patients', 'detail', id] as const,
    sales: (id: string) => ['patients', id, 'sales'] as const,
    prescriptions: (id: string) => ['patients', id, 'prescriptions'] as const,
  },
  customers: {
    list: (params?: Record<string, unknown>) =>
      ['customers', 'list', params ?? {}] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  suppliers: {
    list: (params?: Record<string, unknown>) =>
      ['suppliers', 'list', params ?? {}] as const,
    detail: (id: string) => ['suppliers', 'detail', id] as const,
  },
  purchaseOrders: {
    list: (params?: Record<string, unknown>) =>
      ['purchase-orders', 'list', params ?? {}] as const,
    detail: (id: string) => ['purchase-orders', 'detail', id] as const,
  },
  branches: {
    list: ['branches', 'list'] as const,
    detail: (id: string) => ['branches', 'detail', id] as const,
  },
  users: {
    list: (params?: Record<string, unknown>) =>
      ['users', 'list', params ?? {}] as const,
  },
  notifications: {
    list: (params?: Record<string, unknown>) =>
      ['notifications', 'list', params ?? {}] as const,
    unread: ['notifications', 'unread'] as const,
  },
  billing: {
    status: ['billing', 'status'] as const,
    invoice: ['billing', 'invoice'] as const,
  },
  ai: {
    quota: ['ai', 'quota'] as const,
    insights: ['ai', 'insights'] as const,
    forecast: ['ai', 'forecast'] as const,
    expiryRisk: ['ai', 'expiry-risk'] as const,
  },
  reports: {
    inventoryStock: ['reports', 'inventory-stock'] as const,
    customersTop: (limit?: number) =>
      ['reports', 'customers-top', limit ?? 100] as const,
    staffSummary: ['reports', 'staff-summary'] as const,
    patientsDemographics: ['reports', 'patients-demographics'] as const,
    salesDaily: (date?: string) => ['reports', 'sales-daily', date] as const,
    salesRange: (params: Record<string, unknown>) =>
      ['reports', 'sales-range', params] as const,
    topDrugs: (params?: Record<string, unknown>) =>
      ['reports', 'top-drugs', params ?? {}] as const,
    expiryLoss: (params?: Record<string, unknown>) =>
      ['reports', 'expiry-loss', params ?? {}] as const,
    tax: (params: Record<string, unknown>) =>
      ['reports', 'tax', params] as const,
  },
  settings: {
    tenant: ['settings', 'tenant'] as const,
  },
  public: {
    brand: ['public', 'brand'] as const,
    settings: ['public', 'settings'] as const,
    plans: ['public', 'plans'] as const,
    legal: ['public', 'legal'] as const,
    legalByType: (type: string) => ['public', 'legal', type] as const,
    downloads: ['public', 'downloads'] as const,
    chatInfo: ['public', 'chat-info'] as const,
  },
};