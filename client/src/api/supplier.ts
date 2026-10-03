import axios from './axios';
import type { Supplier, SupplierPayload } from '@/types';

export const supplierApi = {
  list: (params?: Record<string, unknown>) =>
    axios.get<Supplier[]>('/app/suppliers', { params }),
  create: (payload: SupplierPayload) => axios.post<Supplier>('/app/suppliers', payload),
  get: (id: string) => axios.get<Supplier>(`/app/suppliers/${id}`),
  update: (id: string, payload: Partial<SupplierPayload>) =>
    axios.patch<Supplier>(`/app/suppliers/${id}`, payload),
  remove: (id: string) => axios.delete<void>(`/app/suppliers/${id}`),
};