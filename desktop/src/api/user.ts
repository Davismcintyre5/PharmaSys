import axios from './axios';
import type { User, InviteUserPayload } from '@/types';

export const userApi = {
  list: (params?: Record<string, unknown>) =>
    axios.get<User[]>('/app/users', { params }),

  invite: (payload: InviteUserPayload) =>
    axios.post<{ invited: boolean; user: User }>('/app/users/invite', payload),

  update: (id: string, payload: Partial<User>) =>
    axios.patch<User>(`/app/users/${id}`, payload),

  /** Soft delete — sets status to 'suspended'. */
  remove: (id: string) =>
    axios.delete<void>(`/app/users/${id}`),

  /** Hard delete — permanently removes the user. Server ignores the flag today. */
  hardRemove: (id: string) =>
    axios.delete<void>(`/app/users/${id}`, { params: { hard: 'true' } }),
};