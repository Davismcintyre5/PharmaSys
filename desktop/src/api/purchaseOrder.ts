import axios from './axios';
import type { PurchaseOrder, PurchaseOrderPayload, ReceivePayload } from '@/types';

export const purchaseOrderApi = {
  list: (params?: Record<string, unknown>) =>
    axios.get<PurchaseOrder[]>('/app/purchase-orders', { params }),

  create: (payload: PurchaseOrderPayload) =>
    axios.post<PurchaseOrder>('/app/purchase-orders', payload),

  get: (id: string) => axios.get<PurchaseOrder>(`/app/purchase-orders/${id}`),

  send: (id: string) =>
    axios.post<PurchaseOrder>(`/app/purchase-orders/${id}/send`),

  receive: (id: string, payload: ReceivePayload) =>
    axios.post<PurchaseOrder>(`/app/purchase-orders/${id}/receive`, payload),

  cancel: (id: string, reason?: string) =>
    axios.post<PurchaseOrder>(`/app/purchase-orders/${id}/cancel`, { reason }),

  remove: (id: string) => axios.delete<void>(`/app/purchase-orders/${id}`),

  hardRemove: (id: string) =>
    axios.delete<void>(`/app/purchase-orders/${id}`, { params: { hard: 'true' } }),
};