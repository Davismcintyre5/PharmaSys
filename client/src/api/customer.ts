import axios from './axios';
import type { Customer, CustomerPayload, Sale, Paginated } from '@/types';

export const customerApi = {
  list: (params?: Record<string, unknown>) =>
    axios.get<Customer[]>('/app/customers', { params }),
  create: (payload: CustomerPayload) => axios.post<Customer>('/app/customers', payload),
  get: (id: string) => axios.get<Customer>(`/app/customers/${id}`),
  update: (id: string, payload: Partial<CustomerPayload>) =>
    axios.patch<Customer>(`/app/customers/${id}`, payload),
  remove: (id: string) => axios.delete<void>(`/app/customers/${id}`),
  purchases: (id: string) => axios.get<Sale[]>(`/app/customers/${id}/purchases`),
};