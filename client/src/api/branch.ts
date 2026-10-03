import axios from './axios';
import type { Branch, BranchPayload } from '@/types';

export const branchApi = {
  list: () => axios.get<Branch[]>('/app/branches'),
  create: (payload: BranchPayload) => axios.post<Branch>('/app/branches', payload),
  get: (id: string) => axios.get<Branch>(`/app/branches/${id}`),
  update: (id: string, payload: Partial<BranchPayload>) =>
    axios.patch<Branch>(`/app/branches/${id}`, payload),
  deactivate: (id: string) =>
    axios.post<{ deactivated: boolean }>(`/app/branches/${id}/deactivate`),
};