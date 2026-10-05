import axios from './axios';
import type { Customer, CustomerPayload, Sale } from '@/types';

export const customerApi = {
  list: (params?: Record<string, unknown>) =>
    axios.get<Customer[]>('/app/customers', { params }),
  create: (payload: CustomerPayload) => axios.post<Customer>('/app/customers', payload),
  get: (id: string) => axios.get<Customer>(`/app/customers/${id}`),
  update: (id: string, payload: Partial<CustomerPayload>) =>
    axios.patch<Customer>(`/app/customers/${id}`, payload),

  /** Soft delete — sets isActive to false. */
  remove: (id: string) => axios.delete<void>(`/app/customers/${id}`),

  /** Hard delete — permanently removes. Server ignores the flag today. */
  hardRemove: (id: string) =>
    axios.delete<void>(`/app/customers/${id}`, { params: { hard: 'true' } }),

  purchases: (id: string) => axios.get<Sale[]>(`/app/customers/${id}/purchases`),
};