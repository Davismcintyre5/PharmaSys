import axios from './axios';
import type { Prescription, PrescriptionPayload } from '@/types';

export const prescriptionApi = {
  list: (params?: Record<string, unknown>) =>
    axios.get<Prescription[]>('/app/prescriptions', { params }),

  create: (payload: PrescriptionPayload) =>
    axios.post<Prescription>('/app/prescriptions', payload),

  get: (id: string) => axios.get<Prescription>(`/app/prescriptions/${id}`),

  update: (id: string, payload: Partial<PrescriptionPayload>) =>
    axios.patch<Prescription>(`/app/prescriptions/${id}`, payload),

  dispense: (id: string) =>
    axios.post<Prescription>(`/app/prescriptions/${id}/dispense`),

  /** Cancel a prescription — sets status to 'cancelled'. Blocked after dispense. */
  cancel: (id: string, reason?: string) =>
    axios.post<Prescription>(`/app/prescriptions/${id}/cancel`, { reason }),

  /** Soft delete — same as cancel, no reason required. */
  remove: (id: string) => axios.delete<void>(`/app/prescriptions/${id}`),

  /** Hard delete — permanently removes. Blocked if dispensed. */
  hardRemove: (id: string) =>
    axios.delete<void>(`/app/prescriptions/${id}`, { params: { hard: 'true' } }),
};