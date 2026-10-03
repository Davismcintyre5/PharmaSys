import axios from './axios';
import type {
  Drug,
  DrugPayload,
  Batch,
  BatchPayload,
  StockMovement,
  StockAdjustPayload,
} from '@/types';

export const inventoryApi = {
  drugs: {
    list: (params?: Record<string, unknown>) =>
      axios.get<Drug[]>('/app/inventory/drugs', { params }),
    create: (payload: DrugPayload) => axios.post<Drug>('/app/inventory/drugs', payload),
    get: (id: string) => axios.get<Drug>(`/app/inventory/drugs/${id}`),
    update: (id: string, payload: Partial<DrugPayload>) =>
      axios.patch<Drug>(`/app/inventory/drugs/${id}`, payload),
    remove: (id: string) => axios.delete<void>(`/app/inventory/drugs/${id}`),
    addBatch: (id: string, payload: BatchPayload) =>
      axios.post<Batch>(`/app/inventory/drugs/${id}/batches`, payload),
    lowStock: () => axios.get<Drug[]>('/app/inventory/low-stock'),
    expiring: (params?: { days?: number }) =>
      axios.get<Batch[]>('/app/inventory/expiring', { params }),
  },
  batches: {
    list: (drugId: string) =>
      axios.get<Batch[]>('/app/inventory/batches', { params: { drugId } }),
    update: (id: string, payload: Partial<BatchPayload>) =>
      axios.patch<Batch>(`/app/inventory/batches/${id}`, payload),
    remove: (id: string) => axios.delete<void>(`/app/inventory/batches/${id}`),
  },
  movements: {
    list: (params?: { drugId?: string; page?: number; limit?: number }) =>
      axios.get<StockMovement[]>('/app/inventory/movements', { params }),
  },
  adjust: (payload: StockAdjustPayload) =>
    axios.post<StockMovement>('/app/inventory/adjust', payload),
};