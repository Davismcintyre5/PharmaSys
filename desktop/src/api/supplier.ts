import axios from './axios';
import type { Supplier, SupplierPayload } from '@/types';

export const supplierApi = {
  list: (params?: Record<string, unknown>) =>
    axios.get<Supplier[]>('/app/suppliers', { params }),
  create: (payload: SupplierPayload) => axios.post<Supplier>('/app/suppliers', payload),
  get: (id: string) => axios.get<Supplier>(`/app/suppliers/${id}`),
  update: (id: string, payload: Partial<SupplierPayload>) =>
    axios.patch<Supplier>(`/app/suppliers/${id}`, payload),

  /** Soft delete — sets isActive to false. */
  remove: (id: string) => axios.delete<void>(`/app/suppliers/${id}`),

  /** Hard delete — permanently removes. Server ignores the flag today. */
  hardRemove: (id: string) =>
    axios.delete<void>(`/app/suppliers/${id}`, { params: { hard: 'true' } }),
};