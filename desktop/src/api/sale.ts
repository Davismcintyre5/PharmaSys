import axios from './axios';
import type { Sale, SalePayload, RefundPayload } from '@/types';

export const saleApi = {
  create: (payload: SalePayload) => axios.post<Sale>('/app/sales', payload),
  list: (params?: Record<string, unknown>) => axios.get<Sale[]>('/app/sales', { params }),
  get: (id: string) => axios.get<Sale>(`/app/sales/${id}`),
  refund: (id: string, payload: RefundPayload) =>
    axios.post<Sale>(`/app/sales/${id}/refund`, payload),
  receipt: (id: string) => axios.get<{ url: string }>(`/app/sales/${id}/receipt.pdf`),
};