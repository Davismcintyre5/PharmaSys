/* ─── Re-exports ─── */
export * from './public';
export * from './app';

/* ─── Shared primitives ─── */
export type ID = string;

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginatedMeta;
}

export interface ApiErrorShape {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  requestId?: string;

  constructor(status: number, code: string, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export type SortOrder = 'asc' | 'desc';

export type Currency = 'KES' | 'UGX' | 'TZS' | 'NGN' | 'GHS' | 'ZAR' | 'USD' | string;
export type CountryCode = 'KE' | 'UG' | 'TZ' | 'NG' | 'GH' | 'ZA' | string;