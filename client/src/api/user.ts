import axios from './axios';
import type { User, InviteUserPayload, Paginated } from '@/types';

export const userApi = {
  list: (params?: Record<string, unknown>) => axios.get<User[]>('/app/users', { params }),
  invite: (payload: InviteUserPayload) =>
    axios.post<{ invited: boolean; user: User }>('/app/users/invite', payload),
  get: (id: string) => axios.get<User>(`/app/users/${id}`),
  update: (id: string, payload: Partial<User>) => axios.patch<User>(`/app/users/${id}`, payload),
  remove: (id: string) => axios.delete<void>(`/app/users/${id}`),
};