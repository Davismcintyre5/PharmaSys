import axios from './axios';
import type { Patient, PatientPayload, Sale, Prescription } from '@/types';

export const patientApi = {
  list: (params?: Record<string, unknown>) => axios.get<Patient[]>('/app/patients', { params }),
  create: (payload: PatientPayload) => axios.post<Patient>('/app/patients', payload),
  get: (id: string) => axios.get<Patient>(`/app/patients/${id}`),
  update: (id: string, payload: Partial<PatientPayload>) =>
    axios.patch<Patient>(`/app/patients/${id}`, payload),

  /** Soft delete — sets isActive to false. */
  remove: (id: string) => axios.delete<void>(`/app/patients/${id}`),

  /** Hard delete — permanently removes. Server ignores the flag today. */
  hardRemove: (id: string) =>
    axios.delete<void>(`/app/patients/${id}`, { params: { hard: 'true' } }),

  sales: (id: string) => axios.get<Sale[]>(`/app/patients/${id}/sales`),
  prescriptions: (id: string) =>
    axios.get<Prescription[]>(`/app/patients/${id}/prescriptions`),
};